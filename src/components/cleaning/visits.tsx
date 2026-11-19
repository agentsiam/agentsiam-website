import Link from "next/link";
import { ChevronRight, HouseMark, JobType, Occupied } from "@/components/cleaning/glyphs";
import type { DaySection, PropertyRef, Visit } from "@/lib/cleaning/document";
import { dayOfMonth, visitSlug } from "@/lib/cleaning/document";
import { dayHeading, visitLine } from "@/lib/cleaning/english";
import { markOf, type HouseMarks } from "@/lib/cleaning/houses";
import { cleaningDayPath } from "@/lib/cleaning/routes";
import { visitIdentity } from "@/lib/cleaning/seen";
import { teamStrings, written, type TeamLang } from "@/lib/cleaning/strings";

/**
 * Her work, as days rather than as a list of jobs.
 *
 * With one house the question was when the next clean is. With two it is what the day holds
 * and in what order, which is the shape every comparable product converged on and the shape
 * this file takes: a heading per day, a card per job under it, the house on the card.
 *
 * Every row prints one job line: the day name, the date, the time, who is on it, the occupied
 * marker and anything true of that one clean, exactly as the Note renders them. **Nothing here
 * formats a date or words a sentence.** On a Thai phone the line and the day heading are the
 * skill's own finished text; on an English one they are composed from the structure beside it
 * by src/lib/cleaning/english.ts, which is the only file in this app allowed to compose a
 * date and composes one only in English. The day number beside a line is a digit lifted off
 * the ISO date for scanning, the house is a shape and a name the document carries, and the
 * figure on a mid-stay row is the document's own `type` drawn rather than written.
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
 * What this one clean asks for, under the line rather than inside it.
 *
 * Paul, 19/11/2026: the detail or the special request goes into the note, not into the title
 * of the clean. The skill publishes it twice, once on the end of the job line and once as a
 * field of its own, and until now a screen printed the line and got both. Now it prints the
 * day and the hour and this prints the rest, which is the same text in the same words and in
 * a place she can see it is about this clean and not about the day.
 *
 * Gold, like the panel the job screen gives it, because it is the one thing on a row that
 * changes what she packs.
 */
function Request({ note, onInk = false }: { note: string | null; onInk?: boolean }) {
  if (!note) return null;
  return (
    <span
      className={`mt-1.5 block text-[15px] leading-6 ${
        onInk ? "text-gold-on-ink" : "text-deep-gold"
      }`}
    >
      {note}
    </span>
  );
}

/**
 * Which house, and that somebody is in it.
 *
 * One line of metadata under the job line, and both halves of it are the document's: the
 * house's mark and name, then the figure that says this is a mid-stay clean. Absent
 * entirely with one house and an empty house, because naming the only house there is on
 * every row is noise on every row.
 *
 * The mark is the thing that makes two houses tell apart at a glance, and it is deliberately
 * always beside the name here: the calendar shows the mark alone, and this is where she
 * learns which is which. src/lib/cleaning/houses.ts says how a house gets one.
 */
function VisitMeta({
  house,
  mark,
  occupied,
  onInk = false,
}: {
  house: PropertyRef | null;
  mark: number | null;
  occupied: boolean;
  onInk?: boolean;
}) {
  if (!house && !occupied) return null;
  return (
    <span className="mt-1.5 flex flex-wrap items-center gap-2">
      {house ? (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${
            onInk ? "bg-gold-on-ink text-ink" : "bg-surface-2 text-muted"
          }`}
        >
          {mark === null ? null : <HouseMark index={mark} size={12} />}
          {house.name}
        </span>
      ) : null}
      {occupied ? (
        <span className={onInk ? "text-gold-on-ink" : "text-deep-gold"}>
          <Occupied size={17} />
        </span>
      ) : null}
    </span>
  );
}

/**
 * That this clean is waiting for her to take it on.
 *
 * It stands where the changed marker would, and takes precedence over it, because a clean
 * she has not accepted is already being pointed at: saying it changed as well is the same
 * sentence twice. The changed marker is for a clean she has accepted and which then moved in
 * some way that did not reset the acceptance, and for everything on a schedule published
 * before this flow existed.
 *
 * Gold on gold like the changed marker rather than red: she has done nothing wrong, and a
 * red badge on half her week reads as a problem with her.
 */
function Waiting({ lang, onInk = false }: { lang: TeamLang; onInk?: boolean }) {
  const said = written(teamStrings(lang).acceptWaiting);
  if (!said) return null;
  return (
    <p
      className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${
        onInk ? "bg-gold-on-ink text-ink" : "bg-wash-gold text-deep-gold ring-1 ring-sand"
      }`}
    >
      {said}
    </p>
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
function Changed({ lang, onInk = false }: { lang: TeamLang; onInk?: boolean }) {
  const said = written(teamStrings(lang).changedSinceSeen);
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
 * and in the largest type on the page.
 *
 * The codes used to be a bar across the bottom of this card, leading to a screen of its own.
 * Paul, 17/11/2026: the code shows directly inside the schedule without opening a new page,
 * so the panel sits under this card instead and there is no tap at all. It is not part of
 * the card because it is not part of the link: a card that is one big tap to the job cannot
 * also hold a door code she is meant to read standing still.
 */
export function NextVisitCard({
  visit,
  isChanged,
  house,
  mark,
  jobHref,
  lang,
  isWaiting,
}: {
  visit: Visit;
  isChanged: boolean;
  house: PropertyRef | null;
  mark: number | null;
  jobHref: string;
  lang: TeamLang;
  isWaiting: boolean;
}) {
  return (
    <section className="mt-5 overflow-hidden rounded-panel bg-ink">
      <Link href={jobHref} className="flex items-start gap-4 p-5">
        <Digits className="shrink-0 text-[44px] font-semibold leading-none text-gold-on-ink">
          {dayOfMonth(visit.date)}
        </Digits>
        <div className="min-w-0 flex-1">
          <p className="text-[20px] font-semibold leading-8 text-bg">{visitLine(visit, lang)}</p>
          {/* No job-type glyph up here. In the rows below it sits in a 40px chip and reads
              cleanly; shrunk into a pill beside text it is a smudge, and the card already
              says what the job is in her own words. */}
          <Request note={visit.note} onInk />
          <VisitMeta
            house={house}
            mark={mark}
            occupied={visit.type === "midstay"}
            onInk
          />
          {isWaiting ? (
            <Waiting lang={lang} onInk />
          ) : isChanged ? (
            <Changed lang={lang} onInk />
          ) : null}
        </div>
        <span aria-hidden="true" className="mt-1 shrink-0 text-gold-on-ink opacity-60">
          <ChevronRight />
        </span>
      </Link>
    </section>
  );
}

/** One day's heading and its jobs. Used for both halves of the list, so a day reads the
 * same whether it is behind her or in front of her. */
function Day({
  day,
  nextDate,
  changed,
  waiting,
  role,
  lang,
  marks,
  houseOf,
  jobHref,
  dimmed,
}: {
  day: DaySection;
  nextDate: string | null;
  changed: Set<string>;
  waiting: Set<string>;
  role: string;
  lang: TeamLang;
  marks: HouseMarks;
  houseOf: (visit: Visit) => PropertyRef | null;
  jobHref: (visit: Visit) => string;
  dimmed: boolean;
}) {
  return (
    <section className={dimmed ? "opacity-40" : ""}>
      {/* No heading at all on a document that carries no day label, rather than an empty
          one: that is what every document published before the skill rendered these looks
          like, and it should read as the old flat list and not as a screen with its headings
          missing. The heading is also the way into the day, which is why the whole of it is
          the link and not a control beside it. */}
      {dayHeading(day, lang) ? (
        <Link
          href={cleaningDayPath(day.date)}
          className="mt-5 flex items-baseline gap-2 py-1 text-[15px] font-semibold text-text"
        >
          {dayHeading(day, lang)}
          {day.visits.length > 1 ? (
            <Digits className="rounded-full bg-surface-2 px-2 py-0.5 text-[12px] text-muted">
              {day.visits.length}
            </Digits>
          ) : null}
          <span aria-hidden="true" className="text-muted">
            <ChevronRight size={15} />
          </span>
        </Link>
      ) : null}
      <ul className="mt-2 divide-y divide-hairline border-y border-hairline">
        {day.visits.map((visit) => {
          const isNext = visit.date === nextDate && day.visits[0] === visit;
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
                    {visitLine(visit, lang)}
                  </p>
                  <Request note={visit.note} />
                  <VisitMeta
                    house={houseOf(visit)}
                    mark={markOf(marks, visit.property)}
                    occupied={visit.type === "midstay"}
                  />
                  {waiting.has(visitSlug(visit)) ? (
                    <Waiting lang={lang} />
                  ) : changed.has(visitIdentity(visit)) ? (
                    <Changed lang={lang} />
                  ) : null}
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
}

/**
 * Every day she has work, in order, each one holding its jobs.
 *
 * **It opens on today.** Past days are still here, because they are in the Note she is
 * holding in LINE and a screen that quietly holds fewer jobs than the Note is the second
 * schedule this app exists not to be. They are behind one tap instead of being the first
 * thing she scrolls past, which they were: a month in and the app opened on three weeks of
 * finished work.
 *
 * It is a `details` element and not a piece of state, so it costs no JavaScript, works on a
 * saved copy with no signal, and cannot get stuck open or shut. Its handle carries a count
 * of the jobs behind it and no words, for the reason everything else here carries no words.
 */
export function DayList({
  sections,
  nextDate,
  today,
  changed,
  waiting,
  role,
  lang,
  marks,
  houseOf,
  jobHref,
}: {
  sections: DaySection[];
  nextDate: string | null;
  today: string;
  changed: Set<string>;
  waiting: Set<string>;
  role: string;
  lang: TeamLang;
  marks: HouseMarks;
  houseOf: (visit: Visit) => PropertyRef | null;
  jobHref: (visit: Visit) => string;
}) {
  if (sections.length === 0) return null;

  const past = sections.filter((day) => day.date < today);
  const ahead = sections.filter((day) => day.date >= today);
  const pastJobs = past.reduce((count, day) => count + day.visits.length, 0);

  const shared = { nextDate, changed, waiting, role, lang, marks, houseOf, jobHref };

  return (
    <div className="mt-7">
      {past.length > 0 ? (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-box bg-surface py-2.5 text-muted [&::-webkit-details-marker]:hidden">
            {written(teamStrings(lang).pastJobs) ? (
              <span className="text-[14px] font-semibold">
                {written(teamStrings(lang).pastJobs)}
              </span>
            ) : null}
            <Digits className="text-[14px] font-semibold">{pastJobs}</Digits>
            <span
              aria-hidden="true"
              className="rotate-90 transition-transform duration-150 group-open:-rotate-90"
            >
              <ChevronRight size={16} />
            </span>
          </summary>
          <div className="mt-1">
            {past.map((day) => (
              <Day key={day.date} day={day} dimmed {...shared} />
            ))}
          </div>
        </details>
      ) : null}

      {ahead.map((day) => (
        <Day key={day.date} day={day} dimmed={false} {...shared} />
      ))}
    </div>
  );
}
