import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { ALLOTMENT_TAG, cancelBooking, confirmPaidBooking } from "@/lib/beds24";
import { notificationBody, sendMail } from "@/lib/mailer";
import { LOTUS_HOUSE } from "@/lib/property";
import { fromMinorUnits, STRIPE_READY, stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe tells us what happened to the money.
 *
 * This is the only place a booking becomes confirmed. Not the browser -- a guest whose
 * phone dies between paying and the page redirecting must still get their booking, and a
 * browser that says "I paid" is not evidence. Stripe signs these calls and retries them
 * for days if we fail, which is exactly the durability a confirmation needs.
 *
 * Two outcomes are handled:
 *
 * - `payment_intent.succeeded` confirms the held booking and records the money against it.
 * - `payment_intent.payment_failed` / `.canceled` releases the hold, so a declined card
 *   does not keep the nights off the market.
 *
 * Anything else is acknowledged and ignored. Returning a non-2xx makes Stripe retry, so
 * the only things that may fail here are the ones worth retrying.
 */

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!STRIPE_READY || !secret) {
    console.error("[stripe/webhook] STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Unsigned." }, { status: 400 });
  }

  // The raw body, not the parsed one: the signature is over the exact bytes Stripe sent.
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(raw, signature, secret);
  } catch (error) {
    // A bad signature is either a misconfiguration or someone trying it on. Neither is
    // worth retrying, so answer 400 and let Stripe stop.
    console.error("[stripe/webhook] signature verification failed", error);
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  const intent = event.data.object as Stripe.PaymentIntent;
  const bookingId = Number(intent.metadata?.beds24BookingId);

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    // Not one of ours, or metadata was lost. Acknowledge so Stripe stops retrying.
    console.warn("[stripe/webhook] no beds24BookingId on", event.type, intent.id);
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const amount = fromMinorUnits(intent.amount_received || intent.amount, intent.currency);
        const { alreadyDone } = await confirmPaidBooking({
          bookingId,
          paymentIntentId: intent.id,
          amount,
          chargeDescription: `${LOTUS_HOUSE.title}, ${intent.metadata.arrival} to ${intent.metadata.departure}`,
        });

        if (!alreadyDone) {
          // The hold already removed these nights from the calendar, but the status change
          // is worth publishing anyway so nothing downstream is looking at a stale copy.
          revalidateTag(ALLOTMENT_TAG, { expire: 0 });
          await notifyHost(intent, bookingId, amount);
        }
        return NextResponse.json({ ok: true, confirmed: bookingId, alreadyDone });
      }

      case "payment_intent.payment_failed":
      case "payment_intent.canceled": {
        await cancelBooking(bookingId, "Payment failed");
        revalidateTag(ALLOTMENT_TAG, { expire: 0 });
        return NextResponse.json({ ok: true, released: bookingId });
      }

      default:
        return NextResponse.json({ ok: true, ignored: true });
    }
  } catch (error) {
    // Beds24 was unreachable, or refused. The money is already taken, so this must not be
    // swallowed: answer 500 and let Stripe retry for us. If every retry fails, the booking
    // is still visible in Stripe with the Beds24 id in its metadata.
    console.error("[stripe/webhook] handling failed, asking Stripe to retry", event.type, bookingId, error);
    return NextResponse.json({ error: "Could not update the booking." }, { status: 500 });
  }
}

/** Best effort. A failure here must not make Stripe retry a payment we already booked. */
async function notifyHost(
  intent: Stripe.PaymentIntent,
  bookingId: number,
  amount: number,
): Promise<void> {
  const meta = intent.metadata ?? {};
  const rows: [string, string][] = [
    ["Property", LOTUS_HOUSE.title],
    ["Arrival", meta.arrival ?? "?"],
    ["Departure", meta.departure ?? "?"],
    ["Nights", meta.nights ?? "?"],
    ["Guests", meta.guests ?? "?"],
    ["Paid", `${LOTUS_HOUSE.currency} ${amount.toLocaleString("en-US")}`],
    ["Name", meta.guestName ?? "?"],
    ["Email", meta.guestEmail ?? "?"],
    ["Wrote in", meta.locale ?? "en"],
    ["Beds24 booking", String(bookingId)],
    ["Stripe payment", intent.id],
  ];

  const { html, text } = notificationBody(
    "Paid booking, confirmed in Beds24",
    rows,
    undefined,
    "Payment has cleared and the booking is confirmed. Nothing further is needed to hold it.",
  );

  const sent = await sendMail({
    subject: `Booking PAID: ${meta.arrival} \u2192 ${meta.departure} (${meta.guestName ?? "guest"})`,
    html,
    text,
    replyTo: typeof meta.guestEmail === "string" ? meta.guestEmail : undefined,
  });

  if (!sent) {
    console.error("[stripe/webhook] booking", bookingId, "confirmed but not emailed");
  }
}
