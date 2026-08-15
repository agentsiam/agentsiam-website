/**
 * Beds24 REST API v2, server side only.
 *
 * Nothing in this file may be imported from a client component: it reads
 * BEDS24_REFRESH_TOKEN, which is a durable credential with write scope on the whole
 * account. The browser never sees a token and never talks to api.beds24.com -- it talks
 * to /api/booking/*, which calls this.
 *
 * Beds24 stays the single source of truth for availability, rates and inventory. This
 * file reads them; it does not keep a second copy to drift out of sync. The one thing it
 * writes is a booking request (status "request"), which is the "send us a request" half
 * of the property page. The "pay now" half never comes through here at all -- it hands
 * off to the Beds24 hosted booking page, because taking card details would put this site
 * in PCI scope for no gain.
 *
 * Auth: a refresh token mints a 24-hour access token. Refresh tokens do not expire while
 * they are used at least once every 30 days, so there is nothing to rotate on a schedule.
 * The minted token is cached in module scope, which on Vercel means per warm instance --
 * a cold start mints a new one, which is cheap and correct.
 */

import { LOTUS_HOUSE } from "@/lib/property";

const API_BASE = "https://api.beds24.com/v2";

const REFRESH_TOKEN = process.env.BEDS24_REFRESH_TOKEN ?? "";

/** Beds24 property and room IDs. Numbers, not slugs, in their API. */
const { propertyId: PROPERTY_ID, roomId: ROOM_ID } = LOTUS_HOUSE.beds24;

/**
 * Whether live booking can work at all. The IDs are compiled in, so this comes down to
 * whether the refresh token is set. When false every route in /api/booking answers 503
 * and the property page falls back to the enquiry call to action, so a missing env var
 * degrades into a usable page rather than a broken one.
 */
export const BEDS24_READY = Boolean(REFRESH_TOKEN);

/**
 * Which status a website booking request is created with.
 *
 * - `request` puts it in the Beds24 calendar as a pending request. Beds24 counts it
 *   against availability, so the nights come off Airbnb and the other channels while
 *   you decide. That is the point -- it is what stops the same nights being sold twice
 *   between the request arriving and being answered -- but an unanswered request quietly
 *   blocks sellable nights, so they need to be actioned rather than left.
 * - `inquiry` does not touch the calendar at all. Nothing gets blocked, and nothing is
 *   protected: two people can request the same nights, and a channel can sell them.
 *
 * Flip this one constant to change which behaviour the site has. It is deliberately not
 * an env var: it changes what a guest is promised, so it belongs in a reviewed diff.
 */
export const REQUEST_STATUS: "request" | "inquiry" = "request";

/**
 * Cache tag for everything that depends on the allotment.
 *
 * Lotus House is sold on six channels at once, so the calendar can change without anyone
 * touching this site. Beds24 is the channel manager and therefore already holds the one
 * true allotment -- the only thing that can go stale is our copy of it, and this tag is
 * how that copy gets thrown away the moment Beds24 says something changed.
 *
 * /api/booking/webhook clears it. Wire the property's webhook URL to that route (see the
 * README) and a booking taken on Airbnb at 14:02:31 is off this calendar at 14:02:32.
 */
export const ALLOTMENT_TAG = "beds24-allotment";

/**
 * Backstop TTL, in seconds, for when a webhook is missed or not configured yet.
 *
 * Deliberately short. Beds24 bills each call against a five-minute credit limit -- one
 * credit per calendar read, about a hundred per window -- so reading through on every
 * page view would be both wasteful and, on a traffic spike, self-limiting. Thirty seconds
 * caps this site at ten reads per window no matter how many people are looking, while
 * being far below the window in which a human could pick dates and press send.
 *
 * The guarantee that actually matters does not come from this number. Every write passes
 * Beds24's `checkAvailability`, so Beds24 itself refuses a booking for nights that are
 * gone. A stale calendar can waste someone's click; it cannot double-book the house.
 */
const ALLOTMENT_TTL = 30;

export class Beds24Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Beds24Error";
  }
}

// -- dates ----------------------------------------------------------------------
//
// Every date here is a plain YYYY-MM-DD calendar date, never a timestamp. A night is a
// property of the calendar in Chiang Mai, not of the visitor's clock, so all arithmetic
// runs in UTC: a guest in Los Angeles picking "20 December" must get the same night as a
// guest in Bangkok picking it.

export function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

/** Nights between two dates. A 20th→24th stay is four nights: 20, 21, 22, 23. */
export function nightsBetween(arrival: string, departure: string): number {
  return Math.round(
    (parseDate(departure).getTime() - parseDate(arrival).getTime()) / 86_400_000,
  );
}

/** Today in the property's own timezone, so "today" flips at midnight in Chiang Mai. */
export function today(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a well-formed calendar date that actually exists (rejects 2026-02-31). */
export function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const parsed = parseDate(value);
  return !Number.isNaN(parsed.getTime()) && formatDate(parsed) === value;
}

// -- auth -----------------------------------------------------------------------

let tokenCache: { token: string; expiresAt: number } | null = null;
let tokenInFlight: Promise<string> | null = null;

async function mintToken(): Promise<string> {
  const response = await fetch(`${API_BASE}/authentication/token`, {
    headers: { refreshToken: REFRESH_TOKEN },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || typeof payload?.token !== "string") {
    throw new Beds24Error(
      `Could not mint a Beds24 access token (HTTP ${response.status}). ` +
        "The refresh token may have gone unused for 30 days and lapsed.",
    );
  }

  // expiresIn is seconds; 86400 in practice. Re-mint a minute early so a call already in
  // flight never carries a token that expires mid-request.
  const ttl = Number(payload.expiresIn) || 3600;
  tokenCache = { token: payload.token, expiresAt: Date.now() + (ttl - 60) * 1000 };
  return payload.token;
}

async function accessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token;
  // Dedupe concurrent misses. Without this a burst of requests against a cold instance
  // mints one token each and burns through the five-minute credit limit for nothing.
  tokenInFlight ??= mintToken().finally(() => {
    tokenInFlight = null;
  });
  return tokenInFlight;
}

// -- transport ------------------------------------------------------------------

type Query = Record<string, string | number | boolean>;

async function apiGet<T>(path: string, query: Query, revalidate: number): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { token: await accessToken(), Accept: "application/json" },
    // Everything read here is allotment-derived, so it all carries the one tag and all of
    // it is dropped together. A price and an availability that disagree would be worse
    // than either being briefly stale.
    next: { revalidate, tags: [ALLOTMENT_TAG] },
  });
  const payload = await response.json().catch(() => null);

  // Beds24 answers 200 with {success:false} for domain errors, so the status code alone
  // is not enough to tell a good response from a bad one.
  if (!response.ok || payload?.success === false) {
    throw new Beds24Error(payload?.error ?? `Beds24 GET ${path} failed (${response.status})`);
  }
  return payload as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  assertWritesAllowed(path);

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      token: await accessToken(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Beds24Error(payload?.error ?? `Beds24 POST ${path} failed (${response.status})`);
  }
  return payload as T;
}

// -- availability ---------------------------------------------------------------

export type Night = {
  /** The night's own date. A stay's last night is the day before departure. */
  date: string;
  available: boolean;
  /** Nightly rate in the property's currency, or null where Beds24 has none loaded. */
  price: number | null;
  /** Minimum nights when arriving on this date. */
  minStay: number;
};

type CalendarResponse = {
  data?: {
    calendar?: {
      from: string;
      to: string;
      numAvail?: number;
      price1?: number;
      price2?: number;
      minStay?: number;
    }[];
  }[];
};

/**
 * Per-night availability and rates for a window.
 *
 * Beds24 returns run-length ranges ("2026-09-01 to 2026-09-03, 0 available"); the
 * calendar in the browser wants one entry per night, so the ranges are expanded here
 * rather than in the component.
 *
 * `price2` is the nightly rate, and it is what the offers endpoint sums into a total --
 * verified against a live quote. `price1` is a separate base figure that does not
 * correspond to what a guest pays, so it is deliberately dropped.
 */
/**
 * How far ahead a stay can start. Beds24 will happily hold nights in 2031; a guest
 * booking three years out is not a real guest, and the hold is real either way.
 */
export const MAX_MONTHS_AHEAD = 18;

/**
 * Shared by every route that writes a booking, so the two cannot drift apart.
 *
 * The point is blast radius. Date validity, minimum stay and guest count were already
 * checked, but nothing bounded how *much* calendar a single request could take. One POST
 * asking for 2030-01-01 to 2030-12-31 was a 365 night hold, and holds block the nights on
 * all six channels the property sells on until something releases them.
 *
 * Returns null when the stay is fine, or the message to show when it is not.
 */
export function stayWindowError(arrival: string, departure: string, maxNights: number): string | null {
  const nights = nightsBetween(arrival, departure);
  if (nights > maxNights) {
    return `Stays longer than ${maxNights} nights are arranged by email rather than booked online.`;
  }

  const horizon = new Date(parseDate(today()));
  horizon.setMonth(horizon.getMonth() + MAX_MONTHS_AHEAD);
  if (parseDate(arrival) > horizon) {
    return `We take bookings up to ${MAX_MONTHS_AHEAD} months ahead. Please email us for anything further out.`;
  }

  return null;
}

/**
 * Refuses to write to Beds24 from anywhere that is not production.
 *
 * There is one Beds24 account and it is the live one: no sandbox, no test mode. So a
 * preview deployment, a local dev server and a colleague clicking around a shared link
 * all write real holds into the real calendar, which really does block real nights on
 * six channels. Reads are left alone, so a preview still shows a live calendar and real
 * prices, which is the part anyone reviewing the site actually needs.
 *
 * Set BEDS24_ALLOW_WRITES=1 to do the end-to-end test booking against a preview, then
 * unset it. Production needs no flag: VERCEL_ENV is "production" there and nowhere else.
 *
 * Guarding apiPost rather than each route is deliberate. Every write goes through this
 * one function, so a route added later is covered without anyone remembering to.
 */
function assertWritesAllowed(path: string): void {
  if (process.env.VERCEL_ENV === "production") return;
  if (process.env.BEDS24_ALLOW_WRITES === "1") return;
  throw new Beds24Error(
    `Refusing to write to Beds24 from ${process.env.VERCEL_ENV ?? "a local environment"} ` +
      `(POST ${path}). There is only the live account, so this would block real nights. ` +
      `Set BEDS24_ALLOW_WRITES=1 if that is genuinely what you want.`,
  );
}

export async function getCalendar(startDate: string, endDate: string): Promise<Night[]> {
  const payload = await apiGet<CalendarResponse>(
    "/inventory/rooms/calendar",
    {
      roomId: ROOM_ID,
      startDate,
      endDate,
      includeNumAvail: true,
      includePrices: true,
      includeMinStay: true,
    },
    ALLOTMENT_TTL,
  );

  const nights: Night[] = [];
  for (const range of payload.data?.[0]?.calendar ?? []) {
    // ISO dates compare correctly as strings, which keeps this loop off Date entirely.
    for (let date = range.from; date <= range.to; date = addDays(date, 1)) {
      nights.push({
        date,
        available: (range.numAvail ?? 0) > 0,
        price: typeof range.price2 === "number" ? range.price2 : null,
        minStay: range.minStay ?? 1,
      });
    }
  }
  return nights;
}

// -- quoting --------------------------------------------------------------------

export type Quote = {
  arrival: string;
  departure: string;
  nights: number;
  /** False when Beds24 returns no bookable offer for the stay, whatever the reason. */
  available: boolean;
  /** Total for the whole stay, from Beds24. Null when there is no offer to price. */
  total: number | null;
  offerId: number | null;
};

type OffersResponse = {
  data?: {
    roomId?: number;
    offers?: { offerId?: number; offerName?: string; price?: number; unitsAvailable?: number }[];
  }[];
};

/**
 * What Beds24 would charge for a specific stay.
 *
 * This is the only number the site is allowed to show as a total. Summing nightly rates
 * from the calendar would ignore length-of-stay pricing, and a total a guest is quoted
 * and then not charged is worse than no total at all.
 *
 * An empty `offers` array is Beds24's way of saying "not bookable" -- sold out, under
 * the minimum stay, past a cut-off. It does not distinguish between those, so neither
 * does this.
 */
export async function getQuote(
  arrival: string,
  departure: string,
  adults: number,
  children = 0,
  /**
   * Bypasses the cache. Required on any path that is about to write or charge.
   *
   * The browsing quote can be up to ALLOTMENT_TTL stale, which is fine for a number
   * someone is reading. The moment that number becomes the amount on a card, or the price
   * written onto a Beds24 booking, a stale read means charging yesterday's rate -- so
   * /api/booking/checkout and /api/booking/request both pass true here.
   */
  fresh = false,
): Promise<Quote> {
  const query = {
    propertyId: PROPERTY_ID,
    arrival,
    departure,
    numAdults: adults,
    numChildren: children,
  };
  const payload = fresh
    ? await apiGetUncached<OffersResponse>("/inventory/rooms/offers", query)
    : await apiGet<OffersResponse>("/inventory/rooms/offers", query, ALLOTMENT_TTL);

  const room = payload.data?.find((entry) => entry.roomId === ROOM_ID) ?? payload.data?.[0];
  const offer =
    room?.offers?.find((candidate) => (candidate.unitsAvailable ?? 0) > 0) ?? room?.offers?.[0];

  return {
    arrival,
    departure,
    nights: nightsBetween(arrival, departure),
    available: typeof offer?.price === "number" && (offer.unitsAvailable ?? 0) > 0,
    total: typeof offer?.price === "number" ? offer.price : null,
    offerId: typeof offer?.offerId === "number" ? offer.offerId : null,
  };
}

// -- writing --------------------------------------------------------------------

export type BookingRequestInput = {
  arrival: string;
  departure: string;
  adults: number;
  children: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  /** Which language the guest wrote in, so the reply goes back in it. */
  locale: string;
  /** Total from getQuote. Passed so the request carries the price we quoted. */
  total: number | null;
};

type BookingPostResponse = {
  success?: boolean;
  new?: { id?: number };
  modified?: { id?: number };
  errors?: unknown;
}[];

/**
 * Creates the booking as a request for manual confirmation.
 *
 * `checkAvailability` makes Beds24 refuse to save the booking if the nights are gone,
 * which closes the window between the guest loading the calendar and pressing send --
 * without it the site would cheerfully accept requests for nights Airbnb sold an hour
 * ago. A refusal surfaces as a failed write, which the route turns into "those dates
 * just went".
 *
 * `notifyGuest` is off: Beds24's own confirmation email is written for a confirmed
 * booking and would tell someone their stay is booked when it is pending. The route
 * sends our own wording instead.
 */
export async function createBookingRequest(input: BookingRequestInput): Promise<number | null> {
  const payload = await apiPost<BookingPostResponse>("/bookings", [
    {
      roomId: ROOM_ID,
      status: REQUEST_STATUS,
      arrival: input.arrival,
      departure: input.departure,
      numAdult: input.adults,
      numChild: input.children,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      mobile: input.phone,
      // `message` is the guest's own words; `notes` is ours. Keeping them apart means the
      // Beds24 booking screen shows the request as the guest wrote it.
      message: input.message,
      notes: `Request from agentsiam.com (${input.locale}). Awaiting confirmation.`,
      referer: "agentsiam.com",
      flagText: "Website request",
      ...(input.total !== null ? { price: input.total } : {}),
      actions: {
        checkAvailability: true,
        notifyHost: true,
        notifyGuest: false,
        // Let the request propagate to the channels, so the nights it holds stop being
        // sellable elsewhere. Pointless if REQUEST_STATUS is "inquiry", harmless too.
        allowWebhooks: true,
        // Turn the quoted price into an actual invoice line rather than a bare number.
        autoInvoiceItemCharge: input.total !== null,
      },
    },
  ]);

  return bookingIdFrom(payload);
}

/** Unwraps Beds24's per-item POST result, which reports failure inside a 200. */
function bookingIdFrom(payload: BookingPostResponse): number | null {
  const result = Array.isArray(payload) ? payload[0] : null;
  if (!result?.success) {
    throw new Beds24Error(
      typeof result?.errors === "string"
        ? result.errors
        : JSON.stringify(result?.errors ?? "Beds24 rejected the booking"),
    );
  }
  return result.new?.id ?? result.modified?.id ?? null;
}

// -- pay now ---------------------------------------------------------------------
//
// The instant-booking path. Stripe takes the payment on our own domain and Beds24 is told
// about it afterwards, so the guest never leaves the site. Beds24 stays the calendar of
// record throughout.
//
// The ordering below is the whole design, and it exists to serve one rule: never take
// money for nights we cannot deliver.
//
//   1. Hold the nights in Beds24 first, with checkAvailability, before a card is touched.
//   2. Only then ask Stripe for money.
//   3. Confirm the held booking once the payment clears.
//
// Charging first and booking afterwards means that every time the house sells on another
// channel during the ninety seconds someone spends typing a card number, we have taken
// money for a room that no longer exists. A hold costs nothing and can be released; a
// refund is a bad day for the guest and a support conversation for us.

/**
 * Status a booking sits in between "card details entered" and "payment cleared".
 *
 * `new` is Beds24's own "arrived but not yet processed" state and counts against
 * availability, which is exactly what a hold must do. It also reads as visibly not-yet-a
 * reservation on the Beds24 calendar, so an abandoned checkout does not look like a real
 * guest about to turn up.
 */
export const HOLD_STATUS = "new" as const;

/** How long an unpaid hold may live before release-holds sweeps it away. */
export const HOLD_MINUTES = 30;

export type HoldInput = {
  arrival: string;
  departure: string;
  adults: number;
  children: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  locale: string;
  total: number;
};

/**
 * Takes the nights out of inventory pending payment.
 *
 * `checkAvailability` is what makes this safe: if the nights went while the guest was
 * choosing, Beds24 refuses and no card is ever charged. `allowWebhooks` pushes the hold
 * out to the channels, so the same nights stop being sellable on Airbnb the moment
 * someone here starts paying for them.
 */
export async function createHold(input: HoldInput): Promise<number | null> {
  const payload = await apiPost<BookingPostResponse>("/bookings", [
    {
      roomId: ROOM_ID,
      status: HOLD_STATUS,
      arrival: input.arrival,
      departure: input.departure,
      numAdult: input.adults,
      numChild: input.children,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      mobile: input.phone,
      message: input.message,
      notes: `Online booking from agentsiam.com (${input.locale}). Awaiting card payment.`,
      referer: "agentsiam.com",
      flagText: "Awaiting payment",
      price: input.total,
      actions: {
        checkAvailability: true,
        notifyHost: false,
        notifyGuest: false,
        allowWebhooks: true,
      },
    },
  ]);
  return bookingIdFrom(payload);
}

/**
 * Records which Stripe PaymentIntent is paying for a hold.
 *
 * Kept in `custom1` so the link lives in Beds24 rather than only in our logs: if a payment
 * has to be traced or refunded months later, the Stripe reference is on the booking. It is
 * also what release-holds uses to tell an abandoned checkout apart from a booking someone
 * entered by hand, which must never be swept.
 */
export async function attachPaymentIntent(
  bookingId: number,
  paymentIntentId: string,
): Promise<void> {
  await apiPost<BookingPostResponse>("/bookings", [
    { id: bookingId, custom1: `stripe:${paymentIntentId}` },
  ]);
}

/**
 * Turns a paid hold into a confirmed booking, with the money recorded against it.
 *
 * Two invoice lines, because the Beds24 invoice is a ledger: a `charge` for the stay and a
 * `payment` for what Stripe took. Only the charge would leave every online booking looking
 * unpaid; only the payment would leave it looking like a refund.
 *
 * Idempotent. Stripe retries webhooks, and a retried `payment_intent.succeeded` must not
 * add a second payment line -- so the booking's existing lines are read first and the
 * invoice write is skipped when this PaymentIntent is already on it.
 */
export async function confirmPaidBooking(input: {
  bookingId: number;
  paymentIntentId: string;
  amount: number;
  chargeDescription: string;
}): Promise<{ alreadyDone: boolean }> {
  const existing = await apiGetUncached<{
    data?: { id?: number; status?: string; invoiceItems?: { description?: string }[] }[];
  }>("/bookings", { id: input.bookingId, includeInvoiceItems: true });

  const booking = existing.data?.[0];
  const alreadyPaid = booking?.invoiceItems?.some((item) =>
    (item.description ?? "").includes(input.paymentIntentId),
  );
  if (alreadyPaid && booking?.status === "confirmed") {
    return { alreadyDone: true };
  }

  await apiPost<BookingPostResponse>("/bookings", [
    {
      id: input.bookingId,
      status: "confirmed",
      flagText: "Paid online",
      ...(alreadyPaid
        ? {}
        : {
            invoiceItems: [
              {
                type: "charge",
                description: input.chargeDescription,
                qty: 1,
                amount: input.amount,
              },
              {
                type: "payment",
                description: `Stripe ${input.paymentIntentId}`,
                qty: 1,
                amount: input.amount,
              },
            ],
          }),
      actions: { notifyHost: true, notifyGuest: false, allowWebhooks: true },
    },
  ]);
  return { alreadyDone: false };
}

/** Releases a hold. Used when a payment fails, is abandoned, or is swept. */
export async function cancelBooking(bookingId: number, why: string): Promise<void> {
  await apiPost<BookingPostResponse>("/bookings", [
    {
      id: bookingId,
      status: "cancelled",
      flagText: why,
      actions: { notifyHost: false, notifyGuest: false, allowWebhooks: true },
    },
  ]);
}

/**
 * Holds that were never paid for and are now older than HOLD_MINUTES.
 *
 * Abandonment is silent: a guest who closes the tab mid-payment generates no Stripe event
 * at all, so nothing will ever arrive to tell us to release these. They have to be found
 * by looking. Without this sweep every closed tab would block its nights on every channel
 * indefinitely, which is a worse failure than not offering online payment in the first
 * place.
 *
 * The `custom1` check means only bookings this site created and marked as awaiting payment
 * can ever be returned, so a booking typed in by hand cannot be swept up by it.
 */
export async function findStaleHolds(): Promise<
  { id: number; arrival: string; paymentIntentId: string }[]
> {
  // Compared as numbers, not as strings.
  //
  // Beds24 returns bookingTime as "2026-08-14T20:19:05Z" (UTC, verified against a live
  // booking). An earlier version built the cutoff as "2026-08-14 19:49:05" and compared
  // the two as strings -- and since "T" (0x54) sorts after " " (0x20), every comparison
  // was false and the sweep silently released nothing, ever. Parsing both sides removes
  // the whole class of bug rather than making the two strings match.
  const cutoff = Date.now() - HOLD_MINUTES * 60_000;
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);

  const payload = await apiGetUncached<{
    data?: { id?: number; arrival?: string; bookingTime?: string; custom1?: string }[];
  }>("/bookings", {
    propertyId: PROPERTY_ID,
    status: HOLD_STATUS,
    bookingTimeFrom: since,
  });

  return (payload.data ?? [])
    .filter((booking) => {
      if (typeof booking.id !== "number") return false;
      if (!(booking.custom1 ?? "").startsWith("stripe:")) return false;
      const created = Date.parse(booking.bookingTime ?? "");
      // An unparseable timestamp means we do not know how old this is, so it stays.
      return Number.isFinite(created) && created < cutoff;
    })
    .map((booking) => ({
      id: booking.id as number,
      arrival: booking.arrival ?? "",
      // Carried through so the caller can ask Stripe about this exact payment rather
      // than searching for it. See the note in release-holds.
      paymentIntentId: (booking.custom1 ?? "").slice("stripe:".length),
    }));
}

/**
 * Reads that must never be cached, because a write is about to be decided from them.
 * The tagged, TTL'd reads used by the calendar would be actively dangerous here.
 */
async function apiGetUncached<T>(path: string, query: Query): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    headers: { token: await accessToken(), Accept: "application/json" },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Beds24Error(payload?.error ?? `Beds24 GET ${path} failed (${response.status})`);
  }
  return payload as T;
}
