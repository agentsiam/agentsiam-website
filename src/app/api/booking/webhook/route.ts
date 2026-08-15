import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { ALLOTMENT_TAG } from "@/lib/beds24";

export const runtime = "nodejs";
// Never cached, and never prerendered: this is a notification, not a document.
export const dynamic = "force-dynamic";

/**
 * Beds24 tells us the allotment moved.
 *
 * Lotus House is sold on six channels. A booking on any of them reaches Beds24 first --
 * Beds24 is the channel manager, so it already holds the one true allotment and there is
 * no cross-channel race for this site to lose. What this route fixes is the only gap that
 * is ours: the few seconds our own cached copy would otherwise keep showing nights that
 * have just gone.
 *
 * Point the Beds24 property's webhook URL here (Settings -> Properties -> Webhooks, or
 * the `webhooks.url` field on the property via the API). Beds24 fires it whenever a
 * change affects availability -- status, arrival, departure, room or quantity -- so this
 * runs on real movement and not on, say, a guest correcting their surname.
 *
 * Deliberately does almost nothing. It does not parse the booking, trust its contents, or
 * write anything: it drops our cached read of the allotment and lets the next request
 * fetch the truth from Beds24. A webhook body is attacker-shaped input; a cache
 * invalidation is the smallest possible thing to do with one.
 *
 * Missing this webhook degrades rather than breaks. ALLOTMENT_TTL still expires the cache
 * within thirty seconds, and `checkAvailability` on every write means Beds24 refuses a
 * booking for nights that are gone regardless. This route is what turns "correct within
 * thirty seconds" into "correct within a second".
 */

export async function POST(request: Request) {
  const secret = process.env.BEDS24_WEBHOOK_SECRET;

  // Beds24 signs nothing, so the shared secret goes in a custom header configured
  // alongside the URL in the Beds24 dashboard. Without one set, refuse rather than accept
  // anonymous cache invalidation from the open internet: it is a free way to make this
  // site hammer the Beds24 API until it hits the credit limit.
  if (!secret) {
    console.error("[booking/webhook] BEDS24_WEBHOOK_SECRET is not set, ignoring call");
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  if (request.headers.get("x-webhook-secret") !== secret) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  revalidateTag(ALLOTMENT_TAG, { expire: 0 });
  return NextResponse.json({ ok: true });
}

/** Beds24's dashboard offers a "test" button that sends a GET. Answer it honestly. */
export async function GET() {
  return NextResponse.json({ ok: true, listening: true });
}
