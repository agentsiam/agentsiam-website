import { NextResponse } from "next/server";
import { currentSession } from "@/lib/admin/guard";
import { addComment, cleanBody, VISIT_SLUG } from "@/lib/cleaning/comments";
import { PIN_SHAPE, createEnrolToken, revokeDevice, setPin } from "@/lib/cleaning/devices";
import { findVisit, parseDocument } from "@/lib/cleaning/document";
import { ourPhotoPaths } from "@/lib/cleaning/photos";
import { cleaningEnrolPath } from "@/lib/cleaning/routes";
import { PERSON_KEY } from "@/lib/cleaning/session";
import { readNote, storeProblem } from "@/lib/cleaning/store";

export const runtime = "nodejs";

/**
 * The four things Paul does to the cleaning app: issue a link, revoke a phone, set a PIN,
 * and answer somebody about a clean.
 *
 * Behind the admin session, because Paul is already signed in to one and a second sign-in
 * for the same person is a second thing to lose. **No door code passes through here.** The
 * codes live in the published document, which only the person they belong to can open, and
 * that has not changed. What has changed is that the last action reads one person's visits,
 * because answering a message about a clean means naming which clean, and a thread with no
 * job attached is a thread nobody can act on.
 *
 * The session is checked here as well as in src/proxy.ts, for the same reason every other
 * admin route checks it: an edge check reads a cookie and cannot be the only thing standing
 * in front of a route that mints an enrolment link.
 */
export async function POST(request: Request) {
  if (!(await currentSession())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const problem = storeProblem();
  if (problem) return NextResponse.json({ error: problem }, { status: 503 });

  let body: {
    action?: unknown;
    person?: unknown;
    device?: unknown;
    pin?: unknown;
    slug?: unknown;
    body?: unknown;
    images?: unknown;
    image?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const person = typeof body.person === "string" ? body.person : "";
  if (!PERSON_KEY.test(person)) {
    return NextResponse.json({ error: "That is not a roster key." }, { status: 400 });
  }

  try {
    if (body.action === "link") {
      const token = await createEnrolToken(person);
      return NextResponse.json({ url: enrolUrl(request, token) });
    }

    if (body.action === "revoke") {
      const device = typeof body.device === "string" ? body.device : "";
      const gone = await revokeDevice(person, device);
      if (!gone) {
        return NextResponse.json({ error: "No such device for that person." }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "comment") {
      const slug = typeof body.slug === "string" ? body.slug : "";
      const text = cleanBody(body.body);
      // Checked against the shape this app writes, the same way her route checks hers.
      const images = ourPhotoPaths(body.images, body.image);
      if (!VISIT_SLUG.test(slug) || (!text && images.length === 0)) {
        return NextResponse.json(
          { error: "A comment needs a job, and words or a photo." },
          { status: 400 },
        );
      }
      // Her own document decides which jobs exist, exactly as it does on her phone. Paul
      // cannot start a thread on a job she does not have.
      const document = parseDocument(await readNote(person));
      if (!document || !findVisit(document.visits, slug)) {
        return NextResponse.json({ error: "That person has no such job." }, { status: 404 });
      }
      const result = await addComment(slug, {
        by: "agentsiam",
        name: "AgentSiam",
        body: text,
        images,
      });
      if (result !== "ok") {
        return NextResponse.json({ error: `The comment was not stored: ${result}.` }, { status: 409 });
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "pin") {
      const pin = typeof body.pin === "string" ? body.pin : "";
      if (!PIN_SHAPE.test(pin)) {
        return NextResponse.json({ error: "A PIN is four to eight digits." }, { status: 400 });
      }
      await setPin(person, pin);
      return NextResponse.json({ ok: true });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "That did not work." },
      { status: 500 },
    );
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

/**
 * The link Paul pastes into LINE, absolute, because a relative path is not something a
 * person can tap out of a chat.
 *
 * Built from the host this request arrived on, which is whatever Paul has open: the live
 * domain from the live admin screen, localhost from a dev server. The app answers on one
 * host at one prefix, so there is no second shape for this link to take.
 */
function enrolUrl(request: Request, token: string): string {
  return new URL(cleaningEnrolPath(token), request.url).toString();
}
