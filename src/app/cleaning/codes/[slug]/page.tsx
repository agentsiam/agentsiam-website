import Link from "next/link";
import { redirect } from "next/navigation";
import { Message } from "@/components/cleaning/blocks";
import { ChevronLeft, HouseMark } from "@/components/cleaning/glyphs";
import { OfflineNotice } from "@/components/cleaning/offline-notice";
import {
  accessFor,
  findVisit,
  propertyOf,
  todayInBangkok,
} from "@/lib/cleaning/document";
import { scheduleFor } from "@/lib/cleaning/assign";
import { pinGiven, requireHolder } from "@/lib/cleaning/guard";
import { teamLang } from "@/lib/cleaning/lang";
import { houseMarks, markOf } from "@/lib/cleaning/houses";
import { CLEANING_SCHEDULE, cleaningJobPath } from "@/lib/cleaning/routes";
import { teamStrings } from "@/lib/cleaning/strings";

/**
 * One job's codes. One house, one day, and no way to ask for anything else.
 *
 * **There is no screen that lists codes.** Paul, 17/11/2026: a cleaner may see a house's
 * codes when they relate to her assigned cleaning day at that house, and the screen that
 * listed every house she works at should not exist at all. So this page hangs off a job:
 * the URL names a visit, the visit names the house and the day, and both have to be hers
 * and the day has to be today. There is nothing to filter because there is nothing to list.
 *
 * What that replaces was one screen carrying every house, defended at the time on the
 * grounds that one saved copy has to answer every link or a phone with no signal opens the
 * wrong house's codes. Per job, that problem disappears rather than being solved: each
 * job's codes are their own URL and their own saved copy, so the phone cannot show the
 * wrong house's number because it only ever saved the one it was shown.
 *
 * **It keeps its own path for the same three reasons it always did.** This path is the one
 * src/proxy.ts answers `no-store` on, the one it puts a deadline on for the service worker,
 * and the one the worker refuses to keep past that deadline. The deadline is the end of the
 * day, which is this rule expressed as a number. Putting a code on the job screen would
 * mean spreading all of that over a page that is cached like any other.
 *
 * Every string is the published document's. The lines read `ประตูรั้ว: 1234` as one piece of
 * text, label and value together, exactly as her LINE Note prints them, which is why the
 * label is not styled apart from the number: splitting that line would mean this app
 * deciding where a Thai sentence ends.
 */

export const dynamic = "force-dynamic";

export default async function JobCodesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const holder = await requireHolder();
  const lang = await teamLang();

  // The front door is the schedule screen, which is also where a phone that has not been
  // through it is sent from anywhere else under /cleaning.
  if (!(await pinGiven(holder))) redirect(CLEANING_SCHEDULE);

  let document = null;
  try {
    document = await scheduleFor(holder.person);
  } catch {
    document = null;
  }

  const visit = document ? findVisit(document.visits, slug) : null;
  if (!document || !visit) redirect(CLEANING_SCHEDULE);

  // The day rule, and the only place it is enforced now that nothing lists codes. A job she
  // is not on today is a job whose codes are not hers today, and she is put back on the job
  // itself rather than told off: the rest of that screen is still hers.
  if (visit.date !== todayInBangkok()) redirect(cleaningJobPath(slug));

  const house = propertyOf(document, visit);
  const block = accessFor(document, visit.property);
  const mark = markOf(houseMarks(document), visit.property);

  return (
    <main lang={document.lang}>
      {/* Back to the job rather than to the schedule, because the job is where this was
          opened from and the only place it can be opened from. */}
      <Link
        href={cleaningJobPath(slug)}
        className="mt-1 flex items-center gap-2 py-2 text-[15px] font-semibold text-muted"
      >
        <ChevronLeft />
        <span className="min-w-0 truncate">{visit.line}</span>
      </Link>
      <OfflineNotice lang={lang} />

      {block ? (
        <section className="mt-4 rounded-panel bg-ink p-5">
          {house ? (
            <p className="flex items-center gap-2 text-[17px] font-semibold text-bg">
              {mark === null ? null : <HouseMark index={mark} size={15} />}
              {house.name}
            </p>
          ) : null}
          <h1
            className={`text-[14px] font-semibold tracking-wide text-gold-on-ink ${
              house ? "mt-1" : ""
            }`}
          >
            {block.heading}
          </h1>
          <ul className="mt-4 space-y-4">
            {block.lines.map((line, index) => (
              <li
                key={index}
                className="text-[27px] font-semibold leading-10 tracking-wide text-bg"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <Message text={teamStrings(lang).noSchedule} className="mt-6" />
      )}
    </main>
  );
}
