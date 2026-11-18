import { NextResponse } from "next/server";
import { scheduleFor } from "@/lib/cleaning/assign";
import { accessFor, findVisit, todayInBangkok } from "@/lib/cleaning/document";
import { currentHolder, pinGiven } from "@/lib/cleaning/guard";
import { CLEANING_KEEP_HEADER } from "@/lib/cleaning/routes";
import { codesKeepUntil, readPinCookie, CLEANING_PIN_COOKIE } from "@/lib/cleaning/session";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One job's door codes, as data, so that they can be on the schedule without being in it.
 *
 * Paul, 17/11/2026: the house code shows directly inside the schedule, without opening a new
 * page, and only for her assigned cleaning day at that house. The first half of that is a
 * layout question and the second is the rule. Together they are a caching problem, which is
 * why the codes arrive here rather than in the HTML.
 *
 * **If a code were rendered into /cleaning, every saved copy of her schedule would hold a
 * door code.** The service worker keeps that page so she can read her dates at a house with
 * no signal, and it keeps it without a deadline, because a week-old schedule is still worth
 * reading. A week-old door code is not. Putting the codes in the page would have forced one
 * of two bad answers: expire her whole schedule nightly, or keep codes forever.
 *
 * So the page holds no code and asks for one. This answer is `no-store`, so no browser cache
 * and nothing in between may hold it, and it carries the deadline the service worker honours:
 * the end of today, which is the rule written as a number. The worker keeps this one answer,
 * and only this one, which is what lets her read the code at a gate with no signal on the day
 * and gives her nothing the morning after.
 *
 * Three things are checked before any code is in the response: her cookie resolves and the
 * device is still enrolled, her PIN has been given on this phone, and the job is one her own
 * published document carries **today**. Her document holds her jobs and nobody else's, which
 * is what makes it the thing worth checking a slug against.
 */
export async function GET(request: Request) {
  const holder = await currentHolder();
  if (!holder) return NextResponse.json({ ok: false }, { status: 401 });
  if (!(await pinGiven(holder))) return NextResponse.json({ ok: false }, { status: 403 });

  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!slug) return NextResponse.json({ ok: false }, { status: 400 });

  let block = null;
  try {
    const document = await scheduleFor(holder.person);
    const visit = document ? findVisit(document.visits, slug) : null;
    // Not hers, or not today. One answer for both: from here they are the same thing, which
    // is that there is no code for this phone to have right now.
    if (!document || !visit || visit.date !== todayInBangkok()) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
    block = accessFor(document, visit.property);
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  if (!block) return NextResponse.json({ ok: false }, { status: 404 });

  const response = NextResponse.json({ ok: true, heading: block.heading, lines: block.lines });
  // No cache we cannot reach may hold a door code: not the browser's, not a proxy in
  // between. The service worker's is the one exception, because it is ours, it takes the
  // deadline below, and a revoked phone's whole cache is wiped on its next navigation.
  response.headers.set("Cache-Control", "no-store, must-revalidate");

  // The deadline the worker honours, read from the PIN session this request already proved.
  const pin = await readPinCookie(
    (await cookies()).get(CLEANING_PIN_COOKIE)?.value,
    holder.person,
    holder.device,
  );
  if (pin) response.headers.set(CLEANING_KEEP_HEADER, String(codesKeepUntil(pin.expires)));

  return response;
}
