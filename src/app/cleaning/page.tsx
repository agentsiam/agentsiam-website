import { RemarksBlock, RenderedBlock } from "@/components/cleaning/blocks";
import { MonthGrid } from "@/components/cleaning/month-grid";
import { OfflineNotice } from "@/components/cleaning/offline-notice";
import { PinForm } from "@/components/cleaning/pin-form";
import { SeenRecorder } from "@/components/cleaning/seen-recorder";
import { DayList, NextVisitCard } from "@/components/cleaning/visits";
import { pinSetAt } from "@/lib/cleaning/devices";
import {
  accessFor,
  builtAtDigits,
  calendarWeeks,
  daySections,
  nextVisitIndex,
  parseDocument,
  propertyOf,
  todayInBangkok,
  visitSlug,
} from "@/lib/cleaning/document";
import { pinGiven, requireHolder } from "@/lib/cleaning/guard";
import { cleaningCodesPath, cleaningJobPath } from "@/lib/cleaning/routes";
import { sinceLastSeen, visitIdentity, visitsDigest } from "@/lib/cleaning/seen";
import { readNote } from "@/lib/cleaning/store";
import { TEAM_STRINGS, builtAtLine } from "@/lib/cleaning/strings";

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
        <p className="mt-8 rounded-panel border border-hairline bg-surface p-5 text-[17px] leading-7 text-body">
          {TEAM_STRINGS.noSchedule}
        </p>
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
          <PinForm name={document.name} />
        ) : (
          <p className="mt-8 rounded-panel border border-hairline bg-surface p-5 text-[17px] leading-7 text-body">
            {TEAM_STRINGS.pinMissing}
          </p>
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
  const nextAccess = next ? accessFor(document, next.property) : null;

  return (
    <main lang={document.lang}>
      <header>
        <h1 className="text-[19px] font-semibold leading-7 text-text">{document.title}</h1>
        {when ? (
          <p
            className="mt-1 text-[13px] text-muted"
            style={{ fontFamily: "var(--font-plex-sans), system-ui, sans-serif" }}
          >
            {builtAtLine(when)}
          </p>
        ) : null}
      </header>
      <OfflineNotice />

      {next ? (
        <NextVisitCard
          visit={next}
          isChanged={changed.has(visitIdentity(next))}
          house={propertyOf(document, next)}
          role={document.role}
          codesHeading={nextAccess ? nextAccess.heading : null}
          codesHref={cleaningCodesPath(next.property)}
          jobHref={cleaningJobPath(visitSlug(next))}
        />
      ) : null}

      <MonthGrid weeks={calendarWeeks(document.visits, today)} />

      <DayList
        sections={daySections(document.visits)}
        nextDate={next ? next.date : null}
        today={today}
        changed={changed}
        role={document.role}
        houseOf={(visit) => propertyOf(document, visit)}
        jobHref={(visit) => cleaningJobPath(visitSlug(visit))}
      />

      {document.contact ? <RenderedBlock block={document.contact} /> : null}
      {document.remarks ? <RemarksBlock block={document.remarks} /> : null}

      <SeenRecorder stamp={digest} />
    </main>
  );
}
