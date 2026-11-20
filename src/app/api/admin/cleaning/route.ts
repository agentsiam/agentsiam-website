import { NextResponse } from "next/server";
import { currentSession } from "@/lib/admin/guard";
import { agreedShape, clearAnswer } from "@/lib/cleaning/accept";
import { clearMove, moveVisit, readAssignments, scheduleFor } from "@/lib/cleaning/assign";
import { addComment, cleanBody, VISIT_SLUG } from "@/lib/cleaning/comments";
import {
  PIN_SHAPE,
  createEnrolToken,
  pinSetAt,
  revokeDevice,
  setDeviceLabel,
  setPin,
} from "@/lib/cleaning/devices";
import { findVisit, parseDocument, todayInBangkok } from "@/lib/cleaning/document";
import {
  MOVED_DATE,
  cleanDayLabel,
  cleanTime,
  clearWhen,
  moveWhen,
} from "@/lib/cleaning/when";
import { ourPhotoPaths } from "@/lib/cleaning/photos";
import { cleaningEnrolPath } from "@/lib/cleaning/routes";
import { PERSON_KEY } from "@/lib/cleaning/session";
import { readNote, storeProblem } from "@/lib/cleaning/store";

export const runtime = "nodejs";

/**
 * The eight things Paul does to the cleaning app: issue a link, revoke a phone, name a
 * phone, set a PIN, answer somebody about a clean, give a clean somebody turned down to
 * another cleaner, give it back, which includes giving it back to the person who turned it
 * down, and move a clean to another date or hour.
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
    label?: unknown;
    pin?: unknown;
    date?: unknown;
    time?: unknown;
    slug?: unknown;
    to?: unknown;
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
      // **Her PIN comes first, because the link is opened with it.** A link minted before
      // she has a code is a link nobody can use: the enrol screen would meet her with "no
      // code has been set for you yet" and nothing she could do about it.
      if (!(await pinSetAt(person))) {
        return NextResponse.json(
          { error: `${person} has no PIN yet, and the link is opened with it. Set one first.` },
          { status: 409 },
        );
      }
      const token = await createEnrolToken(person);
      return NextResponse.json({ url: enrolUrl(request, token) });
    }

    // **Moving a clean, and putting it back.** `person` is the one it was published to, which
    // is how every other action here names the person it is about. The clean is checked against
    // her published document rather than against what she is shown, because a clean already
    // moved once is no longer on her screens and moving it on is exactly what this is for.
    if (body.action === "assign" || body.action === "unassign") {
      const slug = typeof body.slug === "string" ? body.slug : "";
      if (!VISIT_SLUG.test(slug)) {
        return NextResponse.json({ error: "That is not a job." }, { status: 400 });
      }
      if (body.action === "unassign") {
        await clearMove(slug, todayInBangkok());
        return NextResponse.json({ ok: true });
      }
      const to = typeof body.to === "string" ? body.to : "";
      if (!PERSON_KEY.test(to)) {
        return NextResponse.json({ error: "That is not a roster key." }, { status: 400 });
      }
      // **Her schedule as she sees it**, not her published document, because a clean can be
      // moved on: Paul gives Da's Tuesday to Aun on the Monday and to ป้า on the Tuesday, and
      // by then it is not in Aun's published document at all.
      const hers = await scheduleFor(person);
      const visit = hers ? findVisit(hers.visits, slug) : null;
      if (!visit) {
        return NextResponse.json({ error: "That person has no such job." }, { status: 404 });
      }
      // **Giving it back to the person who turned it down.** Paul, 19/11/2026: it does not have
      // to go to somebody else. There is nothing to move, so what happens instead is that her
      // answer is forgotten and the clean reaches her again as new work, and any move somebody
      // else was holding it under is cleared with it.
      if (to === person) {
        await clearMove(slug, todayInBangkok());
        await clearAnswer(person, hers?.visits ?? [], slug);
        return NextResponse.json({ ok: true });
      }
      // She has to have a schedule of her own to receive it: a moved clean is merged into a
      // published document, and there is nothing to merge it into otherwise.
      if (!(await readNote(to).catch(() => null))) {
        return NextResponse.json(
          { error: `Nothing is published for ${to}, so there is no schedule to add it to.` },
          { status: 409 },
        );
      }
      // **Who loses it stays the person it was published to**, however many times it moves.
      // The schedule run keeps publishing that clean to her on every run, so she is the one it
      // has to be taken off; recording the last holder instead would hand it back to the first
      // one the next time anybody looked.
      const standing = (await readAssignments()).get(slug);
      const from = standing?.from ?? person;
      await moveVisit({ slug, from, to, line: agreedShape(visit) }, todayInBangkok());
      return NextResponse.json({ ok: true });
    }

    // **Moving a clean to another date or hour.** Paul, 20/11/2026: he needs to move it, and
    // moving it asks him again who it goes to. The second half is not written here: the shape
    // an assignment was made against carries the hour a clean was moved to, so this write
    // ends any standing assignment and the clean goes back to whoever it was published to,
    // waiting to be given out again. Both people on the job are asked again for the same
    // reason, which is what he asked for.
    //
    // **The shape stored with the move is the published one**, with any hour it has already
    // been moved to taken off. The overlay compares against the document, so a shape carrying
    // the last move would never match and a second move would silently do nothing.
    if (body.action === "when" || body.action === "unwhen") {
      const slug = typeof body.slug === "string" ? body.slug : "";
      if (!VISIT_SLUG.test(slug)) {
        return NextResponse.json({ error: "That is not a job." }, { status: 400 });
      }
      const today = todayInBangkok();
      if (body.action === "unwhen") {
        await clearWhen(slug, today);
        return NextResponse.json({ ok: true });
      }
      const date = typeof body.date === "string" ? body.date : "";
      const time = cleanTime(body.time);
      if (!MOVED_DATE.test(date) || !time) {
        return NextResponse.json(
          { error: "A move needs a date and an hour written like 15.00." },
          { status: 400 },
        );
      }
      if (date < today) {
        return NextResponse.json(
          { error: "That date has gone, so nobody would ever see the clean." },
          { status: 409 },
        );
      }
      // Her schedule as she sees it, the same way the assign action reads it, so a clean she
      // was given by somebody else can be moved as readily as one of her own.
      const hers = await scheduleFor(person);
      const visit = hers ? findVisit(hers.visits, slug) : null;
      if (!visit) {
        return NextResponse.json({ error: "That person has no such job." }, { status: 404 });
      }
      await moveWhen(
        {
          slug,
          date,
          time,
          shape: agreedShape({ ...visit, movedTo: undefined }),
          // His words for the new day, kept as he wrote them. Only ever read when the clean
          // moved to another day, because on the same day the published label is still true.
          label: cleanDayLabel(body.label),
        },
        today,
      );
      return NextResponse.json({ ok: true });
    }

    if (body.action === "revoke") {
      const device = typeof body.device === "string" ? body.device : "";
      const gone = await revokeDevice(person, device);
      if (!gone) {
        return NextResponse.json({ error: "No such device for that person." }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    }

    // **Naming a phone.** One person holds one record per browser, so two of them can be
    // one handset in LINE and in its own browser, and the agent strings barely differ. The
    // name is his, never hers: it is read on this screen and appears nowhere in the app.
    // An empty one removes it.
    if (body.action === "label") {
      const device = typeof body.device === "string" ? body.device : "";
      const label = typeof body.label === "string" ? body.label : "";
      if (!(await setDeviceLabel(person, device, label))) {
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
 *
 * It is not single-use, and it is not the secret either: she opens it with her PIN, in every
 * browser she wants the app in, and it stops working after thirty days.
 */
function enrolUrl(request: Request, token: string): string {
  return new URL(cleaningEnrolPath(token), request.url).toString();
}
