import { NextResponse } from "next/server";
import { parseDocument } from "@/lib/cleaning/document";
import { currentHolder } from "@/lib/cleaning/guard";
import { recordSeen, visitsDigest } from "@/lib/cleaning/seen";
import { readNote } from "@/lib/cleaning/store";

export const runtime = "nodejs";

/**
 * Records that she has looked at her schedule, which is the only thing this app writes on
 * her behalf.
 *
 * Phase one takes nothing from the team: nobody types anything, and anything they have to
 * report keeps going through LINE, where an answer comes back. This one write is what makes
 * "new since you last looked" possible at all, and it is per person, not per schedule.
 *
 * Nothing the client sends is stored. It sends a fingerprint of the screen it rendered;
 * this route reads her document from the store, recomputes the fingerprint, and records
 * only if the two match. A schedule republished between the render and this call therefore
 * leaves her markers standing, which is the right failure: she has not seen the new lines.
 */
export async function POST(request: Request) {
  const holder = await currentHolder();
  if (!holder) return NextResponse.json({ ok: false }, { status: 401 });

  let stamp = "";
  try {
    const body = (await request.json()) as { stamp?: unknown };
    stamp = typeof body.stamp === "string" ? body.stamp : "";
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const document = parseDocument(await readNote(holder.person));
    if (!document) return NextResponse.json({ ok: false }, { status: 404 });
    if ((await visitsDigest(document.visits)) !== stamp) {
      return NextResponse.json({ ok: false, stale: true });
    }
    await recordSeen(holder.person, document.visits);
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
