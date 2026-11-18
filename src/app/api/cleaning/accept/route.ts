import { NextResponse } from "next/server";
import { acceptVisit } from "@/lib/cleaning/accept";
import { VISIT_SLUG } from "@/lib/cleaning/comment-shape";
import { parseDocument } from "@/lib/cleaning/document";
import { currentHolder, pinGiven } from "@/lib/cleaning/guard";
import { readNote } from "@/lib/cleaning/store";

export const runtime = "nodejs";

/**
 * She takes one clean on.
 *
 * The same four gates the comment route describes, for the same reasons, and the third is
 * again the one that matters: the slug is checked against her own published document, so a
 * guessed slug cannot write a row about a clean that is not hers. `acceptVisit` checks it a
 * second time against the same list, because a route that trusts its own earlier check is a
 * route that stops checking the day somebody refactors it.
 *
 * No rate limit, unlike the comment route. There are at most a few dozen cleans on a
 * schedule, accepting one twice is the same row written twice, and the write is bounded by
 * what her own document holds rather than by what she sends.
 *
 * It answers `{ ok }` and nothing else. What she accepted, and when, is read back off her
 * schedule on the next render; sending it back here would be a second copy of a fact the
 * store already holds.
 */
export async function POST(request: Request) {
  const holder = await currentHolder();
  if (!holder) return NextResponse.json({ ok: false }, { status: 401 });
  if (!(await pinGiven(holder))) return NextResponse.json({ ok: false }, { status: 403 });

  let slug = "";
  try {
    const sent = (await request.json()) as { slug?: unknown };
    slug = typeof sent.slug === "string" ? sent.slug : "";
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!VISIT_SLUG.test(slug)) return NextResponse.json({ ok: false }, { status: 400 });

  let document = null;
  try {
    document = parseDocument(await readNote(holder.person));
  } catch {
    document = null;
  }
  if (!document) return NextResponse.json({ ok: false }, { status: 503 });

  try {
    const took = await acceptVisit(holder.person, document.visits, slug);
    if (!took) return NextResponse.json({ ok: false }, { status: 404 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
