import type { CalendarCell } from "@/lib/cleaning/document";
import { CALENDAR_WEEKDAYS } from "@/lib/cleaning/strings";

/**
 * The next thirty days as a grid, above the list rather than instead of it.
 *
 * Paul asked for a calendar view. The one published case study of a cleaning team's app
 * that reports what its users said has the calendar as the thing they found confusing, and
 * cards as what replaced it, so this is deliberately the smaller half of the screen: an
 * at-a-glance answer to "how busy am I this month", with the list underneath carrying every
 * job in the words her LINE Note uses.
 *
 * It prints digits and markers and nothing else. No month name and no day name are composed
 * here, because every Thai date in this app belongs to the skill that renders her Note, and
 * a grid is exactly where an app starts inventing one. The column headings are the one
 * exception and they are Paul's to write, which is why they arrive from
 * src/lib/cleaning/strings.ts like every other sentence on these screens.
 *
 * Sunday first, because a Thai week starts on Sunday.
 */
export function MonthGrid({ weeks }: { weeks: CalendarCell[][] }) {
  return (
    <section className="mt-6 rounded-panel border border-border bg-bg p-3">
      <div className="grid grid-cols-7 gap-1">
        {CALENDAR_WEEKDAYS.map((day, index) => (
          <div
            key={index}
            className="pb-1 text-center text-[11px] font-semibold tracking-wide text-muted"
          >
            {day}
          </div>
        ))}

        {weeks.flat().map((cell, index) => {
          if (!cell.date) return <div key={index} aria-hidden="true" className="h-11" />;

          // Three states, and only one of them can be true at a time: the next job, any
          // other working day, and a day she is not at the house. Today is marked on top of
          // whichever it is, because "where am I now" is a different question from "when do
          // I work next".
          const tone = cell.isNext
            ? "bg-ink text-gold-on-ink"
            : cell.jobs > 0
              ? "bg-wash-gold text-deep-gold"
              : "text-muted";

          return (
            <div
              key={index}
              className={`flex h-11 flex-col items-center justify-center rounded-lg ${tone} ${
                cell.isToday ? "ring-2 ring-inset ring-primary" : ""
              }`}
            >
              <span
                className={`text-[15px] ${cell.jobs > 0 ? "font-semibold" : ""}`}
                style={{ fontFamily: "var(--font-plex-sans), system-ui, sans-serif" }}
              >
                {cell.day}
              </span>
              {cell.jobs > 0 ? (
                <span
                  aria-hidden="true"
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                    cell.isNext ? "bg-gold-on-ink" : "bg-sand"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
