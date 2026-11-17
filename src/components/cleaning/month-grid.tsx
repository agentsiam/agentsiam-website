"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, HouseMark } from "@/components/cleaning/glyphs";
import type { CalendarCell } from "@/lib/cleaning/document";
import { markOf, type HouseMarks } from "@/lib/cleaning/houses";
import { cleaningDayPath } from "@/lib/cleaning/routes";
import { CALENDAR_WEEKDAYS, weekdaysWritten } from "@/lib/cleaning/strings";

/**
 * One month at a time, with an arrow to the next.
 *
 * It was a rolling thirty days from today until Paul asked, 17/11/2026, for a month that
 * can be paged: a window starting on today and running out in the middle of December
 * cannot answer "what does December look like", which is the question a calendar is opened
 * to ask. Each month now renders whole, including the days before today, because a month
 * missing its first ten days is not a month.
 *
 * **Every date in it is still the skill's or a digit.** No month name and no day name is
 * composed here. The heading is the month as digits, in the Latin face, exactly like the
 * line that says how old the schedule is, and the seven column headings are Paul's.
 *
 * **The months it can reach come from the document**, worked out on the server: this month,
 * and every later month she has work in. A schedule published three months out gets three
 * months of arrows and one published to the end of the week gets none. Earlier months are
 * not reachable, the same call the list makes by folding finished days away.
 *
 * A client component only because paging is state. All the dates were worked out before it
 * got here, which is why it holds no calendar arithmetic of its own.
 */

export type MonthView = {
  /** `YYYY-MM`, used as a key and never shown. */
  key: string;
  /** `MM/YYYY`, which is the whole of what the heading says. */
  digits: string;
  weeks: CalendarCell[][];
};

/** One mark per job that day, up to three, in the order the day runs. */
function Marks({
  cell,
  marks,
  onInk,
}: {
  cell: CalendarCell;
  marks: HouseMarks;
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

export function MonthGrid({ months, marks }: { months: MonthView[]; marks: HouseMarks }) {
  const [at, setAt] = useState(0);
  if (months.length === 0) return null;
  const month = months[Math.min(at, months.length - 1)];
  const canGoBack = at > 0;
  const canGoOn = at < months.length - 1;

  return (
    <section className="mt-4 rounded-panel border border-border bg-bg p-3">
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          onClick={() => setAt((index) => Math.max(0, index - 1))}
          disabled={!canGoBack}
          aria-label={months[Math.max(0, at - 1)]?.digits}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted disabled:opacity-25"
        >
          <ChevronLeft />
        </button>
        <span
          className="text-[15px] font-semibold text-text"
          style={{ fontFamily: "var(--font-plex-sans), system-ui, sans-serif" }}
        >
          {month.digits}
        </span>
        <button
          type="button"
          onClick={() => setAt((index) => Math.min(months.length - 1, index + 1))}
          disabled={!canGoOn}
          aria-label={months[Math.min(months.length - 1, at + 1)]?.digits}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted disabled:opacity-25"
        >
          <ChevronRight />
        </button>
      </div>

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

        {month.weeks.flat().map((cell, index) => {
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

          // A day with work is a link to that day. A day without is not: the screen behind
          // it would be empty, and the one message this app has for an empty screen is "ask
          // Paul", which is the wrong thing to say about a day off.
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
