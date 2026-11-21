import { NextResponse } from "next/server";
import { currentSession } from "@/lib/admin/guard";
import { PHOTO_PREFIX } from "@/lib/cleaning/comment-shape";
import { currentHolder, pinGiven } from "@/lib/cleaning/guard";
import { privatePhotoOwner } from "@/lib/cleaning/comments";
import { readPhoto } from "@/lib/cleaning/photos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The only way to see a photograph on a thread.
 *
 * Paul chose a private Blob store on 18/11/2026, and this route is what that choice costs
 * and what it buys. A public store answers its own URLs to anybody holding one, and the two
 * things on this thread are a bank transfer screenshot and the inside of a guest's bedroom.
 * A private store answers nothing without a token, so the bytes come through here, on this
 * app's own origin, with the request carrying the same cookies as her schedule.
 *
 * **Two readers, one route.** Her phone passes the same two gates as every other screen she
 * can reach: the device cookie resolves to an enrolled phone, and her PIN has been given on
 * it. Paul passes the admin session he already signs in to. Either is enough, and nothing
 * else is.
 *
 * **Not gated on the job**, exactly as the upload is not. A pathname is a name with random
 * characters on the end that only ever travels inside a thread behind a PIN, and binding a
 * read to a slug would mean trusting a slug sent by a client in order to decide whether to
 * trust a pathname sent by the same client. What a second person with a PIN cannot do is
 * guess one.
 *
 * **The prefix is put back on here**, so a request names a date and a file and can never
 * name a blob outside this app's own prefix, whatever else the store holds.
 *
 * Nothing keeps a copy. The worker never caches a path under /api/ but this one's
 * neighbour, the response says `no-store`, and `next.config.ts` says it again. A photograph
 * is smaller than that sounds: the phone shrinks it before it is ever sent.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const holder = await currentHolder();
  const asTeam = holder ? await pinGiven(holder) : false;
  const admin = Boolean(await currentSession());
  if (!asTeam && !admin) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { path } = await params;
  const pathname = `${PHOTO_PREFIX}${(path ?? []).join("/")}`;
  // **A photo on a private comment opens for its person and for Paul, and for nobody else.**
  // Paul, 21/11/2026, so a payslip sent to one cleaner is not readable by her colleague on the
  // same job. Not found rather than forbidden, so trying a path tells a colleague nothing, and
  // a store that cannot be read refuses rather than guessing.
  if (!admin) {
    let owner: string | null;
    try {
      owner = await privatePhotoOwner(pathname);
    } catch {
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    if (owner && owner !== holder?.person) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
  }
  const photo = await readPhoto(pathname);
  if (!photo.ok) {
    // 404 for a photo that is gone or was never ours, 503 for a store nobody has set up.
    // The screen shows no image either way; the difference is only legible in a log.
    const status = photo.reason === "unconfigured" ? 503 : 404;
    return NextResponse.json({ ok: false, reason: photo.reason }, { status });
  }

  return new Response(photo.stream, {
    headers: {
      "Content-Type": photo.contentType,
      "Content-Length": String(photo.size),
      "Cache-Control": "private, no-store",
      // A photograph of somebody's room is not for a frame on another site, and not for
      // guessing at by content type either.
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
