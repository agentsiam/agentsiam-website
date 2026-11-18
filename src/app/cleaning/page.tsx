import { Message, RemarksBlock, RenderedBlock } from "@/components/cleaning/blocks";
import { HouseCodes } from "@/components/cleaning/house-codes";
import { MonthGrid, type MonthView } from "@/components/cleaning/month-grid";
import { ScheduleView } from "@/components/cleaning/schedule-view";
import { OfflineNotice } from "@/components/cleaning/offline-notice";
import { PinForm } from "@/components/cleaning/pin-form";
import { SeenRecorder } from "@/components/cleaning/seen-recorder";
import { DayList, NextVisitCard } from "@/components/cleaning/visits";
import { pinSetAt } from "@/lib/cleaning/devices";
import {
  builtAtDigits,
  daySections,
  nextVisitIndex,
  parseDocument,
  propertyOf,
  monthDigits,
  monthWeeks,
  monthsAhead,
  todayInBangkok,
  visitSlug,
} from "@/lib/cleaning/document";
import { pinGiven, requireHolder } from "@/lib/cleaning/guard";
import { teamLang } from "@/lib/cleaning/lang";
import { houseMarks, markOf } from "@/lib/cleaning/houses";
import { cleaningJobPath } from "@/lib/cleaning/routes";
import { sinceLastSeen, visitIdentity, visitsDigest } from "@/lib/cleaning/seen";
import { readNote } from "@/lib/cleaning/store";
import { builtAtLine, teamStrings } from "@/lib/cleaning/strings";

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
    document = parseDocument(await readNote(holder.person));
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
  const nextIndex = nextVisitIndex(document.visits, today);
  const next = nextIndex >= 0 ? document.visits[nextIndex] : null;
  const { changed } = await sinceLastSeen(holder.person, document.visits);
  const digest = await visitsDigest(document.visits);
  const when = document.built_at ? builtAtDigits(document.built_at) : null;
  // Only on the day, which is Paul's rule for every door code in this app. The card names
  // the house she is going to whatever day it is; the codes appear under it only when that
  // day is today, and they are fetched rather than rendered, so no saved copy of this page
  // holds one. src/components/cleaning/house-codes.tsx carries the reasoning.
  const codesToday = next && next.date === today ? visitSlug(next) : null;
  // Which shape stands for which house, worked out once and handed to every part of the
  // screen, so the grid and the rows cannot disagree about it.
  const marks = houseMarks(document);

  // Every month the arrows can reach, with its grid, worked out here: the calendar is a
  // client component so that paging is state, and none of the date arithmetic crosses that
  // boundary with it.
  const months: MonthView[] = monthsAhead(document.visits, today).map((month) => ({
    key: month,
    digits: monthDigits(month),
    weeks: monthWeeks(document.visits, month, today),
  }));

  return (
    <main lang={document.lang}>
      <header>
        <h1 className="text-[19px] font-semibold leading-7 text-text">{document.title}</h1>
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

      {next ? (
        <NextVisitCard
          visit={next}
          isChanged={changed.has(visitIdentity(next))}
          house={propertyOf(document, next)}
          mark={markOf(marks, next.property)}
          jobHref={cleaningJobPath(visitSlug(next))}
          lang={lang}
        />
      ) : null}

      {codesToday ? <HouseCodes slug={codesToday} lang={lang} /> : null}

      <ScheduleView
        list={
          <DayList
            sections={daySections(document.visits)}
            nextDate={next ? next.date : null}
            today={today}
            changed={changed}
            role={document.role}
            lang={lang}
            marks={marks}
            houseOf={(visit) => propertyOf(document, visit)}
            jobHref={(visit) => cleaningJobPath(visitSlug(visit))}
          />
        }
        calendar={<MonthGrid months={months} marks={marks} lang={lang} />}
      />

      {document.contact ? <RenderedBlock block={document.contact} /> : null}
      {document.remarks ? <RemarksBlock block={document.remarks} /> : null}

      <SeenRecorder stamp={digest} />
    </main>
  );
}
