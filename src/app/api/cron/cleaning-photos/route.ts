import { NextResponse } from "next/server";
import { PHOTO_KEPT_DAYS } from "@/lib/cleaning/comment-shape";
import { photosConfigured, sweepPhotos } from "@/lib/cleaning/photos";

export const runtime = "nodejs";

/**
 * Deletes every comment photo older than a month.
 *
 * Paul's rule, 18/11/2026: photos are deleted after one month, automatically. Vercel Blob
 * has no expiry of its own, so this is the only thing that enforces it. Without it a
 * proof-of-work photograph of somebody's bedroom would sit in a bucket for good.
 *
 * It sweeps by what the store says, not by what a comment says, so a photo whose comment
 * has already expired out of Redis is still deleted. It only ever lists and deletes under
 * the one prefix this app writes to.
 *
 * Authenticated the same way the booking cron is, which is the only way a Vercel cron can
 * authenticate: `Authorization: Bearer <CRON_SECRET>`, attached by Vercel to the scheduled
 * request when CRON_SECRET is set on the project. With it unset the request arrives with no
 * header at all, so this refuses rather than running wide open.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/cleaning-photos] refused: CRON_SECRET is not set");
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }
  if (!photosConfigured()) {
    console.error("[cron/cleaning-photos] refused: BLOB_READ_WRITE_TOKEN is not set");
    return NextResponse.json({ error: "No photo store." }, { status: 503 });
  }

  try {
    const swept = await sweepPhotos();
    console.log(
      `[cron/cleaning-photos] ${swept.checked} photo(s) in the store, ${swept.deleted} older than ${PHOTO_KEPT_DAYS} days deleted`,
    );
    return NextResponse.json({ ok: true, ...swept });
  } catch (error) {
    console.error("[cron/cleaning-photos] sweep failed", error);
    return NextResponse.json({ error: "The sweep failed." }, { status: 500 });
  }
}
