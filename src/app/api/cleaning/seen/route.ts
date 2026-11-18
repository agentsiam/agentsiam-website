import { NextResponse } from "next/server";
import { scheduleFor } from "@/lib/cleaning/assign";
import { currentHolder } from "@/lib/cleaning/guard";
import { recordSeen, visitsDigest } from "@/lib/cleaning/seen";

export const runtime = "nodejs";

/**
 * Records that she has looked at her schedule.
 *
 * It was once the only thing this app wrote on her behalf, and the only thing it wrote at
 * all: the team read, and anything they had to say went back through LINE. Since the
 * comment threads on 17/11/2026 that is no longer true, and the distinction worth keeping
 * is that this route stores **no words**. It records a fact about her own phone, which is
 * what makes "new since you last looked" possible at all, and it is per person rather than
 * per schedule.
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
    const document = await scheduleFor(holder.person);
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
