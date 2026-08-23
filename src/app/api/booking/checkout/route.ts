import { NextResponse } from "next/server";
import {
  attachPaymentIntent,
  BEDS24_READY,
  cancelBooking,
  createHold,
  getQuote,
  HOLD_MINUTES,
  isValidDate,
  nightsBetween,
  stayWindowError,
  today,
} from "@/lib/beds24";
import { LOTUS_HOUSE } from "@/lib/property";
import { callerIp, rateLimit } from "@/lib/rate-limit";
import { CONTACT_EMAIL } from "@/lib/site";
import { STRIPE_READY, stripe, toMinorUnits } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Opens an instant booking: holds the nights, then asks Stripe for the money.
 *
 * Order matters and is the point. The nights are taken out of inventory with Beds24's
 * `checkAvailability` *before* a card is touched, so the failure mode is "sorry, those
 * just went" with nothing charged, rather than a refund for a room that sold on Airbnb
 * while the guest was typing.
 *
 * The amount is re-quoted here and never read from the request body. A price posted by a
 * browser is a number a stranger chose.
 *
 * Returns a PaymentIntent client secret. That is safe to hand to the browser: it
 * authorises paying this one intent and nothing else. If anything fails after the hold is
 * placed, the hold is released before answering -- an error must not leave nights blocked.
 */

const MAX = { firstName: 100, lastName: 100, email: 100, phone: 100, message: 1000, locale: 8 };
type Field = keyof typeof MAX;

function clean(value: unknown, field: Field): string {
  return typeof value === "string" ? value.trim().slice(0, MAX[field]) : "";
}

export async function POST(request: Request) {
  if (!BEDS24_READY || !STRIPE_READY) {
    console.error("[booking/checkout] not configured", { BEDS24_READY, STRIPE_READY });
    return NextResponse.json(
      { error: `Online booking is unavailable. Please email us at ${CONTACT_EMAIL}.` },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (clean(body.company, "firstName")) {
    return NextResponse.json({ ok: true });
  }

  if (rateLimit("booking-checkout", callerIp(request), { max: 5, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json(
      { error: `Too many attempts. Please email us at ${CONTACT_EMAIL}.` },
      { status: 429 },
    );
  }

  const arrival = typeof body.arrival === "string" ? body.arrival : "";
  const departure = typeof body.departure === "string" ? body.departure : "";
  const adults = Number(body.adults);
  const children = Number(body.children ?? 0);
  const firstName = clean(body.firstName, "firstName");
  const lastName = clean(body.lastName, "lastName");
  const email = clean(body.email, "email");
  const phone = clean(body.phone, "phone");
  const message = clean(body.message, "message");

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

  if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please check the name and email fields." }, { status: 400 });
  }

  // 1. Price it. Authoritative, and the last look at availability before the hold.
  let total: number;
  try {
    // fresh: this quote decides what gets charged and what gets written to Beds24.
    const quote = await getQuote(arrival, departure, adults, children, true);
    if (!quote.available || quote.total === null || quote.total <= 0) {
      return NextResponse.json(
        { error: "Those dates are no longer available. Please pick again." },
        { status: 409 },
      );
    }
    total = quote.total;
  } catch (error) {
    console.error("[booking/checkout] quote failed", error);
    return NextResponse.json(
      { error: `Could not price those dates. Please email us at ${CONTACT_EMAIL}.` },
      { status: 502 },
    );
  }

  // 2. Hold the nights. Beds24 refuses if they went, and nothing has been charged.
  let bookingId: number | null;
  try {
    bookingId = await createHold({
      arrival,
      departure,
      adults,
      children,
      firstName,
      lastName,
      email,
      phone,
      message,
      locale,
      total,
    });
  } catch (error) {
    console.error("[booking/checkout] Beds24 refused the hold", error);
    return NextResponse.json(
      { error: "Those dates were taken while you were filling this in. Please pick again." },
      { status: 409 },
    );
  }

  if (!bookingId) {
    console.error("[booking/checkout] Beds24 accepted the hold but returned no id");
    return NextResponse.json(
      { error: `Something went wrong. Please email us at ${CONTACT_EMAIL}.` },
      { status: 502 },
    );
  }

  // 3. Now ask for the money.
  try {
    const nights = nightsBetween(arrival, departure);
    const intent = await stripe().paymentIntents.create(
      {
        amount: toMinorUnits(total, LOTUS_HOUSE.currency),
        currency: LOTUS_HOUSE.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        receipt_email: email,
        description: `${LOTUS_HOUSE.title}, ${arrival} to ${departure} (${nights} nights)`,
        // The webhook is the only thing that confirms the booking, and this is how it
        // knows which booking to confirm. Everything it needs is here, so it never has to
        // trust a browser to tell it.
        metadata: {
          beds24BookingId: String(bookingId),
          arrival,
          departure,
          nights: String(nights),
          guests: String(adults + children),
          property: LOTUS_HOUSE.slug,
          guestEmail: email,
          guestName: `${firstName} ${lastName}`,
          locale,
        },
      },
      // Retrying this route must not create a second charge for the same hold.
      { idempotencyKey: `lotushouse-hold-${bookingId}` },
    );

    await attachPaymentIntent(bookingId, intent.id);

    return NextResponse.json({
      clientSecret: intent.client_secret,
      bookingId,
      total,
      currency: LOTUS_HOUSE.currency,
      holdMinutes: HOLD_MINUTES,
    });
  } catch (error) {
    // The hold exists but there is nothing to pay it with. Release it now rather than
    // leaving nights blocked on six channels until the sweep gets to them.
    console.error("[booking/checkout] Stripe failed, releasing hold", bookingId, error);
    try {
      await cancelBooking(bookingId, "Payment could not be started");
    } catch (releaseError) {
      console.error("[booking/checkout] could not release hold", bookingId, releaseError);
    }
    return NextResponse.json(
      { error: `Could not start the payment. Please email us at ${CONTACT_EMAIL}.` },
      { status: 502 },
    );
  }
}
