import { NextResponse } from "next/server";
import { answerVisit, type AcceptAnswer } from "@/lib/cleaning/accept";
import { scheduleFor } from "@/lib/cleaning/assign";
import { VISIT_SLUG } from "@/lib/cleaning/comment-shape";
import { currentHolder, pinGiven } from "@/lib/cleaning/guard";

export const runtime = "nodejs";

/**
 * She answers one clean, yes or no.
 *
 * Both answers come through here, because they are the same write to the same record and the
 * difference between them is one field. Paul, 18/11/2026: she has to be able to reject the new
 * schedule as well. There is deliberately no third answer and no free text: a reason belongs in
 * the thread on the job screen, which is already the place on these phones where somebody types.
 *
 * The same four gates the comment route describes, for the same reasons, and the third is
 * again the one that matters: the slug is checked against her own published document, so a
 * guessed slug cannot write a row about a clean that is not hers. `answerVisit` checks it a
 * second time against the same list, because a route that trusts its own earlier check is a
 * route that stops checking the day somebody refactors it.
 *
 * No rate limit, unlike the comment route. There are at most a few dozen cleans on a
 * schedule, answering one twice is the same row written twice, and the write is bounded by
 * what her own document holds rather than by what she sends.
 *
 * It answers `{ ok }` and nothing else. What she answered, and when, is read back off her
 * schedule on the next render; sending it back here would be a second copy of a fact the
 * store already holds.
 */
export async function POST(request: Request) {
  const holder = await currentHolder();
  if (!holder) return NextResponse.json({ ok: false }, { status: 401 });
  if (!(await pinGiven(holder))) return NextResponse.json({ ok: false }, { status: 403 });

  let slug = "";
  let answer: AcceptAnswer | null = null;
  try {
    const sent = (await request.json()) as { slug?: unknown; answer?: unknown };
    slug = typeof sent.slug === "string" ? sent.slug : "";
    // Spelled out and never defaulted. A post that reaches here without saying which way she
    // answered is a bug in a screen, and guessing yes would write an agreement she never made.
    if (sent.answer === "yes" || sent.answer === "no") answer = sent.answer;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!VISIT_SLUG.test(slug) || !answer) return NextResponse.json({ ok: false }, { status: 400 });

  let document = null;
  try {
    document = await scheduleFor(holder.person);
  } catch {
    document = null;
  }
  if (!document) return NextResponse.json({ ok: false }, { status: 503 });

  try {
    const answered = await answerVisit(holder.person, document.visits, slug, answer);
    if (!answered) return NextResponse.json({ ok: false }, { status: 404 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
