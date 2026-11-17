"use client";

import { useState, useSyncExternalStore } from "react";
import { CalendarView, ListView } from "@/components/cleaning/glyphs";

/**
 * The switch between her days as a list and her month as a grid.
 *
 * Paul asked for both views and a switch between them, 17/11/2026. They used to be stacked,
 * the grid above the list, which meant the grid pushed the first job of the week off the
 * screen on a phone and the list could not be reached from the calendar without scrolling
 * past it. One at a time, and the card at the top of the screen stays whichever is chosen,
 * because the next clean is the question the app is opened to ask in both.
 *
 * **It opens on the list.** The one published case study of a cleaning team's own app that
 * reports what its users said found the calendar the confusing part and cards the clear
 * one, so the list is the default and the calendar is the view she asks for.
 *
 * **State, not a URL.** A `?view=` parameter would be a second URL for one screen, and the
 * service worker matches a saved page ignoring the query string: one saved copy would then
 * answer for both views and whichever was saved last would win. A switch that lives in the
 * component cannot do that, and it works on a phone with no signal.
 *
 * What she picked is remembered per phone, because somebody who prefers the calendar
 * prefers it every morning. It is a convenience and nothing depends on it: a browser that
 * refuses storage gets the list, which is the default anyway.
 */

const REMEMBERED = "as-clean-view";

/** What this phone chose last time, or the list for a phone that has never chosen and for
 * one that refuses storage. */
function remembered(): boolean {
  try {
    return window.localStorage.getItem(REMEMBERED) === "calendar";
  } catch {
    return false;
  }
}

/** Another tab of the same app changing the choice. Rare on a phone, free to support, and
 * it is what makes this a store React can read rather than state copied in an effect. */
function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function ScheduleView({
  list,
  calendar,
}: {
  list: React.ReactNode;
  calendar: React.ReactNode;
}) {
  // The server has no localStorage and renders the list, so the server snapshot is the
  // list and React swaps in what the phone remembers after hydration. Read as a store
  // rather than copied into state in an effect, which is the same result without a render
  // that throws the first one away.
  const stored = useSyncExternalStore(subscribe, remembered, () => false);
  const [chosen, setChosen] = useState<boolean | null>(null);
  const showCalendar = chosen ?? stored;

  function choose(calendarWanted: boolean) {
    setChosen(calendarWanted);
    try {
      window.localStorage.setItem(REMEMBERED, calendarWanted ? "calendar" : "list");
    } catch {
      /* Not remembering is not a failure worth telling her about. */
    }
  }

  const tab = "flex h-10 flex-1 items-center justify-center rounded-lg transition-colors duration-150";
  const on = "bg-ink text-gold-on-ink";
  const off = "text-muted";

  return (
    <div className="mt-5">
      <div
        role="tablist"
        className="flex gap-1 rounded-box bg-surface p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={!showCalendar}
          onClick={() => choose(false)}
          className={`${tab} ${showCalendar ? off : on}`}
        >
          <ListView size={20} />
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={showCalendar}
          onClick={() => choose(true)}
          className={`${tab} ${showCalendar ? on : off}`}
        >
          <CalendarView size={20} />
        </button>
      </div>

      {showCalendar ? calendar : list}
    </div>
  );
}
