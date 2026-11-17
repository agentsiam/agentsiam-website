import Link from "next/link";
import { redirect } from "next/navigation";
import { Message, RenderedBlock } from "@/components/cleaning/blocks";
import {
  ChevronLeft,
  HouseMark,
  JobType,
  Occupied,
  Padlock,
  Phone,
  Pin,
} from "@/components/cleaning/glyphs";
import { CodesButton } from "@/components/cleaning/codes-button";
import { Comments } from "@/components/cleaning/comments";
import { OfflineNotice } from "@/components/cleaning/offline-notice";
import { accessFor, findVisit, parseDocument, propertyOf } from "@/lib/cleaning/document";
import { listComments } from "@/lib/cleaning/comments";
import { pinGiven, requireHolder } from "@/lib/cleaning/guard";
import { houseMarks, markOf } from "@/lib/cleaning/houses";
import { CLEANING_SCHEDULE, cleaningCodesPath } from "@/lib/cleaning/routes";
import { readNote } from "@/lib/cleaning/store";
import { TEAM_STRINGS, written } from "@/lib/cleaning/strings";

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
 * **The codes are not on this screen.** There is a way to them, one tap, pointed at this
 * house. They stay on their own path because that path is the one the proxy marks, the
 * worker keeps on a deadline and the browser is told not to store: spreading door codes
 * over a second URL would mean spreading all of that over it too.
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
        <Message text={TEAM_STRINGS.noSchedule} />
      </main>
    );
  }

  const house = propertyOf(document, visit);
  const access = accessFor(document, visit.property);
  const mark = markOf(houseMarks(document), visit.property);

  // The thread is read here rather than in the client, so it is on the page the service
  // worker saves and a phone with no signal still shows what was said. Writing needs the
  // network; reading what is already there does not.
  const comments = await listComments(slug).catch(() => []);

  // The two values `type` can hold, each with its own sentence. Anything else renders no
  // sentence at all rather than a guessed one.
  const detail =
    visit.type === "turnover"
      ? written(TEAM_STRINGS.jobTurnover)
      : visit.type === "midstay"
        ? written(TEAM_STRINGS.jobMidstay)
        : "";

  return (
    <main lang={document.lang}>
      <Link
        href={CLEANING_SCHEDULE}
        className="mt-1 flex items-center gap-2 py-2 text-[15px] font-semibold text-muted"
      >
        <ChevronLeft />
        <span className="min-w-0 truncate">{document.title}</span>
      </Link>
      <OfflineNotice />

      <section className="mt-4 rounded-panel bg-ink p-5">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-on-ink text-ink"
        >
          <JobType role={document.role} />
        </span>
        <p className="mt-4 text-[22px] font-semibold leading-9 text-bg">{visit.line}</p>
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
      </section>

      {detail ? (
        <section className="mt-5">
          {written(TEAM_STRINGS.jobDetailsHeading) ? (
            <h2 className="text-[15px] font-semibold text-muted">
              {written(TEAM_STRINGS.jobDetailsHeading)}
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
          {written(TEAM_STRINGS.jobRequestsHeading) ? (
            <h2 className="text-[15px] font-semibold text-muted">
              {written(TEAM_STRINGS.jobRequestsHeading)}
            </h2>
          ) : null}
          <p className="mt-2 rounded-panel bg-wash-gold p-4 text-[17px] leading-7 text-deep-gold">
            {visit.note}
          </p>
        </section>
      ) : null}

      {house?.address && written(TEAM_STRINGS.jobAddressHeading) ? (
        <h2 className="mt-5 text-[15px] font-semibold text-muted">
          {written(TEAM_STRINGS.jobAddressHeading)}
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

      {access ? (
        <Link
          href={cleaningCodesPath(visit.property)}
          className="mt-4 flex items-center justify-between gap-3 rounded-panel bg-sand px-5 py-4 text-[18px] font-semibold text-ink transition-colors duration-150 active:bg-gold-on-ink"
        >
          <span className="min-w-0">{access.heading}</span>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-gold-on-ink"
          >
            <Padlock />
          </span>
        </Link>
      ) : null}

      {visit.with.length > 0 && written(TEAM_STRINGS.jobPeopleHeading) ? (
        <h2 className="mt-5 text-[15px] font-semibold text-muted">
          {written(TEAM_STRINGS.jobPeopleHeading)}
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
        <RenderedBlock block={document.contact} tone="panel" />
      ) : null}

      <section className="mt-6">
        {written(TEAM_STRINGS.commentsHeading) ? (
          <h2 className="text-[15px] font-semibold text-muted">
            {written(TEAM_STRINGS.commentsHeading)}
          </h2>
        ) : null}
        <Comments slug={slug} comments={comments} />
      </section>

      {/* Clear of the composer, which is the one place on these screens where a thumb is
          typing rather than tapping. */}
      <div className="h-16" />
      <CodesButton label={document.access[0]?.heading ?? null} />
    </main>
  );
}
