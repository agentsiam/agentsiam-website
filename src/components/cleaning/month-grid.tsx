import Link from "next/link";
import { HouseMark } from "@/components/cleaning/glyphs";
import type { CalendarCell } from "@/lib/cleaning/document";
import { markOf } from "@/lib/cleaning/houses";
import { cleaningDayPath } from "@/lib/cleaning/routes";
import { CALENDAR_WEEKDAYS, weekdaysWritten } from "@/lib/cleaning/strings";

/**
 * The next thirty days as a grid, above the list rather than instead of it.
 *
 * Paul asked for a calendar view. The one published case study of a cleaning team's app that
 * reports what its users said has the calendar as the thing they found confusing, and cards
 * as what replaced it, so this is deliberately the smaller half of the screen: an
 * at-a-glance answer to "how busy am I this month", with the list underneath carrying every
 * job in the words her LINE Note uses.
 *
 * **A day with work in it is now a link to that day**, which is Paul's instruction of
 * 17/11/2026 and closes the hole in this screen: it could say which days were busy and gave
 * her no way to ask what was on them. A day with no work is not a link, because the screen
 * behind it would be empty and an empty screen in this app says to ask Paul, which would be
 * the wrong thing to say about a Tuesday off.
 *
 * **The markers say which houses, not just how many jobs.** One mark per job, in time order,
 * each one the shape belonging to that house. Two identical dots answered "two jobs" and
 * left the question two houses actually raise, which is where they are. Where a document
 * names fewer than two houses there is nothing to tell apart and the marks are dots again.
 *
 * It prints digits and markers and nothing else. No month name and no day name is composed
 * here, because every Thai date in this app belongs to the skill that renders her Note, and
 * a grid is exactly where an app starts inventing one. The column headings are the one
 * exception and they are Paul's to write, which is why they arrive from
 * src/lib/cleaning/strings.ts like every other sentence on these screens.
 *
 * Sunday first, because a Thai week starts on Sunday.
 */

/** One mark per job that day, up to three, in the order the day runs. */
function Marks({
  cell,
  marks,
  onInk,
}: {
  cell: CalendarCell;
  marks: Map<string, number>;
  onInk: boolean;
}) {
  if (cell.jobs === 0) return null;
  return (
    <span aria-hidden="true" className="mt-0.5 flex items-center gap-0.5">
      {cell.houses.slice(0, 3).map((house, index) => {
        const mark = markOf(marks, house);
        if (mark === null) {
          // One house, or a document from before there were two: a dot, exactly as before.
          return (
            <span
              key={index}
              className={`h-1.5 w-1.5 rounded-full ${onInk ? "bg-gold-on-ink" : "bg-sand"}`}
            />
          );
        }
        return (
          <span key={index} className={onInk ? "text-gold-on-ink" : "text-deep-gold"}>
            <HouseMark index={mark} size={7} filled />
          </span>
        );
      })}
    </span>
  );
}

export function MonthGrid({
  weeks,
  marks,
}: {
  weeks: CalendarCell[][];
  marks: Map<string, number>;
}) {
  return (
    <section className="mt-6 rounded-panel border border-border bg-bg p-3">
      <div className="grid grid-cols-7 gap-1">
        {/* All seven or none: a row of empty cells over the grid would be a heading that has
            lost its words rather than a grid that never had any. */}
        {weekdaysWritten()
          ? CALENDAR_WEEKDAYS.map((day, index) => (
              <div
                key={index}
                className="pb-1 text-center text-[11px] font-semibold tracking-wide text-muted"
              >
                {day}
              </div>
            ))
          : null}

        {weeks.flat().map((cell, index) => {
          if (!cell.date) return <div key={index} aria-hidden="true" className="h-11" />;

          // Three states, and only one of them can be true at a time: the next job, any
          // other working day, and a day she is not at a house. Today is marked on top of
          // whichever it is, because "where am I now" is a different question from "when do
          // I work next".
          const tone = cell.isNext
            ? "bg-ink text-gold-on-ink"
            : cell.jobs > 0
              ? "bg-wash-gold text-deep-gold"
              : "text-muted";
          const shape = `flex h-11 flex-col items-center justify-center rounded-lg ${tone} ${
            cell.isToday ? "ring-2 ring-inset ring-primary" : ""
          }`;
          const digits = (
            <>
              <span
                className={`text-[15px] ${cell.jobs > 0 ? "font-semibold" : ""}`}
                style={{ fontFamily: "var(--font-plex-sans), system-ui, sans-serif" }}
              >
                {cell.day}
              </span>
              <Marks cell={cell} marks={marks} onInk={cell.isNext} />
            </>
          );

          return cell.jobs > 0 ? (
            <Link
              key={index}
              href={cleaningDayPath(cell.date)}
              className={`${shape} transition-opacity duration-150 active:opacity-70`}
            >
              {digits}
            </Link>
          ) : (
            <div key={index} className={shape}>
              {digits}
            </div>
          );
        })}
      </div>
    </section>
  );
}
