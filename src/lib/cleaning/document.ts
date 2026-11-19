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

/**
 * A house, as the published document names it.
 *
 * New with more than one property. The name and the address are Paul's, written once per
 * house and carried here finished like everything else; the map link is a URL, which has no
 * language in it at all. A document from a single-property run carries no properties, and
 * every screen then behaves exactly as it did before: no house on a card, no address, one
 * set of codes.
 */
export type PropertyRef = {
  id: string;
  name: string;
  address: string | null;
  map: string | null;
};

/**
 * A block of codes, and which house they open.
 *
 * `property` is null on a document published before there was more than one.
 *
 * **`ownCode` says whether a code of hers is in these lines**, as opposed to the gate alone,
 * which is the property's and is the same number for everybody. A cleaner on the roster before
 * her slot on the lock exists gets the gate and nothing else, and the two blocks are otherwise
 * identical: one line of finished Thai or two, which this app may not read. So the skill
 * publishes the fact as a field and the admin screen warns off it before a clean is handed to
 * somebody who cannot open the door.
 *
 * **Missing means true**, because every document published before the field existed belongs to
 * somebody who has her codes. The field arrived on 19/11/2026 with the first person who did not.
 */
export type AccessBlock = DocumentBlock & { property: string | null; ownCode: boolean };

/**
 * Someone else on the same visit, and the number to reach them.
 *
 * Published per visit by the skill, which already computed the same people for the contact
 * block at the foot of her Note. The block answers "who do I work with this week"; this
 * answers "who is on this clean", which is the question a job screen asks and the only one
 * worth answering when two houses are in the same day.
 *
 * `roleLabel` is her function as the Note labels it and `phone` is as the roster holds it.
 * Both are finished text. A phone the skill could not vouch for arrives empty, never as a
 * placeholder: a number on a screen is a number somebody dials.
 */
export type VisitPerson = {
  name: string;
  roleLabel: string | null;
  phone: string | null;
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
  /** Which house, by id. Null on a single-property document. */
  property: string | null;
  /**
   * The date on its own, as her Note prints it inside the line, rendered by the skill.
   *
   * It exists so that a screen can put a heading over the jobs that share a day without
   * this app composing a Thai date or cutting one out of a line it is told never to parse.
   * Null on a document published before the skill carried it, and a screen with no label
   * puts no heading up rather than guessing one.
   */
  dayLabel: string | null;
  /** Who else is on this one visit. Empty on a document published before the skill carried
   * it, and on a job only one person is on. */
  with: VisitPerson[];
  /**
   * Anything true of this one clean, on its own: a cot, an extra bed, something to prepare.
   *
   * The same text the skill already puts on the end of the line, published twice on
   * purpose. The line is what her LINE Note prints and it does not move; this is the half
   * a screen can give its own heading, and having it as a field is what stops a screen
   * cutting it back out of a line it is told never to parse. Null on a clean with no
   * remark, and null where the remark was scoped to the other function.
   */
  note: string | null;
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
  /** Every house she has work at, in the order the document lists them. Empty on a
   * single-property document, which is what makes every screen fall back to its old shape. */
  properties: PropertyRef[];
  contact: DocumentBlock | null;
  /**
   * Her gate and door codes, finished, one block per house.
   *
   * Always a list, even for the single house that was once a lone block, so that nothing on
   * a screen has to ask which shape it is holding. A legacy document arrives as a list of
   * one whose `property` is null.
   */
  access: AccessBlock[];
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
    property: asString(v.property),
    dayLabel: asString(v.day_label),
    with: asVisitPeople(v.with),
    note: asString(v.note),
  };
}

function asVisitPeople(value: unknown): VisitPerson[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      const name = asString(e.name);
      if (!name) return null;
      return { name, roleLabel: asString(e.role_label), phone: asString(e.phone) };
    })
    .filter((person): person is VisitPerson => person !== null);
}

function asProperty(value: unknown): PropertyRef | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const id = asString(v.id);
  const name = asString(v.name);
  if (!id || !name) return null;
  return { id, name, address: asString(v.address), map: asString(v.map) };
}

/**
 * The access blocks, out of either shape the document has had.
 *
 * A list once there is more than one house, a lone block before that. Both arrive here as a
 * list, so no screen carries a branch for which era its document came from.
 */
function asAccess(value: unknown): AccessBlock[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        const block = asBlock(entry);
        if (!block) return null;
        const fields = entry as Record<string, unknown>;
        return { ...block, property: asString(fields.property), ownCode: fields.own_code !== false };
      })
      .filter((block): block is AccessBlock => block !== null);
  }
  const single = asBlock(value);
  return single ? [{ ...single, property: null, ownCode: true }] : [];
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
    properties: Array.isArray(d.properties)
      ? d.properties.map(asProperty).filter((p): p is PropertyRef => p !== null)
      : [],
    contact: asBlock(d.contact),
    access: asAccess(d.access),
    remarks: asBlock(d.remarks),
    built_at: asString(d.built_at) ?? undefined,
  };
}

/** The house a visit is at, or null when the document names no houses, which is what a
 * single-property document looks like. */
export function propertyOf(document: TeamDocument, visit: Visit): PropertyRef | null {
  if (!visit.property) return null;
  return document.properties.find((p) => p.id === visit.property) ?? null;
}

/** The codes for one house, or the only block there is when a document names no houses. */
export function accessFor(document: TeamDocument, property: string | null): AccessBlock | null {
  if (!property) return document.access[0] ?? null;
  return document.access.find((block) => block.property === property) ?? null;
}

/**
 * A visit's own address bar name: the date, the time and the house.
 *
 * Digits and ids, never a word, because it goes in a URL. The house is in it because two
 * houses can want the same cleaner at the same hour on the same day, and a link that opened
 * the wrong one of those would send her to the wrong gate.
 */
export function visitSlug(visit: Visit): string {
  return [visit.date, visit.time.replace(/\D/g, ""), visit.property ?? "one"]
    .filter(Boolean)
    .join("-");
}

/**
 * The house out of a slug this app built, or null for the one-house form.
 *
 * The inverse of `visitSlug`, and it exists so that a clean rebuilt from a record of ours
 * carries the same slug it was stored under. Nothing published is parsed here: a slug is this
 * app's own string, in a format three lines above, and the date is three segments of it
 * because an ISO date holds two dashes.
 */
export function propertyFromSlug(slug: string): string | null {
  const parts = slug.split("-");
  if (parts.length < 5) return null;
  const property = parts.slice(4).join("-");
  return property === "one" ? null : property;
}

export function findVisit(visits: Visit[], slug: string): Visit | null {
  return visits.find((visit) => visitSlug(visit) === slug) ?? null;
}

export type DaySection = { date: string; label: string | null; visits: Visit[] };

/**
 * The visits as days, in order, which is the shape the screen reads once there is more than
 * one house: not a list of jobs but a list of days, each holding what that day asks of her.
 *
 * The heading on a day is the label the skill rendered. Where a document carries none, the
 * day still groups and simply has no heading, which is how a document from before this
 * existed keeps working.
 */
export function daySections(visits: Visit[]): DaySection[] {
  const days = new Map<string, DaySection>();
  for (const visit of visits) {
    const day = days.get(visit.date) ?? { date: visit.date, label: visit.dayLabel, visits: [] };
    day.label = day.label ?? visit.dayLabel;
    day.visits.push(visit);
    days.set(visit.date, day);
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Every visit on one day, in the order they are already in, which is time order. */
export function visitsOn(visits: Visit[], date: string): Visit[] {
  return visits.filter((visit) => visit.date === date);
}

/** That day's heading, as the skill rendered it, or null on a document that carries none. */
export function dayLabelOn(visits: Visit[], date: string): string | null {
  return visitsOn(visits, date).find((visit) => visit.dayLabel)?.dayLabel ?? null;
}

/** Whether a string off a URL is a calendar date at all. The day screen takes its date from
 * the address bar, and everything downstream of here compares dates as strings. */
export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value);
}

/**
 * The hour a visit is at, in minutes, for ordering and for nothing else.
 *
 * The time arrives as the Note prints it, `09.30`, and this is the only thing in this module
 * that looks inside it. It reads those digits and never writes one: no screen here renders a
 * time, because the time is already inside the line. A value it cannot read ranks 0, which
 * puts that job at the top of its day rather than dropping it off the screen.
 */
export function timeRank(visit: Visit): number {
  const digits = visit.time.replace(/\D/g, "");
  if (digits.length < 3 || digits.length > 4) return 0;
  const hours = Number(digits.slice(0, digits.length - 2));
  const minutes = Number(digits.slice(-2));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
}

/**
 * Oldest first, and within a day, earliest first.
 *
 * The day order is the point. One house made the booking id a harmless tie-break, because
 * two cleans in a day were the exception and the line carried the hour anyway. With two
 * houses a day holding two jobs is an ordinary Tuesday, and a list that put the 12.00 job
 * above the 10.00 one would be telling her to drive the wrong way: "what is my day, and in
 * what order" is the question the whole screen now answers. The booking id still breaks a
 * genuine tie, so two jobs at one hour render the same way on every open.
 */
export function sortVisits(visits: Visit[]): Visit[] {
  return [...visits].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      timeRank(a) - timeRank(b) ||
      (a.booking ?? "").localeCompare(b.booking ?? ""),
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
  /**
   * Which house each of that day's jobs is at, in time order, by id.
   *
   * It is what lets a cell one seventh of a phone wide say *which* houses the day holds
   * rather than only how many jobs it holds, which with two houses is the difference between
   * a grid she can plan from and a row of identical dots. Null entries are a single-property
   * document, where every job is at the same house because there is only one.
   */
  houses: (string | null)[];
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
  const housesOn = new Map<string, (string | null)[]>();
  for (const visit of visits) {
    housesOn.set(visit.date, [...(housesOn.get(visit.date) ?? []), visit.property]);
  }
  const next = visits.find((visit) => visit.date >= today)?.date ?? null;

  const cells: CalendarCell[] = [];
  // A function rather than one object spread repeatedly, so no two pad cells can end up
  // sharing a houses array.
  const pad = (): CalendarCell => ({
    date: null,
    day: null,
    jobs: 0,
    houses: [],
    isToday: false,
    isNext: false,
  });
  for (let i = 0; i < weekdayIndex(today); i += 1) cells.push(pad());
  for (let i = 0; i < days; i += 1) {
    const date = addDays(today, i);
    const houses = housesOn.get(date) ?? [];
    cells.push({
      date,
      day: dayOfMonth(date),
      jobs: houses.length,
      houses,
      isToday: i === 0,
      isNext: date === next,
    });
  }
  while (cells.length % 7 !== 0) cells.push(pad());

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** The calendar month a date falls in, as `YYYY-MM`. The key the month grid is paged by. */
export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

/** A month key, `delta` months later or earlier. */
export function addMonths(month: string, delta: number): string {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7)) - 1 + delta;
  const shifted = new Date(Date.UTC(year, index, 1));
  return shifted.toISOString().slice(0, 7);
}

/**
 * A month as digits, `MM/YYYY`.
 *
 * **The one place this app prints a month, and it prints no month name.** Every Thai date
 * here belongs to the skill that renders her Note, and a grid paged by month is exactly
 * where an app would start inventing one: there is no Note anywhere that has ever had to
 * print "December" on its own. Digits say which month without this file owning a word, and
 * they are the same digits, in the same Latin face, as the line that says how old the
 * schedule is.
 */
export function monthDigits(month: string): string {
  return `${month.slice(5, 7)}/${month.slice(0, 4)}`;
}

/** How many days that month has. */
function daysInMonth(month: string): number {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7));
  return new Date(Date.UTC(year, index, 0)).getUTCDate();
}

/**
 * One whole calendar month as a Sunday-first grid.
 *
 * It replaces a rolling thirty days from today, which Paul asked for on 17/11/2026 and then
 * asked to page by month instead: a window that starts on today and runs out mid-month
 * cannot answer "what does December look like", and that is the question a month view is
 * for. The whole month renders, including the days before today, because a month with its
 * first ten days missing is not a month.
 *
 * Everything else about a cell is as it was: digits, a marker per job with the shape of the
 * house it is at, today ringed, and the next job filled in ink.
 */
export function monthWeeks(
  visits: Visit[],
  month: string,
  today: string = todayInBangkok(),
): CalendarCell[][] {
  const housesOn = new Map<string, (string | null)[]>();
  for (const visit of visits) {
    housesOn.set(visit.date, [...(housesOn.get(visit.date) ?? []), visit.property]);
  }
  const next = visits.find((visit) => visit.date >= today)?.date ?? null;

  const first = `${month}-01`;
  const cells: CalendarCell[] = [];
  const pad = (): CalendarCell => ({
    date: null,
    day: null,
    jobs: 0,
    houses: [],
    isToday: false,
    isNext: false,
  });
  for (let i = 0; i < weekdayIndex(first); i += 1) cells.push(pad());
  for (let day = 1; day <= daysInMonth(month); day += 1) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    const houses = housesOn.get(date) ?? [];
    cells.push({
      date,
      day,
      jobs: houses.length,
      houses,
      isToday: date === today,
      isNext: date === next,
    });
  }
  while (cells.length % 7 !== 0) cells.push(pad());

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/**
 * Which months the arrows can reach: an unbroken run with this one inside it.
 *
 * **Forward, it used to reach only the months she had work in**, which meant the arrow was
 * dead on a phone with nothing booked ahead and jumped from November to April on one with a
 * job in each. Paul, 19/11/2026, testing it: she could not move from the current month to
 * the next month. A calendar that cannot be paged forward is not a calendar, and "nothing in
 * December" is an answer a freelancer deciding her month needs to be able to get, which is
 * exactly the phone that used to have no arrow at all.
 *
 * **Backward, it reached nothing at all**, and that is the other half of the same day's
 * instruction: she has to be able to look at the cleans she has already done, because that
 * is how she checks she has been paid for them.
 *
 * So: three months back, this month, the two after it, and on to the furthest month she has
 * work in, with no gaps, to a year ahead at the outside. Both floors are unconditional, so
 * the arrow is never dead in one direction and alive in the other; the run forward is what
 * makes a schedule published months out reachable one tap at a time; and the cap is so that
 * one job in 2029 does not render thirty empty grids into a page a phone has to download at
 * a gate. Three back rather than two because the ledger of cleans she has done keeps ninety
 * days, and a calendar that stopped short of it would hide rows the list still has.
 */
export const MONTHS_AHEAD_MIN = 3;
export const MONTHS_AHEAD_MAX = 12;
export const MONTHS_BACK = 3;

export function monthsShown(visits: Visit[], today: string = todayInBangkok()): string[] {
  const here = monthOf(today);
  const cap = addMonths(here, MONTHS_AHEAD_MAX - 1);

  // Three months back, always, whether or not she worked in them, for the same reason the
  // three forward are always there: an empty month is an answer, and an arrow that is alive
  // in one direction and dead in the other is a calendar she has to learn. Three because the
  // ledger of cleans done keeps ninety days, so the two windows end at the same place.
  const first = addMonths(here, -MONTHS_BACK);
  let last = addMonths(here, MONTHS_AHEAD_MIN - 1);
  for (const visit of visits) {
    if (visit.date >= today && monthOf(visit.date) > last) last = monthOf(visit.date);
  }
  if (last > cap) last = cap;

  const months: string[] = [];
  for (let month = first; month <= last; month = addMonths(month, 1)) months.push(month);
  return months;
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
