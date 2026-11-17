import Link from "next/link";
import { Padlock } from "@/components/cleaning/glyphs";
import type { Visit } from "@/lib/cleaning/document";
import { dayOfMonth } from "@/lib/cleaning/document";
import { visitIdentity } from "@/lib/cleaning/seen";
import { TEAM_STRINGS } from "@/lib/cleaning/strings";

/**
 * Her visits, in the order her LINE Note lists them, with the next one unmissable.
 *
 * Every row prints `visit.line` and nothing else: the day name, the date, the time, who is
 * on it, the occupied marker and anything true of that one clean, exactly as the Note
 * renders them. **Nothing here formats a date or words a sentence.** The day number beside
 * a line is a digit lifted off the ISO date for scanning, which is the one thing the Thai
 * line is bad at on a phone held at arm's length, and the only decisions this file makes
 * are which row is loud, which is quiet and which carries a marker.
 */

/** A number in the Latin face, so digits never render in the Thai one beside Thai text. */
function Digits({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={className}
      style={{ fontFamily: "var(--font-plex-sans), system-ui, sans-serif" }}
    >
      {children}
    </span>
  );
}

/**
 * The next clean, as the whole top of the screen.
 *
 * This is the one question she opens the app to ask, so it is answered before anything else
 * on the page and in the largest type on it, and the way into her codes is inside the same
 * card rather than somewhere below the fold. Standing at a gate, that is one tap from
 * opening the app to reading the number for the lock.
 */
export function NextVisitCard({
  visit,
  isChanged,
  codesHeading,
  codesHref,
}: {
  visit: Visit;
  isChanged: boolean;
  codesHeading: string | null;
  codesHref: string;
}) {
  return (
    <section className="mt-5 overflow-hidden rounded-panel bg-ink">
      <div className="flex items-start gap-4 p-5">
        <Digits className="shrink-0 text-[44px] font-semibold leading-none text-gold-on-ink">
          {dayOfMonth(visit.date)}
        </Digits>
        <div className="min-w-0">
          <p className="text-[20px] font-semibold leading-8 text-bg">{visit.line}</p>
          {isChanged ? (
            <p className="mt-2 inline-block rounded-full bg-gold-on-ink px-2.5 py-0.5 text-[13px] font-semibold text-ink">
              {TEAM_STRINGS.changedSinceSeen}
            </p>
          ) : null}
        </div>
      </div>

      {codesHeading ? (
        <Link
          href={codesHref}
          className="flex items-center justify-between gap-3 bg-sand px-5 py-4 text-[18px] font-semibold text-ink transition-colors duration-150 active:bg-gold-on-ink"
        >
          <span className="min-w-0">{codesHeading}</span>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-gold-on-ink"
          >
            <Padlock />
          </span>
        </Link>
      ) : null}
    </section>
  );
}

/**
 * Everything else she has, as rows rather than cards.
 *
 * Cards for thirty days of work is thirty panels to scroll past. A row is a day number, a
 * line and a hairline, which fits a month on two screens and keeps the card shape meaning
 * one thing: the job she is on next.
 *
 * Past jobs stay, dimmed. They are in the Note she is holding in LINE, and a screen that
 * silently holds fewer jobs than the Note is the second schedule this app exists not to be.
 */
export function VisitList({
  visits,
  nextDate,
  today,
  changed,
}: {
  visits: Visit[];
  nextDate: string | null;
  today: string;
  changed: Set<string>;
}) {
  if (visits.length === 0) return null;

  return (
    <ol className="mt-6 divide-y divide-hairline border-y border-hairline">
      {visits.map((visit, index) => {
        const isNext = visit.date === nextDate;
        const isPast = visit.date < today;
        const isChanged = changed.has(visitIdentity(visit));
        return (
          <li
            key={`${visit.date}-${visit.booking ?? index}`}
            className={`flex items-start gap-3 py-3 ${isPast ? "opacity-40" : ""}`}
          >
            <Digits
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[17px] font-semibold ${
                isNext
                  ? "bg-ink text-gold-on-ink"
                  : isChanged
                    ? "bg-wash-gold text-deep-gold"
                    : "bg-surface text-muted"
              }`}
            >
              {dayOfMonth(visit.date)}
            </Digits>
            <div className="min-w-0 pt-1.5">
              <p
                className={`text-[17px] leading-7 ${
                  isNext ? "font-semibold text-text" : "text-body"
                }`}
              >
                {visit.line}
              </p>
              {isChanged ? (
                <p className="mt-1.5 inline-block rounded-full bg-wash-gold px-2.5 py-0.5 text-[13px] font-semibold text-deep-gold">
                  {TEAM_STRINGS.changedSinceSeen}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
