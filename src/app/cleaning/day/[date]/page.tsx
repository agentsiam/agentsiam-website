import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, HouseMark, JobType, Occupied } from "@/components/cleaning/glyphs";
import { OfflineNotice } from "@/components/cleaning/offline-notice";
import { acceptState } from "@/lib/cleaning/accept";
import { englishDay, visitLine } from "@/lib/cleaning/english";
import {
  dayLabelOn,
  isIsoDate,
  parseDocument,
  propertyOf,
  todayInBangkok,
  visitSlug,
  visitsOn,
} from "@/lib/cleaning/document";
import { pinGiven, requireHolder } from "@/lib/cleaning/guard";
import { teamLang } from "@/lib/cleaning/lang";
import { houseMarks, markOf } from "@/lib/cleaning/houses";
import { CLEANING_NEW, CLEANING_SCHEDULE, cleaningJobPath } from "@/lib/cleaning/routes";
import { readNote } from "@/lib/cleaning/store";
import { teamStrings, written } from "@/lib/cleaning/strings";

/**
 * One day, and what it asks of her, in the order it asks.
 *
 * Paul's instruction, 17/11/2026: tapping a date on the calendar should bring up that date.
 * Until then the grid was a picture. It could say which days were busy and there was no way
 * to ask what was on them, so the only route to a job was scrolling the list under it.
 *
 * It is also the screen the research called for and we had not built. With one house a day
 * held one clean and a heading over a single row said everything; with two, "what is my day
 * and in what order" is the question, and the answer is cards in time order with the house
 * on each one. The ordering is not cosmetic: two houses can want her on the same day, and
 * the document's own hour is what decides which comes first.
 *
 * **Every word on it is the document's.** The heading is the date as the skill rendered it,
 * each card prints the job line exactly as her LINE Note prints it, and the house is a name
 * and a shape. This screen composes nothing and it holds no door code: the codes are one tap
 * away, on the path the proxy marks and the worker keeps on a deadline.
 */

export const dynamic = "force-dynamic";

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const holder = await requireHolder();
  const lang = await teamLang();
  const t = teamStrings(lang);

  // The front door is the schedule screen, which is also where a phone that has not been
  // through it is sent from anywhere else under /cleaning.
  if (!(await pinGiven(holder))) redirect(CLEANING_SCHEDULE);

  // A date off the address bar, so it is checked before anything compares it. Anything that
  // is not a calendar date goes back to the schedule rather than rendering a day that cannot
  // exist.
  if (!isIsoDate(date)) redirect(CLEANING_SCHEDULE);

  let document = null;
  try {
    document = parseDocument(await readNote(holder.person));
  } catch {
    document = null;
  }

  const visits = document ? visitsOn(document.visits, date) : [];
  // A day with no work on it has nothing to say, and the one message this app has for an
  // empty screen is "ask Paul", which would be the wrong thing to say about a day off. The
  // grid does not link such a day; this is for a URL that was kept or typed.
  if (!document || visits.length === 0) redirect(CLEANING_SCHEDULE);

  // New work holds her on its own screen before any of this, the same cut-off and the same
  // reason as the schedule screen: the calendar is where she tapped to get here, and letting
  // this screen through would be a way around the one screen Paul asked to be unavoidable.
  const { waiting } = await acceptState(holder.person, document.visits).catch(() => ({
    waiting: new Set<string>(),
  }));
  if (document.visits.some((one) => one.date >= todayInBangkok() && waiting.has(visitSlug(one)))) {
    redirect(CLEANING_NEW);
  }

  // The skill's label on a Thai phone, and the composed English one otherwise. Null on a
  // document published before the skill rendered day labels, and then no heading at all
  // rather than a guessed one.
  const label = lang === "en" ? englishDay(date) : dayLabelOn(document.visits, date);
  const marks = houseMarks(document);

  return (
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

      {label ? (
        <h1 className="mt-3 text-[26px] font-semibold leading-9 text-text">{label}</h1>
      ) : null}

      <div className="mt-4 space-y-3">
        {visits.map((visit) => {
          const house = propertyOf(document, visit);
          const mark = markOf(marks, visit.property);
          return (
            <Link
              key={visitSlug(visit)}
              href={cleaningJobPath(visitSlug(visit))}
              className="flex items-start gap-3 rounded-panel border border-border bg-bg p-4 transition-colors duration-150 active:bg-surface"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-muted"
              >
                <JobType role={document.role} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] leading-7 text-text">{visitLine(visit, lang)}</p>
                {house || visit.type === "midstay" ? (
                  <span className="mt-2 flex flex-wrap items-center gap-2">
                    {house ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-0.5 text-[13px] font-semibold text-muted">
                        {mark === null ? null : <HouseMark index={mark} size={12} />}
                        {house.name}
                      </span>
                    ) : null}
                    {visit.type === "midstay" ? (
                      <span className="text-deep-gold">
                        <Occupied size={17} />
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </div>
              <span aria-hidden="true" className="mt-2 shrink-0 text-muted">
                <ChevronRight />
              </span>
            </Link>
          );
        })}
      </div>

    </main>
  );
}
