import { redirect } from "next/navigation";
import { Message, RemarksBlock, RenderedBlock } from "@/components/cleaning/blocks";
import { HouseCodes } from "@/components/cleaning/house-codes";
import { MonthGrid, type MonthView } from "@/components/cleaning/month-grid";
import { ScheduleView } from "@/components/cleaning/schedule-view";
import { OfflineNotice } from "@/components/cleaning/offline-notice";
import { PinForm } from "@/components/cleaning/pin-form";
import { SeenRecorder } from "@/components/cleaning/seen-recorder";
import { DayList, NextVisitCard } from "@/components/cleaning/visits";
import { acceptState, hidingDeclined } from "@/lib/cleaning/accept";
import { scheduleFor } from "@/lib/cleaning/assign";
import { pinSetAt } from "@/lib/cleaning/devices";
import {
  builtAtDigits,
  daySections,
  nextVisitIndex,
  propertyOf,
  monthDigits,
  monthWeeks,
  monthOf,
  monthsShown,
  todayInBangkok,
  visitSlug,
  type Visit,
} from "@/lib/cleaning/document";
import { pinGiven, requireHolder } from "@/lib/cleaning/guard";
import { asVisit, before, pastVisits } from "@/lib/cleaning/history";
import { teamLang } from "@/lib/cleaning/lang";
import { houseMarks, markOf } from "@/lib/cleaning/houses";
import { CLEANING_NEW, cleaningJobPath } from "@/lib/cleaning/routes";
import { sinceLastSeen, visitIdentity, visitsDigest } from "@/lib/cleaning/seen";
import { builtAtLine, teamStrings, written } from "@/lib/cleaning/strings";

/**
 * Her days, behind her PIN.
 *
 * **The PIN is the front door of the app, not a second gate in front of the codes.** Paul's
 * decision, 17/11/2026, in his own words: she has already put her password in, so she can
 * see all the schedules. So this screen asks for it once and from then on both the schedule
 * and the codes open with no further prompt.
 *
 * **With more than one house the screen answers a different question.** Not when the next
 * clean is, which is what one property makes the only question, but what the day holds and
 * in what order, which is why the list below is days with jobs under them rather than jobs
 * in a line. A document from a single-property run carries no houses and every one of those
 * differences quietly disappears.
 *
 * Everything on screen is text the published document carries, rendered by the same script
 * that renders the LINE Note Paul pastes. This page sorts by an ISO date, works out which
 * visit is next, marks what has changed since she last looked, lays thirty days out as a
 * grid, and puts text on a phone. It composes nothing.
 */

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const holder = await requireHolder();
  // Her phone's language, which is the app's own words and not the schedule's: the
  // document below arrives as finished text in the language it was published in.
  const lang = await teamLang();
  const t = teamStrings(lang);

  let document = null;
  try {
    document = await scheduleFor(holder.person);
  } catch {
    // The store is unreachable, or what is under her key is not readable. She cannot act on
    // either, so she gets the one message she can act on.
    document = null;
  }

  if (!document) {
    return (
      <main>
        <Message text={t.noSchedule} />
      </main>
    );
  }

  // The gate. Her name is shown above it, from her own document, because a phone that has
  // just been enrolled should say whose it is before it asks for anything.
  if (!(await pinGiven(holder))) {
    const set = await pinSetAt(holder.person).catch(() => null);
    return (
      <main lang={document.lang}>
        {set ? (
          <PinForm name={document.name} lang={lang} />
        ) : (
          <Message text={t.pinMissing} />
        )}
      </main>
    );
  }

  const today = todayInBangkok();
  // How she has answered her cleans. Read before anything is drawn, because it decides whether
  // this screen renders at all and which visits are hers to see.
  const state = await acceptState(holder.person, document.visits).catch(() => ({
    waiting: new Set<string>(),
    takenAt: new Map<string, string>(),
    declinedAt: new Map<string, string>(),
  }));
  // **Anything new holds her on its own screen first.** Paul, 18/11/2026: the accept screen
  // has to be a different screen from the calendar and the list, so that she answers all of
  // the new work before she goes into her schedule. Only cleans from today onwards count: a
  // clean last Tuesday that was never answered would otherwise shut her out for good, and
  // src/app/cleaning/new/page.tsx applies the same cut-off so the two cannot disagree.
  if (document.visits.some((visit) => visit.date >= today && state.waiting.has(visitSlug(visit)))) {
    redirect(CLEANING_NEW);
  }

  // **What she turned down is not her schedule.** Paul, 18/11/2026, after watching Aun decline
  // three cleans and still see all three. Everything below this line reads `visits` and never
  // the document's own list, so the list, the next-visit card and the month grid's counts
  // cannot disagree about which cleans are hers.
  const visits = hidingDeclined(document.visits, state);
  const nextIndex = nextVisitIndex(visits, today);
  const next = nextIndex >= 0 ? visits[nextIndex] : null;
  const { changed } = await sinceLastSeen(holder.person, visits);
  const { waiting } = state;
  const digest = await visitsDigest(visits);

  // **The cleans she has already done**, which her document stopped carrying the moment the
  // run moved past them. Paul, 19/11/2026: she has to be able to look back at last month to
  // check she has been paid, and the payslip is a photograph in the thread on that clean.
  // Anything the document still carries wins, because it is the published row; the ledger
  // fills in behind it. src/lib/cleaning/history.ts says why the app may hold this at all.
  const live = new Set(visits.map((visit) => visitSlug(visit)));
  const past = before(await pastVisits(holder.person).catch(() => []), today).filter(
    (one) => !live.has(one.slug),
  );
  const pastHouses = new Map(past.map((one) => [one.slug, one.house]));
  const remembered = past.map(asVisit);
  const everything = [...remembered, ...visits];
  const when = document.built_at ? builtAtDigits(document.built_at) : null;
  // Only on the day, which is Paul's rule for every door code in this app. The card names
  // the house she is going to whatever day it is; the codes appear under it only when that
  // day is today, and they are fetched rather than rendered, so no saved copy of this page
  // holds one. src/components/cleaning/house-codes.tsx carries the reasoning.
  const codesToday = next && next.date === today ? visitSlug(next) : null;
  // Which shape stands for which house, worked out once and handed to every part of the
  // screen, so the grid and the rows cannot disagree about it.
  const marks = houseMarks(document);
  // The house on a row: the document's own where it names houses, and the name the ledger
  // kept for a clean the document no longer carries. A ledger house has no id and so no
  // shape, which is right: a shape is for telling two live houses apart.
  const houseOf = (visit: Visit) => {
    const named = propertyOf(document, visit);
    if (named) return named;
    const remembered = pastHouses.get(visitSlug(visit));
    return remembered ? { id: "", name: remembered, address: null, map: null } : null;
  };

  // Every month the arrows can reach, with its grid, worked out here: the calendar is a
  // client component so that paging is state, and none of the date arithmetic crosses that
  // boundary with it.
  const shown = monthsShown(everything, today);
  const months: MonthView[] = shown.map((month) => ({
    key: month,
    digits: monthDigits(month),
    weeks: monthWeeks(everything, month, today),
  }));
  // Where this month sits in that run, so the grid opens on now and the months behind it are
  // one tap back rather than the first thing she sees.
  const openAt = Math.max(0, shown.indexOf(monthOf(today)));

  return (
    // The document's language while the phone is set to Thai, because the document is then
    // most of the screen; the app's when it is set to English, because the lines, the day
    // headings and the prompts are then the app's and only the skill's prose underneath is
    // still Thai. The same expression is on the job and day screens.
    <main lang={lang === "en" ? lang : document.lang}>
      <header>
        {/* The app's own title and deliberately not the document's. Paul, 18/11/2026: the
            first screen should not say Lotus House, because it can be any house. The
            published title is the queue title off one property's record, which stopped being
            the whole truth the day a second property arrived. The house is on every row that
            needs it. */}
        {written(t.scheduleTitle) ? (
          <h1 className="text-[19px] font-semibold leading-7 text-text">
            {written(t.scheduleTitle)}
          </h1>
        ) : null}
        {/* **The house, when the document names none.** A single-property run publishes no
            houses at all, so there is no pill on a row and nothing on this screen says which
            house she is going to; the only place the house appears in that document is the
            queue title the skill wrote. Paul, 19/11/2026: she has several houses and the list
            should say which. This is that, until the run publishes the property block and
            every row carries its own name and shape. */}
        {document.properties.length === 0 ? (
          <p className="mt-1 text-[15px] font-semibold leading-6 text-body">{document.title}</p>
        ) : null}
        {when && builtAtLine(lang, when) ? (
          <p
            className="mt-1 text-[13px] text-muted"
            style={{ fontFamily: "var(--font-plex-sans), system-ui, sans-serif" }}
          >
            {builtAtLine(lang, when)}
          </p>
        ) : null}
      </header>
      <OfflineNotice lang={lang} />

      {next && next.date === today && written(t.todaysWork) ? (
        <h2 className="mt-5 text-[15px] font-semibold text-muted">{written(t.todaysWork)}</h2>
      ) : null}
      {next ? (
        <NextVisitCard
          visit={next}
          isChanged={changed.has(visitIdentity(next))}
          house={houseOf(next)}
          mark={markOf(marks, next.property)}
          jobHref={cleaningJobPath(visitSlug(next))}
          lang={lang}
          isWaiting={waiting.has(visitSlug(next))}
        />
      ) : null}

      {codesToday ? <HouseCodes slug={codesToday} lang={lang} /> : null}

      <ScheduleView
        list={
          /* The clean in the card above is not in the list below it. Paul, 19/11/2026: today
             is in the black card and in the list, and it is duplicated. A day holding a
             second clean still shows that one under its heading. */
          <DayList
            sections={daySections(
              everything.filter((visit) => !next || visitSlug(visit) !== visitSlug(next)),
            )}
            nextDate={next ? next.date : null}
            today={today}
            changed={changed}
            waiting={waiting}
            role={document.role}
            lang={lang}
            marks={marks}
            houseOf={houseOf}
            jobHref={(visit) => cleaningJobPath(visitSlug(visit))}
          />
        }
        calendar={<MonthGrid months={months} marks={marks} lang={lang} start={openAt} />}
      />

      {document.contact ? <RenderedBlock block={document.contact} lang={lang} /> : null}
      {document.remarks ? <RemarksBlock block={document.remarks} lang={lang} /> : null}

      <SeenRecorder stamp={digest} />
    </main>
  );
}
