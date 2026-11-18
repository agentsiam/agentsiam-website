import { NextResponse } from "next/server";
import { currentHolder, pinGiven } from "@/lib/cleaning/guard";
import { storePhoto } from "@/lib/cleaning/photos";
import { incr } from "@/lib/cleaning/store";

export const runtime = "nodejs";

/** Twenty an hour, per person. A finished house is a handful of photographs; a phone
 * somebody else is holding does not get to fill a store. */
const PER_HOUR = 20;
const WINDOW_SECONDS = 60 * 60;

/**
 * Her proof that the work is done.
 *
 * Paul, 17/11/2026: the cleaning lady adds images when she finishes, as proof of work.
 *
 * The photo and the comment are two requests, which is the one thing worth explaining. A
 * single request carrying both would mean parsing multipart in a route that already has
 * three checks to make, and a failed comment would lose the photo with it. This stores the
 * photo and answers with its URL; the comment that follows carries that URL and is checked
 * against the store's own host before it is kept.
 *
 * Same two gates as everything else she can reach: the device cookie resolves and the
 * device is still enrolled, and her PIN has been given on this phone. Deliberately **not**
 * gated on the job: a photo is not a door code, and binding an upload to a slug would mean
 * trusting a slug sent by the client twice rather than once.
 */
export async function POST(request: Request) {
  const holder = await currentHolder();
  if (!holder) return NextResponse.json({ ok: false }, { status: 401 });
  if (!(await pinGiven(holder))) return NextResponse.json({ ok: false }, { status: 403 });

  try {
    const used = await incr(`cleaning:photorate:${holder.person}`, WINDOW_SECONDS);
    if (used > PER_HOUR) return NextResponse.json({ ok: false }, { status: 429 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const file = await request.blob();
  const stored = await storePhoto(file);
  if (!stored.ok) {
    // 503 for "nobody has set this up", 400 for "that was not a photo this app can take".
    const status = stored.reason === "unconfigured" || stored.reason === "failed" ? 503 : 400;
    return NextResponse.json({ ok: false, reason: stored.reason }, { status });
  }
  return NextResponse.json({ ok: true, url: stored.url });
}
