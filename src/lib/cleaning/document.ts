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
   * Optional, and that is a gap rather than a choice: `documents()` in the skill puts
   * `built_at` on the file it writes and not on each person's document, and
   * `publish_note.py` stores one person's document per key. So a document read from the
   * store currently has no timestamp and the screen cannot say how old it is. The local
   * fixture, which is the whole file, does. See the README section on this app.
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
