import { NextResponse } from "next/server";
import { addComment, cleanBody, VISIT_SLUG } from "@/lib/cleaning/comments";
import { findVisit, parseDocument } from "@/lib/cleaning/document";
import { currentHolder, pinGiven } from "@/lib/cleaning/guard";
import { incr, readNote } from "@/lib/cleaning/store";

export const runtime = "nodejs";

/** Ten a minute, per person. Nobody types ten comments a minute about a clean; a phone
 * somebody else is holding might try to. */
const PER_MINUTE = 10;
const RATE_WINDOW_SECONDS = 60;

/**
 * Her half of the conversation about one job.
 *
 * **The first route in this app that stores something a person typed.** Until now the team
 * read and nothing else, and anything they had to say went back through LINE. So this
 * checks four things before it writes, and the third is the one that matters:
 *
 *   1. The device cookie resolves, and the device is still enrolled.
 *   2. Her PIN has been given on this phone. The PIN is the front door of the app, and a
 *      phone that has not been through it cannot write any more than it can read.
 *   3. **The job is in her own published document.** Her document holds her jobs and
 *      nobody else's, so it is the only list worth checking a slug against. Without this a
 *      slug is a guessable string and another person's thread is one request away.
 *   4. She is not writing faster than a person writes.
 *
 * It stores her name from that same document rather than anything the client sent, so a
 * comment cannot arrive signed by somebody else.
 */
export async function POST(request: Request) {
  const holder = await currentHolder();
  if (!holder) return NextResponse.json({ ok: false }, { status: 401 });
  if (!(await pinGiven(holder))) return NextResponse.json({ ok: false }, { status: 403 });

  let slug = "";
  let body = "";
  try {
    const sent = (await request.json()) as { slug?: unknown; body?: unknown };
    slug = typeof sent.slug === "string" ? sent.slug : "";
    body = cleanBody(sent.body);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!VISIT_SLUG.test(slug) || !body) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const document = parseDocument(await readNote(holder.person));
    const visit = document ? findVisit(document.visits, slug) : null;
    // Not "forbidden": from here it is indistinguishable from a job that has dropped off a
    // republished schedule, and the screen behaves the same way for both.
    if (!document || !visit) return NextResponse.json({ ok: false }, { status: 404 });

    const used = await incr(`cleaning:commentrate:${holder.person}`, RATE_WINDOW_SECONDS);
    if (used > PER_MINUTE) return NextResponse.json({ ok: false }, { status: 429 });

    const result = await addComment(slug, { by: "team", name: document.name, body });
    if (result !== "ok") return NextResponse.json({ ok: false, result }, { status: 409 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
