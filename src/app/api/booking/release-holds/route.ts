import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  ALLOTMENT_TAG,
  BEDS24_READY,
  cancelBooking,
  findStaleHolds,
  HOLD_MINUTES,
} from "@/lib/beds24";
import { STRIPE_READY, stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Releases holds for checkouts nobody finished.
 *
 * A guest who closes the tab halfway through paying generates no Stripe event whatsoever.
 * Nothing will ever arrive to tell us those nights are free again, so they have to be
 * found by looking. Skipping this would mean every abandoned checkout blocks its nights on
 * all six channels indefinitely -- strictly worse than not offering online payment.
 *
 * Run it on a schedule. On Vercel that is a cron entry hitting this route every ten
 * minutes; anything that can make an authenticated request will do.
 *
 * Deliberately paranoid about what it cancels. Two independent conditions must both hold:
 *
 *   1. Beds24 says the booking is a hold this site created (`custom1` starts `stripe:`)
 *      and is older than HOLD_MINUTES.
 *   2. Stripe, asked about that exact PaymentIntent, says it did not succeed.
 *
 * The second check is the one that matters. Without it, a race -- payment clearing while
 * the sweep is mid-flight -- would cancel a booking somebody has actually paid for.
 *
 * It retrieves the PaymentIntent by id rather than searching by metadata, for two
 * reasons: Stripe's search index is eventually consistent and can lag by a minute, and a
 * search that returns nothing is indistinguishable from a payment that does not exist.
 * A direct retrieve is strongly consistent and either answers or throws.
 *
 * Every uncertain outcome keeps the hold. A hold that survives an extra cycle is a minor
 * annoyance; a cancelled stay that someone paid for is not recoverable by an apology.
 */

export async function POST(request: Request) {
  return run(request);
}

/** Vercel Cron issues GET, so both verbs do the same thing. */
export async function GET(request: Request) {
  return run(request);
}

async function run(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const manualSecret = process.env.BEDS24_WEBHOOK_SECRET;

  if (!cronSecret && !manualSecret) {
    console.error("[booking/release-holds] neither CRON_SECRET nor BEDS24_WEBHOOK_SECRET is set");
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  /**
   * Two ways in, and CRON_SECRET is not optional in practice.
   *
   * Vercel only attaches `Authorization: Bearer <CRON_SECRET>` to a scheduled request
   * when CRON_SECRET is set on the project. With it unset the cron arrives with no
   * Authorization header at all -- so an earlier "falls back to BEDS24_WEBHOOK_SECRET"
   * default could never match, and every sweep would 401 in silence while abandoned
   * holds went on blocking nights across all six channels. That failure is invisible
   * precisely because nothing is watching a job that never runs, so it is called out
   * loudly here and in .env.example.
   */
  const header = request.headers.get("authorization");
  const authorised =
    (Boolean(cronSecret) && header === `Bearer ${cronSecret}`) ||
    (Boolean(manualSecret) && request.headers.get("x-webhook-secret") === manualSecret);

  if (!authorised) {
    if (!cronSecret) {
      console.error(
        "[booking/release-holds] refused: CRON_SECRET is not set, so Vercel Cron cannot authenticate",
      );
    }
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  if (!BEDS24_READY || !STRIPE_READY) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  let candidates: { id: number; arrival: string; paymentIntentId: string }[];
  try {
    candidates = await findStaleHolds();
  } catch (error) {
    console.error("[booking/release-holds] could not list holds", error);
    return NextResponse.json({ error: "Could not list holds." }, { status: 502 });
  }

  const released: number[] = [];
  const kept: number[] = [];

  for (const hold of candidates) {
    if (!hold.paymentIntentId) {
      // Should not happen -- checkout attaches one immediately -- so treat it as a
      // question rather than an answer and leave the hold alone.
      console.warn("[booking/release-holds] hold with no PaymentIntent, keeping", hold.id);
      kept.push(hold.id);
      continue;
    }

    try {
      const intent = await stripe().paymentIntents.retrieve(hold.paymentIntentId);

      if (intent.status === "succeeded" || intent.status === "processing") {
        // Paid, or about to be. The webhook owns this one; do not touch it.
        kept.push(hold.id);
        continue;
      }

      await cancelBooking(hold.id, `Unpaid, released after ${HOLD_MINUTES} minutes`);
      if (intent.status !== "canceled") {
        await stripe().paymentIntents.cancel(intent.id, { cancellation_reason: "abandoned" });
      }
      released.push(hold.id);
    } catch (error) {
      // Stripe unreachable, or the intent is gone. Either way we do not know that this
      // was unpaid, so it stays. The next run will try again.
      console.error("[booking/release-holds] could not verify, keeping", hold.id, error);
      kept.push(hold.id);
    }
  }

  if (released.length > 0) {
    revalidateTag(ALLOTMENT_TAG, { expire: 0 });
    console.log("[booking/release-holds] released", released.join(", "));
  }

  return NextResponse.json({ ok: true, checked: candidates.length, released, kept });
}
