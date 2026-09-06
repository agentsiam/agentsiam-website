"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { LOTUS_HOUSE } from "@/lib/property";
import { CONTACT_EMAIL } from "@/lib/site";
import { PAYMENTS_ENABLED, PaymentForm, retrievePaymentStatus } from "@/components/payment-form";

/**
 * The booking panel: pick dates against live Beds24 availability, see the real total,
 * then either send us a request or go and pay.
 *
 * Why a calendar and not two date inputs. Lotus House is one unit with long stays on it,
 * so whole months are genuinely gone -- at the time of writing October and November had
 * no free nights at all. Two blank date fields would let a guest pick, submit, and only
 * then be told no, over and over, with no way to find the dates that do work. Showing
 * what is free is the difference between a booking form and a bookable page.
 *
 * Two paths out, because they are different promises and should not look alike:
 *
 * - **Request to book** posts to /api/booking/request, which writes it to Beds24 as a
 *   request for us to confirm. No money changes hands. This is the path that works today.
 * - **Book now, pay online** holds the nights in Beds24, then takes the money with Stripe
 *   on this page. The guest never leaves the site and Beds24 is never named. It renders
 *   only when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set, so a site without Stripe
 *   configured simply does not offer a payment it cannot take.
 *
 * Nothing here decides availability or price. The calendar and the total both come from
 * Beds24 through our own routes, and the request is re-priced server side before it is
 * written, so a total shown here is a total Beds24 stands behind.
 *
 * The rule that shapes most of the state below: **the panel never asserts more than it
 * knows.** "Those dates are not available" is a fact about the calendar. A 502 from the
 * pricing route, a rate limit, or a dropped connection are facts about us, and saying the
 * house is booked because our own API fell over is a lie that costs a booking. So a quote
 * has four outcomes, not two, and only one of them closes the door.
 */

type Night = { date: string; available: boolean; price: number | null; minStay: number };

/**
 * dates       picking a stay
 * request     filling in the "ask us" form
 * payDetails  filling in name/email before paying
 * paying      Stripe Payment Element is up, nights are held
 * confirming  back from a redirect payment, asking Stripe what happened
 * requested   request sent, waiting on us
 * paid        paid and confirmed
 * unconfirmed back from a redirect payment and we cannot tell -- never "pay again"
 */
type Mode =
  | "dates"
  | "request"
  | "payDetails"
  | "paying"
  | "confirming"
  | "requested"
  | "paid"
  | "unconfirmed";

type Quote = {
  arrival: string;
  departure: string;
  nights: number;
  available: boolean;
  total: number | null;
  currency: string;
};

/** What our routes send alongside the human string. Codes are stable; strings are not. */
type ApiError = {
  error?: string;
  code?: string;
  retryAfter?: number;
  maxNights?: number;
  maxGuests?: number;
  minNights?: number;
  maxMonthsAhead?: number;
};

/**
 * ok           Beds24 priced it
 * unavailable  Beds24 says no, or we asked for something invalid. An answer.
 * failed       our side broke, or the network did. NOT an answer.
 * rateLimited  too many attempts. Also not an answer, and it expires.
 */
type QuoteOutcome = {
  status: "ok" | "unavailable" | "failed" | "rateLimited";
  value: Quote | null;
  payload?: ApiError;
};

type Props = {
  t: Dictionary;
  locale: Locale;
  contactHref: string;
  privacyHref: string;
};

/** How far ahead to load. Beds24 has rates roughly eighteen months out; a year is plenty
 *  to book a holiday and keeps the payload small enough to fetch in one go. */
const HORIZON_DAYS = 365;

/**
 * Where an in-flight payment is written down so it can survive leaving the site.
 *
 * PromptPay always redirects and 3DS often does, which means the guest comes back to a
 * freshly mounted panel that knows nothing: no dates, no confirmation, no client secret.
 * Before this existed, the rational thing for that guest to do was pay again.
 *
 * sessionStorage rather than localStorage: it is scoped to the tab that left, which is
 * exactly the trip we are trying to survive, and it does not outlive the visit.
 */
const PAYMENT_STORE_KEY = "agentsiam:lotushouse:payment";

type StoredPayment = {
  clientSecret: string;
  bookingId: number | null;
  total: number;
  arrival: string;
  departure: string;
  adults: number;
  children: number;
  email: string;
  holdMinutes: number | null;
};

type Availability = { from: string; nights: Night[] };

/**
 * The free nights and their rates. Pure: it returns what the route said and touches no
 * state, so both the first load and the reload after a 409 go through one code path.
 * Null means we could not tell -- never "nothing is free".
 */
async function fetchAvailability(): Promise<Availability | null> {
  try {
    const response = await fetch(`/api/booking/availability?days=${HORIZON_DAYS}`);
    if (!response.ok) return null;
    return (await response.json()) as Availability;
  } catch {
    return null;
  }
}

function readStoredPayment(): StoredPayment | null {
  try {
    const raw = window.sessionStorage.getItem(PAYMENT_STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPayment;
    return typeof parsed?.clientSecret === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredPayment(value: StoredPayment): void {
  try {
    window.sessionStorage.setItem(PAYMENT_STORE_KEY, JSON.stringify(value));
  } catch {
    // A browser with storage blocked still gets a working panel; it just cannot survive
    // a redirect. Stripe puts the client secret in the return URL as well, which covers
    // most of it.
  }
}

function clearStoredPayment(): void {
  try {
    window.sessionStorage.removeItem(PAYMENT_STORE_KEY);
  } catch {
    // ignore
  }
}

const field =
  "rounded-lg border-[1.5px] border-hairline bg-bg px-3.5 py-3 text-sm outline-none focus-visible:border-ink aria-[invalid=true]:border-deep-red";

/** Disabled fill, from the muted token rather than a hex. */
const disabledFill = "disabled:cursor-not-allowed disabled:bg-muted/40";

const primaryButton =
  `min-h-11 w-full cursor-pointer rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-primary ${disabledFill}`;

const outlineButton =
  "min-h-11 w-full cursor-pointer rounded-full border-[1.5px] border-ink px-6 py-3.5 text-[15px] font-semibold text-ink hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:border-muted/40 disabled:text-muted/70 disabled:hover:bg-transparent disabled:hover:text-muted/70";

// -- dates ----------------------------------------------------------------------
// Same rule as the server: plain YYYY-MM-DD, arithmetic in UTC. A guest in another
// timezone must get the same night as a guest in Chiang Mai.

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

function nightsBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000);
}

/**
 * Intl locale for each of our three.
 *
 * Thai is pinned to the Gregorian calendar. CLDR's default for `th` is the Buddhist era,
 * which would print 2569 for 2026 -- correct Thai, but the guest is picking dates that
 * Beds24, their airline and their own booking confirmation all state in Gregorian, and a
 * calendar that disagrees with the confirmation email is a support ticket.
 */
const INTL_LOCALE: Record<Locale, string> = {
  en: "en-GB",
  th: "th-TH-u-ca-gregory",
  zh: "zh-Hans",
};

/**
 * Our error codes, turned into the guest's own language.
 *
 * The routes carry English strings for logs and for any client that does not know the
 * codes. This panel does know them, so a Thai guest gets Thai rather than the server's
 * English -- and the copy can be warmer than a route is allowed to be.
 */
function messageFor(t: Dictionary, payload: ApiError): string {
  switch (payload.code) {
    case "dates_taken":
      return t.bkErrDatesTaken;
    case "unavailable":
      return t.bkErrUnavailable;
    case "quote_failed":
    case "payment_start_failed":
      return t.bkErrQuoteFailed;
    case "bad_contact":
      return t.bkErrBadContact;
    case "past_arrival":
      return t.bkErrPastArrival;
    case "not_configured":
      return t.bkErrNotConfigured;
    case "rate_limited":
      return t.bkErrRateLimited;
    case "bad_dates":
    case "malformed":
      return t.bkFormStale;
    case "min_stay":
      return t.minStayError.replace("{n}", String(payload.minNights ?? LOTUS_HOUSE.minStay));
    case "max_guests":
    case "bad_guests":
      return t.bkErrMaxGuests.replace("{n}", String(payload.maxGuests ?? LOTUS_HOUSE.maxGuests));
    case "max_stay":
    case "stay_too_long":
      return t.bkErrMaxStay.replace("{n}", String(payload.maxNights ?? LOTUS_HOUSE.maxStay));
    case "too_far_ahead":
      return payload.maxMonthsAhead
        ? t.bkErrTooFarAhead.replace("{n}", String(payload.maxMonthsAhead))
        : t.bookingFailed;
    default:
      // Deliberately not payload.error: the routes write English for the logs, and it
      // already names the address as plain text, which would print it twice beside the
      // mailto link below. A guest reading Thai gets Thai.
      return t.bookingFailed;
  }
}

/** Whether a failure is one a guest should be handed an address for. */
function wantsEmail(code: string | undefined): boolean {
  return (
    code === undefined ||
    code === "dates_taken" ||
    code === "quote_failed" ||
    code === "payment_start_failed" ||
    code === "not_configured" ||
    code === "hold_no_id" ||
    code === "rate_limited"
  );
}

export function BookingPanel({ t, locale, contactHref, privacyHref }: Props) {
  const [nights, setNights] = useState<Map<string, Night> | null>(null);
  const [calendarError, setCalendarError] = useState(false);
  const [arrival, setArrival] = useState<string | null>(null);
  const [departure, setDeparture] = useState<string | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  // The quote is stored with the stay it was fetched for. Keying it that way means a
  // quote can never be shown against dates it does not belong to: change the dates or the
  // guest count and the old number stops matching, rather than lingering until the new
  // one lands. It also keeps "are we still waiting?" a derived question instead of a
  // second piece of state to keep in step.
  const [quote, setQuote] = useState<{ key: string; result: QuoteOutcome } | null>(null);
  /** Bumped by "Try again", so a retry re-runs the effect without the dates changing. */
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  /**
   * Where the guest is in the panel. One value rather than four booleans, because the
   * states are genuinely exclusive -- the old shape allowed "sent" and "paying" at once,
   * which is not a thing that can happen.
   */
  const [mode, setMode] = useState<Mode>("dates");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);
  /**
   * The guest's own words, held here rather than in the form.
   *
   * They have to outlive the form. A 409 closes it, a payment leaves the site, and a
   * guest who has typed a name, an email and a paragraph about their flight should not
   * have to type it twice because our calendar moved under them.
   */
  const [guest, setGuest] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<GuestField, string>>>({});
  /** Set once /api/booking/checkout has held the nights and opened a Stripe payment. */
  const [payment, setPayment] = useState<{
    clientSecret: string;
    total: number;
    bookingId: number | null;
    holdMinutes: number | null;
  } | null>(null);
  /** What we tell the guest after a request lands, or a payment clears. */
  const [outcome, setOutcome] = useState<{
    bookingId: number | null;
    total: number | null;
    arrival: string | null;
    departure: string | null;
    email: string;
  } | null>(null);
  /** A rate-limit lockout, as a wall-clock instant. Null when not throttled. */
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  /** Cross-mode notices that are about the dates rather than about the form. */
  const [notice, setNotice] = useState<null | "pickAgain" | "paymentNotTaken">(null);
  /** Everything the panel wants read out but does not want to draw. */
  const [announcement, setAnnouncement] = useState("");

  // The month the grid is showing, as the first of that month.
  const [month, setMonth] = useState<string | null>(null);

  const confirmationRef = useRef<HTMLHeadingElement>(null);

  const intl = INTL_LOCALE[locale];
  const mailto = `mailto:${CONTACT_EMAIL}`;
  const guideHref = localePath(locale, `/${LOTUS_HOUSE.slug}/local-guide`);

  const money = useMemo(
    () =>
      new Intl.NumberFormat(intl, {
        style: "currency",
        currency: LOTUS_HOUSE.currency,
        maximumFractionDigits: 0,
      }),
    [intl],
  );

  const longDate = useMemo(
    () =>
      new Intl.DateTimeFormat(intl, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
    [intl],
  );

  /** For accessible names on the day buttons, where "6" on its own means nothing. */
  const fullDate = useMemo(
    () =>
      new Intl.DateTimeFormat(intl, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    [intl],
  );

  // Nightly rates under the calendar cells: bare numbers, no currency symbol. Seven of
  // them across a 372px column, and the symbol is already on the total below.
  const rate = useMemo(
    () => new Intl.NumberFormat(intl, { maximumFractionDigits: 0 }),
    [intl],
  );

  // -- the calendar --------------------------------------------------------------
  // Loaded on mount, and re-loaded whenever the server tells us the calendar moved. That
  // second case is the whole point: a 409 means our copy is stale, and a stale calendar
  // that still shows the refused night as free sends the guest straight back into it.
  const applyAvailability = useCallback((payload: Availability) => {
    setNights(new Map(payload.nights.map((night) => [night.date, night])));
    setMonth((current) => current ?? payload.from.slice(0, 8) + "01");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const payload = await fetchAvailability();
      if (cancelled) return;
      if (!payload) {
        setCalendarError(true);
        return;
      }
      applyAvailability(payload);
      setAnnouncement(t.bkCalendarReady);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [applyAvailability, t.bkCalendarReady]);

  // -- coming back from a redirect payment ---------------------------------------
  // PromptPay and full-page 3DS both leave the site. Stripe returns the guest to
  // `?paid=1` with the intent's client secret attached, and until this existed nothing
  // read either: the guest landed on an empty panel having paid, and paying again was the
  // only move the page offered them.
  useEffect(() => {
    let cancelled = false;

    async function resume() {
      const params = new URLSearchParams(window.location.search);
      if (params.get("paid") !== "1") return;

      const stored = readStoredPayment();
      // Stripe puts the intent's client secret on the return URL itself, so a guest whose
      // browser dropped the session storage is still recoverable.
      const secret = params.get("payment_intent_client_secret") ?? stored?.clientSecret ?? null;

      // Start the lookup, then yield before touching React state. Adopting state that
      // only exists in the URL is what this effect is for, and a microtask keeps the
      // effect body itself out of the business of scheduling renders.
      const lookup = secret ? retrievePaymentStatus(secret) : Promise.resolve(null);
      await Promise.resolve();
      if (cancelled) return;

      if (stored) {
        setArrival(stored.arrival);
        setDeparture(stored.departure);
        setAdults(stored.adults);
        setChildren(stored.children);
        setGuest((current) => ({ ...current, email: current.email || stored.email }));
        setOutcome({
          bookingId: stored.bookingId,
          total: stored.total,
          arrival: stored.arrival,
          departure: stored.departure,
          email: stored.email,
        });
      }
      setMode("confirming");

      const result = await lookup;
      if (cancelled) return;

      // Only now is the marker cleared. Until the answer is in, the URL is the one thing
      // that survives a remount, and stripping it early meant a panel that re-mounted
      // for any reason at all forgot it was ever coming back from a payment.
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);

      if (!result) {
        // Stripe would not load, or would not answer. We genuinely do not know, so we
        // say so rather than inviting a second payment.
        setMode("unconfirmed");
        return;
      }
      if (result.status === "succeeded" || result.status === "processing") {
        clearStoredPayment();
        setMode("paid");
        return;
      }
      // requires_payment_method / canceled: nothing was taken, and the hold is still
      // ours, so the guest resumes rather than starting a second checkout.
      if (stored) {
        setPayment({
          clientSecret: stored.clientSecret,
          total: stored.total,
          bookingId: stored.bookingId,
          holdMinutes: stored.holdMinutes,
        });
      }
      setNotice("paymentNotTaken");
      setMode("dates");
    }

    resume();
    return () => {
      cancelled = true;
    };
  }, []);

  // -- price the stay whenever it is complete ------------------------------------
  const quoteKey =
    arrival && departure ? `${arrival}|${departure}|${adults}|${children}` : null;

  useEffect(() => {
    if (!quoteKey) return;
    const [from, to, quoteAdults, quoteChildren] = quoteKey.split("|");
    let cancelled = false;

    async function price() {
      const key = quoteKey as string;
      try {
        const params = new URLSearchParams({
          arrival: from,
          departure: to,
          adults: quoteAdults,
          children: quoteChildren,
        });
        const response = await fetch(`/api/booking/quote?${params}`);
        const payload: ApiError & Partial<Quote> = await response
          .json()
          .catch(() => ({}) as ApiError);
        if (cancelled) return;

        if (response.ok) {
          setQuote({ key, result: { status: "ok", value: payload as Quote } });
          return;
        }
        if (response.status === 429) {
          const header = Number(response.headers.get("Retry-After"));
          const seconds = Number.isFinite(header) && header > 0 ? header : (payload.retryAfter ?? 600);
          const at = Date.now();
          setNow(at);
          setLockedUntil(at + seconds * 1000);
          setQuote({ key, result: { status: "rateLimited", value: null, payload } });
          return;
        }
        // A 5xx is us, not the calendar. Saying "not available" here would be asserting
        // something we have no evidence for, and it dead-ends the guest.
        if (response.status >= 500) {
          setQuote({ key, result: { status: "failed", value: null, payload } });
          return;
        }
        // A 4xx is an answer: either Beds24 will not sell these nights, or we asked for
        // something the route refuses.
        setQuote({ key, result: { status: "unavailable", value: null, payload } });
      } catch {
        // A dropped connection is not a booked house either.
        if (!cancelled) setQuote({ key, result: { status: "failed", value: null } });
      }
    }

    price();
    return () => {
      cancelled = true;
    };
  }, [quoteKey, quoteAttempt]);

  // Only ever the quote for the stay currently on screen.
  const current = quote && quote.key === quoteKey ? quote.result : null;
  const quoting = quoteKey !== null && (!quote || quote.key !== quoteKey);
  const priced =
    current?.status === "ok" && current.value?.available && current.value.total !== null
      ? current.value
      : null;
  /** Our fault or the network's: we could not check, and must not pretend otherwise. */
  const quoteBroke = current?.status === "failed" || current?.status === "rateLimited";

  // -- the lockout clock ---------------------------------------------------------
  // A 429 that re-enables the button immediately is worse than useless: every retry
  // pushes another timestamp into the server's bucket and pushes the lockout further out.
  useEffect(() => {
    if (lockedUntil === null) return;
    const timer = window.setInterval(() => {
      // Clearing the instant rather than only the clock stops this ticking forever once
      // the window has passed.
      if (Date.now() >= lockedUntil) setLockedUntil(null);
      else setNow(Date.now());
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [lockedUntil]);

  const locked = lockedUntil !== null && lockedUntil > now;
  const minutesLeft = lockedUntil ? Math.max(1, Math.ceil((lockedUntil - now) / 60_000)) : 0;
  const retryLine = locked
    ? minutesLeft <= 1
      ? t.bkRetryInAMinute
      : t.bkRetryInMinutes.replace("{n}", String(minutesLeft))
    : null;

  /**
   * The last date that can be chosen as a departure for the current arrival.
   *
   * Two things bound it. A stay occupies every night from arrival up to the night before
   * departure, so the range has to stop at the first night that is not free. And
   * `maxStay` is the longest stay that books online at all -- it was enforced only on the
   * server, so a guest could select 124 nights, watch a total appear, fill in the whole
   * form and be refused at submit. The calendar simply does not offer it now.
   */
  const maxDeparture = useMemo(() => {
    if (!arrival || !nights) return null;
    let cursor = arrival;
    let span = 0;
    while (nights.get(cursor)?.available && span < LOTUS_HOUSE.maxStay) {
      cursor = addDays(cursor, 1);
      span += 1;
    }
    return cursor;
  }, [arrival, nights]);

  /** True when it is the online limit, not the calendar, that stops the range. */
  const cappedByMaxStay =
    arrival !== null && maxDeparture !== null && maxDeparture === addDays(arrival, LOTUS_HOUSE.maxStay);

  const selectDate = useCallback(
    (date: string) => {
      setFormError(null);
      setNotice(null);
      // Changing the dates abandons any hold we were holding open for the old ones.
      setPayment(null);
      clearStoredPayment();

      // No arrival yet, or the click lands outside the range the arrival allows:
      // treat it as choosing a new arrival.
      if (!arrival || departure || date <= arrival || (maxDeparture && date > maxDeparture)) {
        setArrival(date);
        setDeparture(null);
        setAnnouncement(t.bkPickedCheckIn.replace("{date}", longDate.format(parseDate(date))));
        return;
      }
      setDeparture(date);
      const span = nightsBetween(arrival, date);
      setAnnouncement(
        (span === 1 ? t.bkPickedRangeOne : t.bkPickedRange)
          .replace("{from}", longDate.format(parseDate(arrival)))
          .replace("{to}", longDate.format(parseDate(date)))
          .replace("{n}", String(span)),
      );
    },
    [arrival, departure, maxDeparture, longDate, t.bkPickedCheckIn, t.bkPickedRange, t.bkPickedRangeOne],
  );

  const clearDates = useCallback(() => {
    setArrival(null);
    setDeparture(null);
    setFormError(null);
    setNotice(null);
    setPayment(null);
    clearStoredPayment();
    setAnnouncement("");
  }, []);

  const stayNights = arrival && departure ? nightsBetween(arrival, departure) : 0;
  const showLongStayNote =
    cappedByMaxStay && (departure === null || stayNights >= LOTUS_HOUSE.maxStay);
  /**
   * Beds24 carries a minimum stay per night, and it was fetched, typed and then never
   * read: a date with a seven-night minimum let the guest pick two, and the panel blamed
   * availability for a rule that was sitting in the data on screen.
   */
  const arrivalMinStay = arrival ? (nights?.get(arrival)?.minStay ?? 0) : 0;
  const effectiveMinStay = Math.max(LOTUS_HOUSE.minStay, arrivalMinStay);
  const belowMinimum = stayNights > 0 && stayNights < effectiveMinStay;

  /** Everything the pay path needs: a real price, and a stay we are allowed to sell. */
  const bookable = Boolean(priced) && !belowMinimum && !locked;
  /**
   * The request path survives a broken quote on purpose. /api/booking/request re-quotes
   * server side before it writes anything, so a request sent while our pricing call is
   * down is still safe -- and it is the only door left if the guest cannot get a number.
   */
  const requestable = (Boolean(priced) || quoteBroke) && stayNights > 0 && !belowMinimum && !locked;

  // Focus follows the guest into a terminal state. Before this the confirmation was a
  // paragraph, focus stayed on <body>, and a screen reader user was told nothing at all.
  useEffect(() => {
    if (mode === "requested" || mode === "paid" || mode === "unconfirmed") {
      confirmationRef.current?.focus();
    }
  }, [mode]);

  function validateGuest(): boolean {
    const errors: Partial<Record<GuestField, string>> = {};
    if (!guest.firstName.trim()) errors.firstName = t.bkFieldRequired;
    if (!guest.lastName.trim()) errors.lastName = t.bkFieldRequired;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email.trim())) errors.email = t.bkEmailInvalid;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /** Shared by both POSTs: a 409 means our calendar is stale, so go and get a fresh one. */
  async function handleConflict() {
    setArrival(null);
    setDeparture(null);
    setQuote(null);
    setNotice("pickAgain");
    setAnnouncement(t.bkPickAgain);
    const payload = await fetchAvailability();
    if (payload) applyAvailability(payload);
  }

  function applyRateLimit(response: Response, payload: ApiError) {
    const header = Number(response.headers.get("Retry-After"));
    const seconds = Number.isFinite(header) && header > 0 ? header : (payload.retryAfter ?? 600);
    // One reading of the clock for both, or the countdown rounds up to eleven minutes
    // for a ten minute window.
    const at = Date.now();
    setNow(at);
    setLockedUntil(at + seconds * 1000);
  }

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    // The honeypot stays uncontrolled and is read straight off the form, so it is never
    // part of the state we replay for the guest.
    const company = String(new FormData(event.currentTarget).get("company") ?? "");
    if (!validateGuest()) return;
    setSending(true);

    try {
      const response = await fetch("/api/booking/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...guest,
          company,
          arrival,
          departure,
          adults,
          children,
          locale,
        }),
      });
      const payload: ApiError & { bookingId?: number; total?: number } = await response
        .json()
        .catch(() => ({}));
      setSending(false);
      if (!response.ok) {
        setFormError(payload);
        if (response.status === 429) applyRateLimit(response, payload);
        if (response.status === 409) await handleConflict();
        return;
      }
      setOutcome({
        bookingId: payload.bookingId ?? null,
        total: payload.total ?? priced?.total ?? null,
        arrival,
        departure,
        email: guest.email.trim(),
      });
      setMode("requested");
    } catch {
      setSending(false);
      setFormError({});
    }
  }

  /**
   * Opens the paid path: the server holds the nights in Beds24, then hands back a Stripe
   * client secret. Nothing is charged yet -- this only gets as far as being *able* to
   * charge, which is why a failure here is always safe to retry.
   */
  async function startCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const company = String(new FormData(event.currentTarget).get("company") ?? "");
    if (!validateGuest()) return;
    setSending(true);

    try {
      const response = await fetch("/api/booking/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...guest,
          company,
          arrival,
          departure,
          adults,
          children,
          locale,
        }),
      });
      const payload: ApiError & {
        clientSecret?: string;
        bookingId?: number;
        total?: number;
        holdMinutes?: number;
      } = await response.json().catch(() => ({}));
      setSending(false);
      if (!response.ok || !payload.clientSecret) {
        setFormError(payload);
        if (response.status === 429) applyRateLimit(response, payload);
        if (response.status === 409) await handleConflict();
        return;
      }
      const held = {
        clientSecret: payload.clientSecret,
        total: payload.total ?? priced?.total ?? 0,
        bookingId: payload.bookingId ?? null,
        holdMinutes: typeof payload.holdMinutes === "number" ? payload.holdMinutes : null,
      };
      setPayment(held);
      setOutcome({
        bookingId: held.bookingId,
        total: held.total,
        arrival,
        departure,
        email: guest.email.trim(),
      });
      setMode("paying");
    } catch {
      setSending(false);
      setFormError({});
    }
  }

  /** Called immediately before Stripe may take the guest off the site. */
  function persistPayment() {
    if (!payment || !arrival || !departure) return;
    writeStoredPayment({
      clientSecret: payment.clientSecret,
      bookingId: payment.bookingId,
      total: payment.total,
      arrival,
      departure,
      adults,
      children,
      email: guest.email.trim(),
      holdMinutes: payment.holdMinutes,
    });
  }

  // -- fallback: no calendar, no booking ----------------------------------------
  // A dead calendar must not become a dead page. Same treatment as an unconfigured
  // Beds24: point the visitor at a human.
  if (calendarError) {
    return (
      <Panel title={t.checkDatesAndBook}>
        <div className="p-5">
          <p className="text-sm leading-relaxed text-body">{t.bookingUnavailable}</p>
          <Link href={contactHref} className="pill-primary mt-4 block text-center">
            {t.enquireDates}
          </Link>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {t.bkOrEmailUs}{" "}
            <a className="underline underline-offset-2 hover:text-primary" href={mailto}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </Panel>
    );
  }

  if (mode === "confirming") {
    return (
      <Panel title={t.checkDatesAndBook}>
        <div className="p-6" role="status" aria-live="polite">
          <p className="text-sm text-body">{t.bkConfirmingPayment}</p>
        </div>
      </Panel>
    );
  }

  // The end states share a shape: what happened, the facts of it, and a way onward.
  if (mode === "requested" || mode === "paid" || mode === "unconfirmed") {
    return (
      <Confirmation
        t={t}
        kind={mode}
        outcome={outcome}
        headingRef={confirmationRef}
        longDate={longDate}
        money={money}
        contactHref={contactHref}
        guideHref={guideHref}
        mailto={mailto}
      />
    );
  }

  return (
    <Panel title={t.checkDatesAndBook}>
      <div className="p-5">
        {/* Everything the panel wants read out and does not want to draw. Separate from
            the price region below so a date pick and a price change do not fight. */}
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>

        {notice ? (
          <p
            role="alert"
            className="mb-4 rounded-box bg-wash-red px-3.5 py-3 text-[13px] leading-relaxed text-deep-red"
          >
            {notice === "pickAgain" ? t.bkPickAgain : t.bkPaymentNotTaken}
          </p>
        ) : null}

        {/* -- the chosen stay, stated in words before any numbers ------------- */}
        <div className="flex items-start justify-between gap-3">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div>
              <dt className="eyebrow">{t.checkIn}</dt>
              <dd className="mt-0.5 font-semibold">
                {arrival ? longDate.format(parseDate(arrival)) : t.pickDate}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">{t.checkOut}</dt>
              <dd className="mt-0.5 font-semibold">
                {departure ? longDate.format(parseDate(departure)) : t.pickDate}
              </dd>
            </div>
          </dl>
          {arrival ? (
            <button
              type="button"
              onClick={clearDates}
              className="-my-2 inline-flex min-h-11 shrink-0 cursor-pointer items-center px-1 text-xs underline underline-offset-4 text-muted hover:text-ink"
            >
              {t.clearDates}
            </button>
          ) : null}
        </div>

        {nights && month ? (
          <MonthGrid
            month={month}
            nights={nights}
            arrival={arrival}
            departure={departure}
            maxDeparture={maxDeparture}
            onSelect={selectDate}
            onMonthChange={setMonth}
            intl={intl}
            rate={rate}
            fullDate={fullDate}
            t={t}
          />
        ) : (
          <p className="mt-5 text-sm text-muted" role="status" aria-live="polite">
            {t.loadingAvailability}
          </p>
        )}

        {/* Said while the guest is still choosing a check-out, and again if they land on
            the ceiling -- not as a permanent footnote under a four night stay. */}
        {showLongStayNote ? (
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {t.bkLongStayNote.replace("{n}", String(LOTUS_HOUSE.maxStay))}{" "}
            <a className="underline underline-offset-2 hover:text-primary" href={mailto}>
              {CONTACT_EMAIL}
            </a>
          </p>
        ) : null}

        {/* -- guests ------------------------------------------------------------
            Two counts rather than one, because Beds24 takes numAdult and numChild as
            separate integers and filing every direct booking as all-adults is false
            data. Both count toward maxGuests: Beds24 has no infant concept and validates
            the request against that number, so a rule more generous than Beds24's would
            produce bookings this panel accepts and Beds24 then refuses. Airbnb exempting
            under-2s is Airbnb's own pricing convention and stops there. */}
        <div className="mt-5 flex flex-col gap-2.5">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="eyebrow">{t.adults}</span>
            <select
              value={adults}
              onChange={(event) => {
                const next = Number(event.target.value);
                setAdults(next);
                // Keep the pair legal rather than letting the server reject it: dropping
                // the adult count squeezes the children down with it.
                setChildren((currentChildren) =>
                  Math.min(currentChildren, LOTUS_HOUSE.maxGuests - next),
                );
              }}
              className={`${field} min-h-11 w-28 cursor-pointer`}
            >
              {Array.from({ length: LOTUS_HOUSE.maxGuests }, (_, index) => index + 1).map(
                (n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="eyebrow">{t.children}</span>
            <select
              value={children}
              onChange={(event) => {
                setChildren(Number(event.target.value));
              }}
              className={`${field} min-h-11 w-28 cursor-pointer`}
            >
              {Array.from({ length: LOTUS_HOUSE.maxGuests - adults + 1 }, (_, index) => index).map(
                (n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ),
              )}
            </select>
          </label>

          <p className="text-xs leading-relaxed text-muted">{t.childrenNote}</p>
        </div>

        {/* -- the number ------------------------------------------------------
            A live region, because everything in it changes without anything moving on
            screen: the price arrives, "Checking the price…" comes and goes, and a
            minimum-stay error replaces a total in place. */}
        <div
          role="status"
          aria-live="polite"
          className="mt-5 border-t border-hairline pt-4"
        >
          {belowMinimum ? (
            <p className="text-sm text-deep-red">
              {arrivalMinStay > LOTUS_HOUSE.minStay && arrival
                ? t.bkMinStayOnDate
                    .replace("{date}", longDate.format(parseDate(arrival)))
                    .replace("{n}", String(effectiveMinStay))
                : t.minStayError.replace("{n}", String(effectiveMinStay))}
            </p>
          ) : quoting ? (
            <p className="text-sm text-muted">{t.pricing}</p>
          ) : priced ? (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-body">
                  {stayNights} {stayNights === 1 ? t.night : t.nights}
                </span>
                <span className="font-display text-[22px] font-extrabold tracking-[-0.02em]">
                  {money.format(priced.total as number)}
                </span>
              </div>
              {/* The calendar prints a nightly rate under every free night and Beds24
                  prices length of stay, so the total legitimately is not rate x nights.
                  Naming the average as an average is the smallest honest bridge. */}
              <p className="mt-1 text-xs text-muted">
                {t.bkPriceAverage.replace(
                  "{price}",
                  money.format(Math.round((priced.total as number) / stayNights)),
                )}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{t.bkPriceNote}</p>
            </>
          ) : current?.status === "rateLimited" ? (
            <div className="text-sm text-deep-red">
              <p>{t.bkErrRateLimited}</p>
              {retryLine ? <p className="mt-1">{retryLine}</p> : null}
              <p className="mt-1 text-xs text-muted">
                {t.bkOrEmailUs}{" "}
                <a className="underline underline-offset-2 hover:text-ink" href={mailto}>
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          ) : current?.status === "failed" ? (
            // We could not check. That is not the same sentence as "it is booked", and
            // saying the wrong one of the two closes the page on a guest who could still
            // have had the house.
            <div className="text-sm">
              <p className="text-deep-red">{t.bkQuoteFailed}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{t.bkQuoteFailedHint}</p>
              <button
                type="button"
                onClick={() => {
                  setQuote(null);
                  setQuoteAttempt((attempt) => attempt + 1);
                }}
                className="mt-2.5 inline-flex min-h-11 cursor-pointer items-center rounded-full border-[1.5px] border-hairline px-4 text-[13px] font-semibold hover:border-ink"
              >
                {t.bkTryAgain}
              </button>
            </div>
          ) : current?.status === "unavailable" ? (
            <p className="text-sm text-deep-red">
              {current.payload?.code && current.payload.code !== "bad_dates"
                ? messageFor(t, current.payload)
                : t.datesUnavailable}
            </p>
          ) : (
            <p className="text-sm text-muted">
              {t.pickDatesHint.replace("{n}", String(LOTUS_HOUSE.minStay))}
            </p>
          )}
        </div>

        {/* -- the two ways out ------------------------------------------------ */}
        {mode === "request" || mode === "payDetails" ? (
          <GuestForm
            t={t}
            guest={guest}
            onChange={(name, value) => {
              setGuest((currentGuest) => ({ ...currentGuest, [name]: value }));
              setFieldErrors((currentErrors) => ({ ...currentErrors, [name]: undefined }));
            }}
            fieldErrors={fieldErrors}
            sending={sending}
            error={formError}
            retryLine={retryLine}
            mailto={mailto}
            // The selects above stay live in every mode, so a guest can change the party
            // size with the form open and turn a bookable stay into an unbookable one.
            // The submit follows the same test the buttons do.
            canSubmit={mode === "request" ? requestable : bookable}
            staleNotice={t.bkFormStale}
            privacyHref={privacyHref}
            submitLabel={mode === "request" ? t.sendRequest : t.continueToPayment}
            onSubmit={mode === "request" ? submitRequest : startCheckout}
            onCancel={() => {
              setMode("dates");
              setFormError(null);
            }}
          />
        ) : mode === "paying" && payment ? (
          <PaymentForm
            clientSecret={payment.clientSecret}
            locale={locale}
            t={t}
            amountLabel={money.format(payment.total)}
            holdMinutes={payment.holdMinutes}
            onBeforeConfirm={persistPayment}
            onPaid={() => {
              clearStoredPayment();
              setMode("paid");
            }}
            // Backing out abandons the payment, not the hold. The hold is not released
            // here on purpose: the browser is not trusted to decide that, and
            // release-holds will sweep it. Which is exactly why the client secret is
            // kept -- running checkout a second time would ask Beds24 for nights our own
            // hold is already sitting on, and the panel would tell the guest their dates
            // had been taken by themselves.
            onCancel={() => setMode("dates")}
          />
        ) : (
          <div className="mt-4 flex flex-col gap-2.5">
            {/* Paying is the primary action when it is available -- it is the one that
                finishes the job. The request path stays visibly offered rather than
                buried, because a guest with a question should not have to pay to ask. */}
            {PAYMENTS_ENABLED && payment ? (
              <>
                <button
                  type="button"
                  onClick={() => setMode("paying")}
                  className={primaryButton}
                >
                  {t.bkResumePayment}
                </button>
                <p className="text-xs leading-relaxed text-muted">{t.bkResumeNote}</p>
              </>
            ) : PAYMENTS_ENABLED ? (
              <button
                type="button"
                disabled={!bookable}
                onClick={() => setMode("payDetails")}
                className={primaryButton}
              >
                {t.bookAndPay}
              </button>
            ) : null}

            {/* Not offered while a hold is open. A request written against nights this
                guest's own hold is already sitting on is the same self-collision the
                Resume button exists to avoid. "Clear" releases the selection and brings
                both buttons back. */}
            {payment && PAYMENTS_ENABLED ? null : (
              <button
                type="button"
                disabled={!requestable}
                onClick={() => setMode("request")}
                className={PAYMENTS_ENABLED ? outlineButton : primaryButton}
              >
                {t.requestToBook}
              </button>
            )}

            {/* Only when the price block is not already carrying the same sentence. */}
            {locked && retryLine && current?.status !== "rateLimited" ? (
              <p role="status" className="text-xs leading-relaxed text-deep-red">
                {retryLine}{" "}
                <a className="underline underline-offset-2" href={mailto}>
                  {CONTACT_EMAIL}
                </a>
              </p>
            ) : null}

            {payment && PAYMENTS_ENABLED ? null : (
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {PAYMENTS_ENABLED ? t.twoWaysNote : t.requestOnlyNote}
              </p>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

// -- pieces ---------------------------------------------------------------------

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="overflow-hidden rounded-panel border border-hairline"
      aria-labelledby="booking"
    >
      <h2
        id="booking"
        className="border-b border-hairline px-5 py-4 font-display text-lg font-bold tracking-[-0.015em]"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Where a booking ends.
 *
 * Both success states used to be a tick, two sentences and nothing else: no reference, no
 * amount, no times, and not one link out of the panel. A guest who has just paid a five
 * figure baht total and has questions had nowhere at all to go.
 */
function Confirmation({
  t,
  kind,
  outcome,
  headingRef,
  longDate,
  money,
  contactHref,
  guideHref,
  mailto,
}: {
  t: Dictionary;
  kind: "requested" | "paid" | "unconfirmed";
  outcome: {
    bookingId: number | null;
    total: number | null;
    arrival: string | null;
    departure: string | null;
    email: string;
  } | null;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  longDate: Intl.DateTimeFormat;
  money: Intl.NumberFormat;
  contactHref: string;
  guideHref: string;
  mailto: string;
}) {
  const paid = kind === "paid";
  const unconfirmed = kind === "unconfirmed";
  const stay =
    outcome?.arrival && outcome.departure
      ? `${longDate.format(parseDate(outcome.arrival))} → ${longDate.format(parseDate(outcome.departure))}`
      : null;

  const rows: [string, string][] = [];
  if (outcome?.bookingId) rows.push([t.bkReference, String(outcome.bookingId)]);
  if (stay) rows.push([t.bkYourStay, stay]);
  if (outcome?.total !== null && outcome?.total !== undefined) {
    rows.push([paid ? t.bkAmountPaid : t.bkPriceTotal, money.format(outcome.total)]);
  }

  return (
    <Panel title={t.checkDatesAndBook}>
      <div className="p-6">
        {/* No emoji on the error state: a tick beside "we could not confirm" would be
            reassurance the panel has not earned. */}
        {!unconfirmed ? (
          <div
            aria-hidden="true"
            className="flex h-10.5 w-10.5 items-center justify-center rounded-full bg-teal text-xl text-white"
          >
            ✓
          </div>
        ) : null}
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="mt-3.5 font-display text-[21px] font-extrabold tracking-[-0.02em] outline-none"
        >
          {unconfirmed ? t.bkUnconfirmedTitle : paid ? t.paidTitle : t.requestSentTitle}
        </h3>
        <p className="mt-2 text-[14.5px] leading-relaxed text-body">
          {unconfirmed ? t.bkPaymentUnconfirmed : paid ? t.paidBody : t.requestSentBody}
        </p>

        {rows.length ? (
          <dl className="mt-4 grid gap-2 border-t border-hairline pt-4 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4">
                <dt className="eyebrow">{label}</dt>
                <dd className="text-right font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {stay ? (
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {t.bkCheckInFrom.replace("{time}", LOTUS_HOUSE.checkIn)} ·{" "}
            {t.bkCheckOutBy.replace("{time}", LOTUS_HOUSE.checkOut)}
          </p>
        ) : null}

        {outcome?.email ? (
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {t.bkWeWillEmail.replace("{email}", outcome.email)}
          </p>
        ) : null}

        <p className="eyebrow mt-5">{t.bkWhatNext}</p>
        <div className="mt-2 flex flex-col gap-2.5">
          <Link href={guideHref} className="pill-outline block text-center">
            {t.guideCardLink}
          </Link>
          <Link href={contactHref} className="pill-outline block text-center">
            {t.bkAskUs}
          </Link>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          {t.bkOrEmailUs}{" "}
          <a className="underline underline-offset-2 hover:text-primary" href={mailto}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </Panel>
  );
}

/**
 * One month of nights.
 *
 * Weeks start on Monday, which is the convention in all three of our markets. The grid is
 * a table because that is what it is -- rows of weeks, columns of weekdays.
 *
 * The weekday initials in the column headers were the only thing supplying context, which
 * meant a day button's accessible name was the day number run straight into the nightly
 * rate: "63,400" for the sixth at 3,400 a night. Each button now carries the whole date,
 * the rate is hidden from the name, and the caption carries the month the table is for.
 */
function MonthGrid({
  month,
  nights,
  arrival,
  departure,
  maxDeparture,
  onSelect,
  onMonthChange,
  intl,
  rate,
  fullDate,
  t,
}: {
  month: string;
  nights: Map<string, Night>;
  arrival: string | null;
  departure: string | null;
  maxDeparture: string | null;
  onSelect: (date: string) => void;
  onMonthChange: (month: string) => void;
  intl: string;
  rate: Intl.NumberFormat;
  fullDate: Intl.DateTimeFormat;
  t: Dictionary;
}) {
  const first = parseDate(month);
  const monthLabel = new Intl.DateTimeFormat(intl, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(first);

  // Monday-first weekday initials, taken from Intl so they translate with the locale.
  const weekdays = useMemo(() => {
    const format = new Intl.DateTimeFormat(intl, { weekday: "short", timeZone: "UTC" });
    // 2024-01-01 was a Monday, which makes it a convenient anchor for seven labels.
    return Array.from({ length: 7 }, (_, index) =>
      format.format(new Date(Date.UTC(2024, 0, 1 + index))),
    );
  }, [intl]);

  const daysInMonth = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  // getUTCDay is Sunday-0; shift so Monday is 0.
  const leading = (first.getUTCDay() + 6) % 7;

  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => addDays(month, index)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = Array.from({ length: cells.length / 7 }, (_, index) =>
    cells.slice(index * 7, index * 7 + 7),
  );

  // Month navigation is bounded by what was actually loaded, so the guest cannot page
  // into empty months and conclude the place is booked out forever.
  const dates = [...nights.keys()].sort();
  const firstLoaded = dates.length ? dates[0].slice(0, 8) + "01" : month;
  const lastLoaded = dates.length ? dates[dates.length - 1].slice(0, 8) + "01" : month;
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(previous)}
          disabled={previous < firstLoaded}
          aria-label={t.previousMonth}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-lg leading-none text-muted hover:bg-surface hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          ‹
        </button>
        <span className="font-display text-[15px] font-bold tracking-[-0.01em]">{monthLabel}</span>
        <button
          type="button"
          onClick={() => onMonthChange(next)}
          disabled={next > lastLoaded}
          aria-label={t.nextMonth}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-lg leading-none text-muted hover:bg-surface hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <table className="mt-2.5 w-full table-fixed border-separate border-spacing-y-0.5">
        <caption className="sr-only">
          {t.bkCalendarCaption.replace("{month}", monthLabel)}
        </caption>
        <thead>
          <tr>
            {weekdays.map((day) => (
              <th
                key={day}
                scope="col"
                className="pb-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-muted"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={`${month}-w${weekIndex}`}>
              {week.map((date, index) => {
                if (!date) return <td key={`pad-${index}`} />;

                const night = nights.get(date);
                const isArrival = date === arrival;
                const isDeparture = date === departure;
                // A departure date is selectable even though its own night is not part of
                // the stay -- you check out on it. Hence the maxDeparture allowance.
                const selectableAsDeparture =
                  Boolean(arrival) && !departure && maxDeparture === date;
                const free = Boolean(night?.available) || selectableAsDeparture;
                const inRange =
                  arrival && departure ? date > arrival && date < departure : false;

                const spoken = fullDate.format(parseDate(date));
                // A date the calendar has no row for is in the past, not booked. Only a
                // night we actually loaded and were told is taken gets said so.
                const label = isArrival
                  ? t.bkDayCheckIn.replace("{date}", spoken)
                  : isDeparture
                    ? t.bkDayCheckOut.replace("{date}", spoken)
                    : free || !night
                      ? spoken
                      : t.bkDayTaken.replace("{date}", spoken);

                return (
                  <td key={date} className="p-0 text-center">
                    <button
                      type="button"
                      disabled={!free}
                      onClick={() => onSelect(date)}
                      aria-label={label}
                      // aria-pressed made every day a toggle button in a group of thirty.
                      // A chosen date is a current value, not a pressed switch.
                      aria-current={isArrival || isDeparture ? "date" : undefined}
                      className={[
                        "min-h-11 w-full cursor-pointer rounded-md py-1.5 text-[13px] leading-tight",
                        isArrival || isDeparture
                          ? "bg-ink font-semibold text-white"
                          : inRange
                            ? "bg-surface-2 text-ink"
                            : free
                              ? "hover:bg-surface"
                              : "cursor-not-allowed text-muted/40 line-through",
                      ].join(" ")}
                    >
                      <span aria-hidden="true">{parseDate(date).getUTCDate()}</span>
                      {/* The nightly rate under each free night. It is a guide -- the
                          total the guest is quoted comes from Beds24, not from adding
                          these up -- so it is set small, quiet, and out of the
                          accessible name entirely. */}
                      <span
                        aria-hidden="true"
                        className={`block text-[9px] font-normal ${
                          isArrival || isDeparture ? "text-white/70" : "text-muted"
                        }`}
                      >
                        {free && night?.price ? rate.format(night.price) : " "}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function shiftMonth(month: string, by: number): string {
  const date = parseDate(month);
  date.setUTCMonth(date.getUTCMonth() + by);
  return formatDate(date).slice(0, 8) + "01";
}

type GuestField = "firstName" | "lastName" | "email" | "phone" | "message";

/**
 * Name, email and a message.
 *
 * Controlled from the panel rather than from the DOM, because these fields have to
 * survive the form being taken off the screen: a 409 sends the guest back to the
 * calendar, and a redirect payment sends them off the site altogether.
 *
 * Visible labels, not placeholders. A five field form has the room, and a placeholder
 * disappears at the exact moment a guest checking their own typing needs it.
 */
function GuestForm({
  t,
  guest,
  onChange,
  fieldErrors,
  sending,
  error,
  retryLine,
  mailto,
  canSubmit,
  staleNotice,
  privacyHref,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  t: Dictionary;
  guest: Record<GuestField, string>;
  onChange: (name: GuestField, value: string) => void;
  fieldErrors: Partial<Record<GuestField, string>>;
  sending: boolean;
  error: ApiError | null;
  retryLine: string | null;
  mailto: string;
  canSubmit: boolean;
  staleNotice: string;
  privacyHref: string;
  /** Differs by path: "Send request" versus "Continue to payment". */
  submitLabel: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} noValidate className="mt-4 border-t border-hairline pt-4">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <TextField
          t={t}
          name="firstName"
          label={t.firstName}
          autoComplete="given-name"
          required
          value={guest.firstName}
          error={fieldErrors.firstName}
          onChange={onChange}
        />
        <TextField
          t={t}
          name="lastName"
          label={t.lastName}
          autoComplete="family-name"
          required
          value={guest.lastName}
          error={fieldErrors.lastName}
          onChange={onChange}
        />
      </div>
      <div className="mt-2.5">
        <TextField
          t={t}
          name="email"
          type="email"
          label={t.labelEmail}
          autoComplete="email"
          required
          value={guest.email}
          error={fieldErrors.email}
          onChange={onChange}
        />
      </div>
      <div className="mt-2.5">
        <TextField
          t={t}
          name="phone"
          type="tel"
          label={`${t.phoneOrLine} (${t.optional})`}
          autoComplete="tel"
          value={guest.phone}
          error={fieldErrors.phone}
          onChange={onChange}
        />
      </div>
      <div className="mt-2.5">
        <TextField
          t={t}
          name="message"
          label={t.anythingElse}
          multiline
          value={guest.message}
          error={fieldErrors.message}
          onChange={onChange}
        />
      </div>

      {/* Honeypot, as on the contact form. Invisible to people, irresistible to bots. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* Only when nothing more specific is already on screen: a server error says why,
          and this only says that something changed. */}
      {!canSubmit && !error ? (
        <p role="status" className="mt-3 text-[12.5px] leading-relaxed text-deep-red">
          {staleNotice}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-[12.5px] leading-relaxed text-deep-red">
          {messageFor(t, error)}
          {retryLine ? ` ${retryLine}` : ""}
          {wantsEmail(error.code) ? (
            <>
              {" "}
              <a href={mailto} className="underline underline-offset-2 hover:text-ink">
                {CONTACT_EMAIL}
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      <button type="submit" disabled={sending || !canSubmit} className={`mt-3.5 ${primaryButton}`}>
        {sending ? t.sending : submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="mt-2 min-h-11 w-full cursor-pointer text-xs underline underline-offset-4 text-muted hover:text-ink"
      >
        {t.back}
      </button>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        {t.requestPrivacyNote}{" "}
        <Link className="underline hover:text-primary" href={privacyHref}>
          {t.privacy}
        </Link>
        .
      </p>
    </form>
  );
}

function TextField({
  t,
  name,
  label,
  type = "text",
  autoComplete,
  required = false,
  multiline = false,
  value,
  error,
  onChange,
}: {
  t: Dictionary;
  name: GuestField;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  multiline?: boolean;
  value: string;
  error?: string;
  onChange: (name: GuestField, value: string) => void;
}) {
  const id = `booking-${name}`;
  const errorId = `${id}-error`;
  const shared = {
    id,
    name,
    value,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(name, event.target.value),
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-body">
        {label}
        {required ? (
          <span className="ml-1 font-normal text-muted">({t.bkRequired})</span>
        ) : null}
      </label>
      {multiline ? (
        <textarea {...shared} rows={3} className={`${field} w-full resize-y`} />
      ) : (
        <input
          {...shared}
          type={type}
          autoComplete={autoComplete}
          required={required}
          className={`${field} min-h-11 w-full`}
        />
      )}
      {error ? (
        <p id={errorId} className="mt-1 text-[12px] text-deep-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
