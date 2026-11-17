import Link from "next/link";
import { ChevronRight, JobType, Padlock } from "@/components/cleaning/glyphs";
import type { DaySection, PropertyRef, Visit } from "@/lib/cleaning/document";
import { dayOfMonth, visitSlug } from "@/lib/cleaning/document";
import { visitIdentity } from "@/lib/cleaning/seen";
import { TEAM_STRINGS, written } from "@/lib/cleaning/strings";

/**
 * Her work, as days rather than as a list of jobs.
 *
 * With one house the question was when the next clean is. With two it is what the day holds
 * and in what order, which is the shape every comparable product converged on and the shape
 * this file now takes: a heading per day, a card per job under it, the house on the card.
 *
 * Every row prints `visit.line` and nothing else: the day name, the date, the time, who is
 * on it, the occupied marker and anything true of that one clean, exactly as the Note
 * renders them. **Nothing here formats a date or words a sentence.** The day heading is a
 * label the skill rendered, the day number beside a line is a digit lifted off the ISO date
 * for scanning, and the job type is a shape rather than a word.
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

/** The house, as a quiet chip under the line. Absent entirely when there is only one house,
 * because naming it then is noise on every single row. */
function House({ house }: { house: PropertyRef | null }) {
  if (!house) return null;
  return (
    <span className="mt-1.5 inline-block rounded-full bg-surface-2 px-2.5 py-0.5 text-[13px] font-semibold text-muted">
      {house.name}
    </span>
  );
}

/**
 * That this line is new or has moved since she last looked.
 *
 * A pill while the sentence exists, and a dot while it does not. Without the fallback,
 * taking the placeholder off the screen would take the whole signal with it, and this is
 * the one thing the app does that her LINE Note cannot: silently dropping it would leave
 * the app with no reason to exist that a pasted message does not already cover.
 */
function Changed({ onInk = false }: { onInk?: boolean }) {
  const said = written(TEAM_STRINGS.changedSinceSeen);
  if (!said) {
    return (
      <span
        aria-hidden="true"
        className={`mt-2 block h-2 w-2 rounded-full ${onInk ? "bg-gold-on-ink" : "bg-sand"}`}
      />
    );
  }
  return (
    <p
      className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${
        onInk ? "bg-gold-on-ink text-ink" : "bg-wash-gold text-deep-gold"
      }`}
    >
      {said}
    </p>
  );
}

/**
 * The next job, as the whole top of the screen.
 *
 * This is the one question she opens the app to ask, so it is answered before anything else
 * and in the largest type on the page, and the way into the codes for **that** house is
 * inside the same card. Standing at a gate, that is one tap from opening the app to reading
 * the number for the lock, and with two houses it is one tap to the right number.
 */
export function NextVisitCard({
  visit,
  isChanged,
  house,
  codesHeading,
  codesHref,
  jobHref,
}: {
  visit: Visit;
  isChanged: boolean;
  house: PropertyRef | null;
  codesHeading: string | null;
  codesHref: string;
  jobHref: string;
}) {
  return (
    <section className="mt-5 overflow-hidden rounded-panel bg-ink">
      <Link href={jobHref} className="flex items-start gap-4 p-5">
        <Digits className="shrink-0 text-[44px] font-semibold leading-none text-gold-on-ink">
          {dayOfMonth(visit.date)}
        </Digits>
        <div className="min-w-0 flex-1">
          <p className="text-[20px] font-semibold leading-8 text-bg">{visit.line}</p>
          {/* No job-type glyph up here. In the rows below it sits in a 40px chip and reads
              cleanly; shrunk into a pill beside text it is a smudge, and the card already
              says what the job is in her own words. */}
          {house ? (
            <span className="mt-2 inline-block rounded-full bg-gold-on-ink px-2.5 py-0.5 text-[13px] font-semibold text-ink">
              {house.name}
            </span>
          ) : null}
          {isChanged ? <Changed onInk /> : null}
        </div>
        <span aria-hidden="true" className="mt-1 shrink-0 text-gold-on-ink opacity-60">
          <ChevronRight />
        </span>
      </Link>

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
 * Every day she has work, in order, each one holding its jobs.
 *
 * Past days stay, dimmed. They are in the Note she is holding in LINE, and a screen that
 * silently holds fewer jobs than the Note is the second schedule this app exists not to be.
 */
export function DayList({
  sections,
  nextDate,
  today,
  changed,
  role,
  houseOf,
  jobHref,
}: {
  sections: DaySection[];
  nextDate: string | null;
  today: string;
  changed: Set<string>;
  role: string;
  houseOf: (visit: Visit) => PropertyRef | null;
  jobHref: (visit: Visit) => string;
}) {
  if (sections.length === 0) return null;

  return (
    <div className="mt-7">
      {sections.map((day) => {
        const isPast = day.date < today;
        return (
          <section key={day.date} className={isPast ? "opacity-40" : ""}>
            {/* No heading at all on a document that carries no day label, rather than an
                empty one: that is what every document published before the skill rendered
                these looks like, and it should read as the old flat list and not as a
                screen with its headings missing. */}
            {day.label ? (
              <h2 className="mt-5 flex items-baseline gap-2 text-[15px] font-semibold text-text">
                {day.label}
                {day.visits.length > 1 ? (
                  <Digits className="rounded-full bg-surface-2 px-2 py-0.5 text-[12px] text-muted">
                    {day.visits.length}
                  </Digits>
                ) : null}
              </h2>
            ) : null}
            <ul className="mt-2 divide-y divide-hairline border-y border-hairline">
              {day.visits.map((visit) => {
                const isNext = visit.date === nextDate && day.visits[0] === visit;
                const house = houseOf(visit);
                return (
                  <li key={visitSlug(visit)}>
                    <Link href={jobHref(visit)} className="flex items-start gap-3 py-3">
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          isNext ? "bg-ink text-gold-on-ink" : "bg-surface text-muted"
                        }`}
                      >
                        <JobType role={role} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[17px] leading-7 ${
                            isNext ? "font-semibold text-text" : "text-body"
                          }`}
                        >
                          {visit.line}
                        </p>
                        <House house={house} />
                        {changed.has(visitIdentity(visit)) ? <Changed /> : null}
                      </div>
                      <span aria-hidden="true" className="mt-2 shrink-0 text-muted">
                        <ChevronRight />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
