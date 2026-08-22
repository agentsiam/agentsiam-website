import { NextResponse } from "next/server";
import {
  BEDS24_READY,
  createBookingRequest,
  getQuote,
  isValidDate,
  nightsBetween,
  stayWindowError,
  REQUEST_STATUS,
  today,
} from "@/lib/beds24";
import { notificationBody, sendMail } from "@/lib/mailer";
import { LOTUS_HOUSE } from "@/lib/property";
import { callerIp, rateLimit } from "@/lib/rate-limit";
import { CONTACT_EMAIL } from "@/lib/site";

export const runtime = "nodejs";

/**
 * "Send us a booking request" -- the half of the property page that does not take money.
 *
 * The flow is: re-quote server side, write the booking to Beds24 as a request, then tell
 * us by email. In that order, deliberately. The quote is re-fetched rather than trusted
 * from the browser, because the price posted by a client is a number a stranger chose.
 * Beds24 is written to before the email is sent, because a booking that exists without a
 * notification is recoverable from the Beds24 calendar, while a notification for a
 * booking that was never created sends someone chasing a reservation that is not there.
 *
 * Email delivery failing does not fail the request: the booking is already in Beds24 and
 * Beds24 notifies the host itself (`notifyHost`). Our email is the nicer copy, not the
 * system of record.
 */

const MAX = {
  firstName: 100,
  lastName: 100,
  email: 100,
  phone: 100,
  message: 1000,
  locale: 8,
};

type Field = keyof typeof MAX;

function clean(value: unknown, field: Field): string {
  return typeof value === "string" ? value.trim().slice(0, MAX[field]) : "";
}

export async function POST(request: Request) {
  if (!BEDS24_READY) {
    console.error("[booking/request] BEDS24_REFRESH_TOKEN is not set");
    return NextResponse.json(
      { error: `Booking is unavailable right now. Please email us at ${CONTACT_EMAIL}.` },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  // Honeypot, same trick as /api/contact: invisible to people, irresistible to bots.
  // Answer 200 so the bot does not learn to retry with the field cleared.
  if (clean(body.company, "firstName")) {
    return NextResponse.json({ ok: true });
  }

  if (rateLimit("booking-request", callerIp(request), { max: 6, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json(
      { error: `Too many requests. Please email us at ${CONTACT_EMAIL}.` },
      { status: 429 },
    );
  }

  const arrival = typeof body.arrival === "string" ? body.arrival : "";
  const departure = typeof body.departure === "string" ? body.departure : "";
  const adults = Number(body.adults);
  const children = Number(body.children ?? 0);
  // Declared by the guest, never inferred. `underFive` drives the safety disclosure and
  // nothing else: it is not priced, not sent to Beds24 as a guest count, and not a
  // capacity constraint. See the property profile's `three-storey-child-safety`.
  const underFive = body.underFive === true;
  const childSafetyAck = body.childSafetyAck === true;
  const firstName = clean(body.firstName, "firstName");
  const lastName = clean(body.lastName, "lastName");
  const email = clean(body.email, "email");
  const phone = clean(body.phone, "phone");
  const message = clean(body.message, "message");

  /**
   * The evidence, stored where it will actually be found. The property profile's
   * `internal_action` requires a written acknowledgement kept on the booking, so it is
   * folded into the message that reaches both the Beds24 booking record and the
   * notification email, rather than living in a field somebody has to know to look up.
   * Prefixed so it survives a guest who wrote nothing.
   */
  const messageWithNotices = underFive
    ? `[Child safety] Guest declared a guest under 5 and acknowledged the stairs, ` +
      `terrace and bathtub notice. Call rather than message if anyone is under 3.` +
      (message ? `\n\n${message}` : "")
    : message;
  const locale = clean(body.locale, "locale") || "en";

  if (!isValidDate(arrival) || !isValidDate(departure) || departure <= arrival) {
    return NextResponse.json({ error: "Please choose your dates again." }, { status: 400 });
  }
  if (arrival < today()) {
    return NextResponse.json({ error: "That arrival date has passed." }, { status: 400 });
  }
  if (nightsBetween(arrival, departure) < LOTUS_HOUSE.minStay) {
    return NextResponse.json(
      { error: `The minimum stay is ${LOTUS_HOUSE.minStay} nights.` },
      { status: 400 },
    );
  }

  // Bounds how much calendar one request can take. Everything above checks the stay is
  // valid; this checks it is not enormous or years away, because the hold it creates is
  // real on every channel either way.
  const outsideWindow = stayWindowError(arrival, departure, LOTUS_HOUSE.maxStay);
  if (outsideWindow) {
    return NextResponse.json({ error: outsideWindow }, { status: 400 });
  }
  if (
    !Number.isInteger(adults) ||
    adults < 1 ||
    !Number.isInteger(children) ||
    children < 0 ||
    adults + children > LOTUS_HOUSE.maxGuests
  ) {
    return NextResponse.json(
      { error: `Lotus House sleeps up to ${LOTUS_HOUSE.maxGuests} guests.` },
      { status: 400 },
    );
  }

  // The acknowledgement is enforced here as well as in the panel. A tick-box that only
  // exists in the browser is not a disclosure, it is a decoration: anything posting
  // straight to this route would sail past it.
  if (underFive && !childSafetyAck) {
    return NextResponse.json(
      { error: "Please confirm you have read the note about young children." },
      { status: 400 },
    );
  }
  if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please check the name and email fields." },
      { status: 400 },
    );
  }

  // Re-price server side. This is both the authoritative total and the last availability
  // check before the write -- if the nights went while the form was open, this is where
  // it shows up as a clean message rather than a Beds24 rejection.
  let total: number | null = null;
  try {
    // fresh: this quote decides what gets charged and what gets written to Beds24.
    const quote = await getQuote(arrival, departure, adults, children, true);
    if (!quote.available) {
      return NextResponse.json(
        { error: "Those dates are no longer available. Please pick again." },
        { status: 409 },
      );
    }
    total = quote.total;
  } catch (error) {
    console.error("[booking/request] quote failed", error);
    return NextResponse.json(
      { error: `Could not check those dates. Please email us at ${CONTACT_EMAIL}.` },
      { status: 502 },
    );
  }

  let bookingId: number | null = null;
  try {
    bookingId = await createBookingRequest({
      arrival,
      departure,
      adults,
      children,
      firstName,
      lastName,
      email,
      phone,
      message: messageWithNotices,
      locale,
      total,
    });
  } catch (error) {
    // createBookingRequest passes `checkAvailability`, so the most likely failure by far
    // is that the nights went between the quote above and this write.
    console.error("[booking/request] Beds24 rejected the booking", error);
    return NextResponse.json(
      {
        error:
          "Those dates were taken while you were filling this in. Please pick again, " +
          `or email us at ${CONTACT_EMAIL}.`,
      },
      { status: 409 },
    );
  }

  await notify({
    bookingId,
    arrival,
    departure,
    adults,
    children,
    firstName,
    lastName,
    email,
    phone,
    message: messageWithNotices,
    locale,
    total,
  });

  return NextResponse.json({ ok: true, bookingId, arrival, departure, total });
}

type Notification = {
  bookingId: number | null;
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
  total: number | null;
};

/**
 * Tells us a request came in. Best effort by design -- see the note at the top of the
 * file. Every failure path here logs and returns rather than throwing.
 */
async function notify(request: Notification): Promise<void> {
  const nights = nightsBetween(request.arrival, request.departure);
  const money =
    request.total !== null
      ? `${LOTUS_HOUSE.currency} ${request.total.toLocaleString("en-US")}`
      : "not priced";

  const rows: [string, string][] = [
    ["Property", LOTUS_HOUSE.title],
    ["Arrival", request.arrival],
    ["Departure", request.departure],
    ["Nights", String(nights)],
    ["Guests", `${request.adults} adults, ${request.children} children`],
    ["Quoted total", money],
    ["Name", `${request.firstName} ${request.lastName}`],
    ["Email", request.email],
    ["Phone / LINE", request.phone || "not given"],
    ["Wrote in", request.locale],
    ["Beds24 booking", request.bookingId ? String(request.bookingId) : "id not returned"],
    ["Status", REQUEST_STATUS],
  ];

  const { html, text } = notificationBody(
    `Booking request: ${LOTUS_HOUSE.title}`,
    rows,
    request.message,
    `Created in Beds24 as ${REQUEST_STATUS}. It is not confirmed until you confirm it there.`,
  );

  const sent = await sendMail({
    subject: `Booking request: ${request.arrival} \u2192 ${request.departure} (${request.firstName} ${request.lastName})`,
    html,
    text,
    replyTo: request.email,
  });

  if (!sent) {
    // The booking is already in Beds24 and Beds24 notifies the host itself, so this is
    // recoverable -- but it needs to be visible, not silent.
    console.error("[booking/request] booking", request.bookingId, "created but not emailed");
  }
}
