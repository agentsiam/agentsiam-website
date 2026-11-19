import { plainLine } from "./english";
import { addDays, propertyFromSlug, visitSlug, type Visit } from "./document";
import { get, historyKey, set } from "./store";

/**
 * The cleans she has already done, kept by this app because the document stops at today.
 *
 * Paul, 19/11/2026: the cleaner has to be able to check the cleaning history for the past
 * month, because AgentSiam pays her for that work and the payslip goes into the comments on
 * the clean itself. The scenario is the one that breaks today: she cleans on the Thursday,
 * and on the Friday she opens the app to see whether she has been paid, and the Thursday is
 * gone. A published document is built from the bookings ahead, so the run that happens
 * overnight publishes a schedule that starts tomorrow.
 *
 * **It is a ledger and never a schedule.** Nothing in it is ahead of today, nothing in it
 * decides who does what, and the worst a wrong entry can do is show her a clean she did not
 * do. That is what makes it safe for the app to hold at all: the rule it must not break is
 * that this app never holds a second copy of what is **coming**, and a record of what has
 * already happened cannot disagree with the LINE Note in her hand about any of that.
 *
 * **It is written when she opens the app**, from the schedule she is being shown, by the one
 * route that already records that she has looked. So a clean reaches the ledger only if it
 * was on her screen at least once while it was still ahead of her, which is the same thing
 * as saying the app only remembers what it told her.
 *
 * Ninety days, pruned on every write. A payslip is a question about last month, not about
 * last year, and a record that grew for ever would be a row of hers that outlived the reason
 * for keeping it.
 */

const HISTORY_TTL = 60 * 60 * 24 * 400;
const HISTORY_DAYS = 90;
const HISTORY_MAX = 300;

/** One clean that has happened, with the little a screen needs to list it and open its
 * thread. No address, no codes, nobody else's phone number: a payslip is not a reason to
 * keep a house's details after the work is done. */
export type PastVisit = {
  slug: string;
  /** ISO, so the list and the calendar can sort and group it like any other clean. */
  date: string;
  /** The day as the skill rendered it, kept so a Thai heading is still the skill's. */
  label: string;
  /** The hour as the document carried it. */
  time: string;
  /** The house's name, or empty on a document that named none. */
  house: string;
};

type Stored = [slug: string, date: string, label: string, time: string, house: string];

function entries(value: unknown): Stored[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (one): one is Stored =>
      Array.isArray(one) && one.length === 5 && one.every((part) => typeof part === "string"),
  );
}

/** Everything she has done that is still worth keeping, oldest first. */
export async function pastVisits(person: string): Promise<PastVisit[]> {
  try {
    const raw = await get(historyKey(person));
    const stored = raw ? entries((JSON.parse(raw) as { done?: unknown }).done) : [];
    return stored
      .map(([slug, date, label, time, house]) => ({ slug, date, label, time, house }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    // Unreadable or unreachable. She sees the past her document still carries and nothing
    // more, which is where she was before this existed.
    return [];
  }
}

/**
 * Fold today's schedule into the ledger.
 *
 * Every clean on her screen goes in, including the ones still ahead of her, because the
 * point is to have the row **before** the run drops it. What makes that safe is that nothing
 * reads an entry until its date has passed: `before` below is what every screen calls, and
 * it answers with what is behind her and nothing else.
 */
export async function recordHistory(
  person: string,
  visits: Visit[],
  houseOf: (visit: Visit) => string,
  today: string,
): Promise<void> {
  const mine = new Set(visits.map((visit) => visitSlug(visit)));
  const known = new Map<string, Stored>();
  for (const one of await pastVisits(person)) {
    // **A clean that left her schedule before it happened was never hers to do.** It was
    // moved to somebody else, or the booking went. Keeping it would show her a clean she did
    // not do on the screen where she checks she has been paid, which is the one place that
    // reads worst. A clean already behind her stays whatever the schedule says now.
    if (one.date >= today && !mine.has(one.slug)) continue;
    known.set(one.slug, [one.slug, one.date, one.label, one.time, one.house]);
  }
  for (const visit of visits) {
    known.set(visitSlug(visit), [
      visitSlug(visit),
      visit.date,
      visit.dayLabel ?? "",
      visit.time,
      houseOf(visit),
    ]);
  }

  const floor = addDays(today, -HISTORY_DAYS);
  const kept = [...known.values()]
    .filter(([, date]) => date >= floor)
    .sort((a, b) => a[1].localeCompare(b[1]))
    .slice(-HISTORY_MAX);
  await set(historyKey(person), JSON.stringify({ done: kept }), HISTORY_TTL);
}

/** The entries behind her, which is all a screen may show. */
export function before(past: PastVisit[], today: string): PastVisit[] {
  return past.filter((one) => one.date < today);
}

/**
 * A ledger entry as a visit, so that one list, one day grouping and one calendar can hold
 * both without knowing which is which.
 *
 * What it cannot carry is anything the ledger does not keep: no type, so no sentence about
 * what kind of clean it was; no note, no people, no booking id. A past clean is a date, an
 * hour, a house and a thread.
 */
export function asVisit(past: PastVisit): Visit {
  const visit: Visit = {
    date: past.date,
    time: past.time,
    type: null,
    booking: null,
    line: "",
    // **Out of the slug, so that the slug comes back.** Every screen rebuilds a job link by
    // running `visitSlug` over the visit it is drawing, so a rebuilt clean that forgot which
    // house it was at would link to a job nothing can find. That is what it did until it was
    // opened on a phone.
    property: propertyFromSlug(past.slug),
    dayLabel: past.label || null,
    with: [],
    note: null,
  };
  // A ledger entry with no day label is one the skill published before it rendered them.
  // Digits are the last resort rather than a Thai date composed here, which is the one thing
  // this app may not do.
  const line = plainLine(visit);
  return { ...visit, line: line || `${past.date} ${past.time}`.trim() };
}
