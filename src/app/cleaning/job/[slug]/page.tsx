import Link from "next/link";
import { redirect } from "next/navigation";
import { Message, RenderedBlock } from "@/components/cleaning/blocks";
import {
  ChevronLeft,
  HouseMark,
  JobType,
  Occupied,
  Phone,
  Pin,
} from "@/components/cleaning/glyphs";
import { AcceptChoice } from "@/components/cleaning/accept-choice";
import { HouseCodes } from "@/components/cleaning/house-codes";
import { Comments } from "@/components/cleaning/comments";
import { OfflineNotice } from "@/components/cleaning/offline-notice";
import { findVisit, parseDocument, propertyOf, todayInBangkok } from "@/lib/cleaning/document";
import { acceptState } from "@/lib/cleaning/accept";
import { visitLine } from "@/lib/cleaning/english";
import { listComments } from "@/lib/cleaning/comments";
import { pinGiven, requireHolder } from "@/lib/cleaning/guard";
import { teamLang } from "@/lib/cleaning/lang";
import { houseMarks, markOf } from "@/lib/cleaning/houses";
import { CLEANING_SCHEDULE } from "@/lib/cleaning/routes";
import { readNote } from "@/lib/cleaning/store";
import { teamStrings, written } from "@/lib/cleaning/strings";

/**
 * One job: which house, when, where it is, and the way to its codes.
 *
 * The screen every comparable product has and this app did not, because with one property
 * every question except "when" was answered by there being only one property. With two,
 * "which one and where" is the question, and a schedule that cannot answer it is one she
 * cannot work from.
 *
 * **The address is the new thing, and it is the point.** It is the house's own, written
 * once, carried finished like every other string, and it opens whatever map app her phone
 * has. ZenMaid's cleaner app puts the address on the job card with a link to directions,
 * and that is exactly the shape of the gap here.
 *
 * **The codes are not on this screen, and the way to them only exists on the day.** Paul's
 * rule, 17/11/2026: a house's codes are hers to see on a day she is at that house, because
 * not every cleaner holds every house. So this screen shows the way in on the day of the
 * clean and shows nothing at all on any other day, which is also what she gets if she opens
 * next Tuesday's job this evening.
 *
 * They stay on their own path because that path is the one the proxy marks, the worker
 * keeps on a deadline and the browser is told not to store: spreading door codes over a
 * second URL would mean spreading all of that over it too.
 *
 * **Who else is on this clean, and the number to reach them.** The foot of her Note names
 * everyone she will meet anywhere in the week, which is the right shape for a message and
 * the wrong one for a screen about one job at one house. The skill now publishes the same
 * people per visit, so this screen names the one or two who will be at this gate, and their
 * number dials. ZenMaid's job card is the precedent for both halves: the address goes to a
 * map and the contact goes to a phone.
 */

export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const holder = await requireHolder();
  const lang = await teamLang();
  const t = teamStrings(lang);

  // The front door is on the schedule screen, which is also where a phone that has not been
  // through it is sent from anywhere else under /cleaning.
  if (!(await pinGiven(holder))) redirect(CLEANING_SCHEDULE);

  let document = null;
  try {
    document = parseDocument(await readNote(holder.person));
  } catch {
    document = null;
  }

  const visit = document ? findVisit(document.visits, slug) : null;
  if (!document || !visit) {
    return (
      <main>
        <Message text={t.noSchedule} />
      </main>
    );
  }

  const house = propertyOf(document, visit);
  // The day decides, not the job: her clean may be at 12.00 and she may check before she
  // leaves home at 08.00, so the whole of the day she is on counts.
  const isToday = visit.date === todayInBangkok();
  const mark = markOf(houseMarks(document), visit.property);

  // The thread is read here rather than in the client, so it is on the page the service
  // worker saves and a phone with no signal still shows what was said. Writing needs the
  // network; reading what is already there does not.
  const comments = await listComments(slug).catch(() => []);
  // Whether this one is still hers to answer. Same record the new-work screen reads, so that
  // screen and this one cannot disagree about one clean.
  //
  // The pair of buttons shows for a clean she has declined as well as one she has not
  // answered, which is how she changes her mind without going through Paul: she declined a
  // Tuesday, the guest moved, and she can take it after all. An accepted clean shows nothing,
  // because withdrawing from work she agreed to is a conversation and the thread is below.
  const unanswered = await acceptState(holder.person, document.visits)
    .then((state) => state.waiting.has(slug) || state.declinedAt.has(slug))
    .catch(() => false);

  // The two values `type` can hold, each with its own sentence. Anything else renders no
  // sentence at all rather than a guessed one.
  const detail =
    visit.type === "turnover"
      ? written(t.jobTurnover)
      : visit.type === "midstay"
        ? written(t.jobMidstay)
        : "";

  return (
    // The document's language while the phone is set to Thai, because the document is then
    // most of the screen; the app's when it is set to English, because the line, the headings
    // and the prompts are then the app's and only the skill's prose underneath is still Thai.
    <main lang={lang === "en" ? lang : document.lang}>
      <Link
        href={CLEANING_SCHEDULE}
        className="mt-1 flex items-center gap-2 py-2 text-[15px] font-semibold text-muted"
      >
        <ChevronLeft />
        {/* The app's own title, never the document's: the published one names one property,
            and this app serves two. */}
        <span className="min-w-0 truncate">{written(t.scheduleTitle)}</span>
      </Link>
      <OfflineNotice lang={lang} />

      <section className="mt-4 rounded-panel bg-ink p-5">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-on-ink text-ink"
        >
          <JobType role={document.role} />
        </span>
        <p className="mt-4 text-[22px] font-semibold leading-9 text-bg">
          {visitLine(visit, lang)}
        </p>
        {house || visit.type === "midstay" ? (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-[17px] font-semibold text-gold-on-ink">
            {house ? (
              <span className="inline-flex items-center gap-2">
                {mark === null ? null : <HouseMark index={mark} size={15} />}
                {house.name}
              </span>
            ) : null}
            {/* The document's own `type`, drawn. A mid-stay clean means a guest is in the
                house, which is the one thing about a job that changes how she arrives, and
                her line has always said it in words. */}
            {visit.type === "midstay" ? <Occupied size={18} /> : null}
          </p>
        ) : null}
        {/* Inside the card rather than under it, so the thing she is agreeing to and the
            button that agrees to it are one object. She reaches this screen by tapping the
            clean in the card on her first screen, and taking it on here has to be possible
            or that tap is a dead end. */}
        {unanswered ? <AcceptChoice slug={slug} lang={lang} /> : null}
      </section>

      {detail ? (
        <section className="mt-5">
          {written(t.jobDetailsHeading) ? (
            <h2 className="text-[15px] font-semibold text-muted">
              {written(t.jobDetailsHeading)}
            </h2>
          ) : null}
          <p className="mt-2 rounded-panel border border-border bg-bg p-4 text-[17px] leading-7 text-text">
            {detail}
          </p>
        </section>
      ) : null}

      {/* Anything true of this one clean, under its own heading. The text is the skill's,
          from the payload, and it is the same text the job line already ends with: a cot or
          an extra bed is worth saying twice and worth a heading of its own. */}
      {visit.note ? (
        <section className="mt-5">
          {written(t.jobRequestsHeading) ? (
            <h2 className="text-[15px] font-semibold text-muted">
              {written(t.jobRequestsHeading)}
            </h2>
          ) : null}
          <p className="mt-2 rounded-panel bg-wash-gold p-4 text-[17px] leading-7 text-deep-gold">
            {visit.note}
          </p>
        </section>
      ) : null}

      {house?.address && written(t.jobAddressHeading) ? (
        <h2 className="mt-5 text-[15px] font-semibold text-muted">
          {written(t.jobAddressHeading)}
        </h2>
      ) : null}
      {house?.address ? (
        house.map ? (
          <a
            href={house.map}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-start gap-3 rounded-panel border border-border bg-bg p-4 text-[16px] leading-7 text-body"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted"
            >
              <Pin />
            </span>
            <span className="min-w-0">{house.address}</span>
          </a>
        ) : (
          <p className="mt-4 flex items-start gap-3 rounded-panel border border-border bg-bg p-4 text-[16px] leading-7 text-body">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted"
            >
              <Pin />
            </span>
            <span className="min-w-0">{house.address}</span>
          </p>
        )
      ) : null}

      {/* The codes themselves, on the day, fetched rather than rendered so that no saved
          copy of this page holds one. Nothing at all on any other day. */}
      {isToday ? <HouseCodes slug={slug} lang={lang} /> : null}

      {visit.with.length > 0 && written(t.jobPeopleHeading) ? (
        <h2 className="mt-5 text-[15px] font-semibold text-muted">
          {written(t.jobPeopleHeading)}
        </h2>
      ) : null}
      {visit.with.length > 0 ? (
        <section className="mt-4 overflow-hidden rounded-panel border border-border">
          <ul className="divide-y divide-hairline">
            {visit.with.map((person, index) => {
              const name = (
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-semibold leading-6 text-text">
                    {person.roleLabel ? `${person.roleLabel} ` : ""}
                    {person.name}
                  </span>
                  {person.phone ? (
                    <span
                      className="mt-0.5 block text-[16px] leading-6 text-body"
                      style={{ fontFamily: "var(--font-plex-sans), system-ui, sans-serif" }}
                    >
                      {person.phone}
                    </span>
                  ) : null}
                </span>
              );
              const chip = (
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted"
                >
                  <Phone />
                </span>
              );
              return (
                <li key={index}>
                  {person.phone ? (
                    // The digits of the published number, with its spaces taken out for the
                    // dialler and never for the screen: the number above is printed exactly
                    // as the roster holds it.
                    <a
                      href={`tel:${person.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-3 p-4 transition-colors duration-150 active:bg-surface"
                    >
                      {chip}
                      {name}
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 p-4">
                      {chip}
                      {name}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* The whole run's contact block, and **only** when this job has no people of its own.
          With both on screen the same colleague and the same number were printed twice, a few
          millimetres apart, which is what showed up the moment two houses were rendered. A
          document published before the skill carried per-visit people still has this, and it
          is then the only thing on screen that answers who she is working with. */}
      {visit.with.length === 0 && document.contact ? (
        <RenderedBlock block={document.contact} lang={lang} tone="panel" />
      ) : null}

      <section className="mt-6">
        {written(t.commentsHeading) ? (
          <h2 className="text-[15px] font-semibold text-muted">
            {written(t.commentsHeading)}
          </h2>
        ) : null}
        <Comments slug={slug} comments={comments} lang={lang} />
      </section>

      {/* Clear of the composer, which is the one place on these screens where a thumb is
          typing rather than tapping. */}
      <div className="h-16" />
    </main>
  );
}
