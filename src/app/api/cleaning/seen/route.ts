import { NextResponse } from "next/server";
import { acceptState, hidingDeclined } from "@/lib/cleaning/accept";
import { scheduleFor } from "@/lib/cleaning/assign";
import { propertyOf, todayInBangkok } from "@/lib/cleaning/document";
import { currentHolder } from "@/lib/cleaning/guard";
import { recordHistory } from "@/lib/cleaning/history";
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
 *
 * **The fingerprint is taken over what she was shown**, so the cleans she has turned down
 * come out of it here exactly as they do on the screen. They did not until 19/11/2026, and
 * the cost of that was silent: one declined clean made every fingerprint disagree, nothing
 * was ever recorded, and the "changed since you looked" marker quietly stopped moving.
 *
 * **It also folds that schedule into her ledger of cleans done**, which is the other thing
 * this route is now for and the only place it is written. A published document starts at
 * today, so a clean she did yesterday is gone from it by this morning, and the payslip for
 * it lives in the thread on that clean. src/lib/cleaning/history.ts carries the reasoning.
 * It is written before the fingerprint is checked, because whether she has **seen** the
 * latest lines has nothing to do with which cleans existed.
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
    const state = await acceptState(holder.person, document.visits);
    const visits = hidingDeclined(document.visits, state);

    await recordHistory(
      holder.person,
      visits,
      (visit) => propertyOf(document, visit)?.name ?? "",
      todayInBangkok(),
    ).catch(() => {});

    if ((await visitsDigest(visits)) !== stamp) {
      return NextResponse.json({ ok: false, stale: true });
    }
    await recordSeen(holder.person, visits);
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
