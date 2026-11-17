/**
 * The published document one person's schedule is read out of, and nothing more.
 *
 * `build_note.py --publish` in the `cleaning-schedule` skill writes one of these per person
 * and `publish_note.py` puts it in the store. Every string in it is finished text, rendered
 * by the same functions that render the LINE Note Paul pastes, which is why this app can
 * show the team their schedule without holding a single scheduling rule, a roster, a Beds24
 * credential or a word of Thai.
 *
 * **Nothing in this module composes, formats, translates or joins a Thai string.** The three
 * functions here sort by an ISO date, pick which visit is next, and turn a UTC timestamp into
 * digits. If a screen needs a sentence this document does not carry, it comes from
 * src/lib/cleaning/strings.ts, where Paul writes it.
 */

/** A rendered block: the heading as the Note prints it, then its lines. */
export type DocumentBlock = {
  heading: string;
  lines: string[];
};

export type Visit = {
  /** ISO date. What this app sorts and compares on, and the only date arithmetic it does. */
  date: string;
  /** The time as the Note prints it, already inside `line`. Kept because it is structure. */
  time: string;
  type: string | null;
  /** The Beds24 booking id of the stay, where the job carried one. This is what recognises
   * the same clean across two runs, which is what makes "what changed" true rather than
   * guessed. */
  booking: string | null;
  /** The job line exactly as her LINE Note prints it. Displayed, never parsed. */
  line: string;
};

export type TeamDocument = {
  key: string;
  /** Her name in her own language, as the skill writes it. */
  name: string;
  lang: string;
  role: string;
  /** The queue title for her function, finished. */
  title: string;
  visits: Visit[];
  contact: DocumentBlock | null;
  /** Her gate and door codes, finished. Behind the PIN, never cached, never logged. */
  access: DocumentBlock | null;
  /** The change lines from the last posted schedule, plus anything typed into that run's
   * remarks, under one heading. The skill merges the two, so this app cannot tell them
   * apart and must not claim to. */
  remarks: DocumentBlock | null;
  /**
   * When the run that built this document happened, ISO.
   *
   * Optional because a document published before 17/11/2026 has none: until then
   * `documents()` in the skill put `built_at` on the file it writes and not on each
   * person's document, while `publish_note.py` stores one person's document per key, so
   * nothing read from the store carried a timestamp and the screen could not say how old a
   * schedule was. The skill carries it per person now. A document without one renders no
   * age line rather than a guessed one.
   */
  built_at?: string;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asBlock(value: unknown): DocumentBlock | null {
  if (typeof value !== "object" || value === null) return null;
  const { heading, lines } = value as { heading?: unknown; lines?: unknown };
  const text = asString(heading);
  if (!text || !Array.isArray(lines)) return null;
  const kept = lines.filter((line): line is string => typeof line === "string");
  if (kept.length === 0) return null;
  return { heading: text, lines: kept };
}

/** ISO dates only, so a sort and a comparison against today cannot be fed a word. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function asVisit(value: unknown): Visit | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const date = asString(v.date);
  const line = asString(v.line);
  if (!date || !ISO_DATE.test(date) || !line) return null;
  return {
    date,
    time: asString(v.time) ?? "",
    type: asString(v.type),
    booking: asString(v.booking),
    line,
  };
}

/**
 * One person's document out of whatever the store answered with, or null.
 *
 * Strict rather than forgiving, and in one direction: a field it cannot read is dropped, and
 * a document with no title or no readable visit is no document at all. A half-parsed
 * schedule is worse than an empty screen, because an empty screen says to ask Paul.
 */
export function parseDocument(raw: unknown): TeamDocument | null {
  if (typeof raw !== "object" || raw === null) return null;
  const d = raw as Record<string, unknown>;
  const key = asString(d.key);
  const title = asString(d.title);
  if (!key || !title) return null;
  const visits = Array.isArray(d.visits)
    ? d.visits.map(asVisit).filter((visit): visit is Visit => visit !== null)
    : [];
  return {
    key,
    name: asString(d.name) ?? key,
    lang: asString(d.lang) ?? "th",
    role: asString(d.role) ?? "",
    title,
    visits: sortVisits(visits),
    contact: asBlock(d.contact),
    access: asBlock(d.access),
    remarks: asBlock(d.remarks),
    built_at: asString(d.built_at) ?? undefined,
  };
}

/** Oldest first, which is the order her Note lists them in. Ties broken by booking id so
 * two jobs on one day render the same way on every open. */
export function sortVisits(visits: Visit[]): Visit[] {
  return [...visits].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.booking ?? "").localeCompare(b.booking ?? ""),
  );
}

/**
 * Today in Bangkok, as an ISO date.
 *
 * The property, the team and the schedule are all in one timezone, and a phone set to
 * another one must not move which clean is next. `en-CA` is asked for because it formats as
 * `YYYY-MM-DD`, which is the shape the dates in the document are already in.
 */
export function todayInBangkok(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Which visit is the next one, by index, or -1 when every visit is in the past. */
export function nextVisitIndex(visits: Visit[], today: string = todayInBangkok()): number {
  return visits.findIndex((visit) => visit.date >= today);
}

/**
 * How far ahead the grid looks: thirty days from today, today included. Paul's number,
 * 17/11/2026.
 *
 * It bounds the grid and deliberately not the list. A published document carries every job
 * on file, which now runs months out, and thirty days is the shape of a month on a screen;
 * but a list that stopped at thirty days would hold fewer jobs than the LINE Note she is
 * holding in her other hand, and a screen that quietly disagrees with the Note is the second
 * schedule this app exists not to be. So the grid answers "how busy is my month" and the
 * list stays the whole document.
 */
export const SCHEDULE_WINDOW_DAYS = 30;

/** A calendar date as a UTC instant. The dates in a document are calendar dates with no
 * time in them, so they are handled as calendar dates and never as local midnight. */
function at(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

/** An ISO date, `days` after another one. Positive, negative or zero. */
export function addDays(iso: string, days: number): string {
  return new Date(at(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Which column a date falls in on a Sunday-first grid. 0 is Sunday, 6 is Saturday. */
export function weekdayIndex(iso: string): number {
  return new Date(at(iso)).getUTCDay();
}

/** The day of the month, as a number, for a cell that prints digits and no month name. */
export function dayOfMonth(iso: string): number {
  return new Date(at(iso)).getUTCDate();
}

export type CalendarCell = {
  /** ISO, or null for a pad cell before the window opens or after it closes. */
  date: string | null;
  day: number | null;
  /** How many jobs she has that day. Printed as a marker, never as a number. */
  jobs: number;
  isToday: boolean;
  /** The one cell the hero card above the grid is about. */
  isNext: boolean;
};

/**
 * The window as a Sunday-first grid of whole weeks.
 *
 * Sunday first because that is where a Thai week starts, not Monday as ISO has it. The grid
 * holds exactly the thirty days the list holds, padded to whole weeks so the columns line
 * up under their headings, and it carries nothing but digits and counts: no month name and
 * no day name, because every Thai date in this app is the skill's to render and this is the
 * one screen that would be tempted to compose one.
 */
export function calendarWeeks(
  visits: Visit[],
  today: string = todayInBangkok(),
  days: number = SCHEDULE_WINDOW_DAYS,
): CalendarCell[][] {
  const jobsOn = new Map<string, number>();
  for (const visit of visits) jobsOn.set(visit.date, (jobsOn.get(visit.date) ?? 0) + 1);
  const next = visits.find((visit) => visit.date >= today)?.date ?? null;

  const cells: CalendarCell[] = [];
  const pad = { date: null, day: null, jobs: 0, isToday: false, isNext: false };
  for (let i = 0; i < weekdayIndex(today); i += 1) cells.push({ ...pad });
  for (let i = 0; i < days; i += 1) {
    const date = addDays(today, i);
    cells.push({
      date,
      day: dayOfMonth(date),
      jobs: jobsOn.get(date) ?? 0,
      isToday: i === 0,
      isNext: date === next,
    });
  }
  while (cells.length % 7 !== 0) cells.push({ ...pad });

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/**
 * A UTC timestamp as digits in Bangkok time, for `{when}` in Paul's "last updated" line.
 *
 * Digits and punctuation only, deliberately: a month name or a day name here would be this
 * app formatting a Thai date, which is the one thing it must never do. DD/MM/YYYY is the
 * house format for a date in prose.
 */
export function builtAtDigits(builtAt: string): string | null {
  const at = new Date(builtAt);
  if (Number.isNaN(at.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const date = `${get("day")}/${get("month")}/${get("year")}`;
  const time = `${get("hour")}.${get("minute")}`;
  if (date.includes("//") || time === ".") return null;
  return `${date} ${time}`;
}
