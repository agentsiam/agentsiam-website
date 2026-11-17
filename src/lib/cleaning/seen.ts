/**
 * What is new or has moved since she last looked.
 *
 * The one thing this app does that the LINE Note cannot. A Note can only say what changed
 * since the last time a schedule was **posted**, which is why a re-run before Paul posts
 * loses the lines. This knows when each person last opened the app, so it can answer the
 * other question: what changed since **she** last looked.
 *
 * Those two answers are different on a week she did not open the app, and both are true.
 * They are kept visually apart on the screen for that reason, and the marker's wording says
 * which one it is: a cleaner reading one as a correction of the other is how a date gets
 * doubted.
 *
 * Matching is by booking id where the job carries one, which is the only way to **know** two
 * records are the same clean rather than guess it. Without one the ISO date stands in, so a
 * clean that moved reads as one visit gone and another arrived, which is two true statements
 * rather than one invented one.
 *
 * Nothing here is Thai. It returns a set of visit identities to mark, and the marker's
 * wording lives in src/lib/cleaning/strings.ts, where Paul writes it.
 */

import type { Visit } from "./document";
import { get, seenKey, set } from "./store";

/** Ninety days. Long enough that a quiet month does not reset her markers, short enough
 * that an abandoned app stops holding her job lines. */
const SEEN_TTL = 60 * 60 * 24 * 90;

type SeenRecord = {
  /** ISO, when she last opened her schedule. */
  at: string;
  /** What she was shown: the identity of each visit and the line as it read then. */
  visits: Array<[string, string]>;
};

/** The identity of a visit across two runs. The booking id when there is one, the date
 * when there is not. */
export function visitIdentity(visit: Visit): string {
  return visit.booking ? `b:${visit.booking}` : `d:${visit.date}`;
}

export type SeenState = {
  /** Identities to mark. Empty on a first open, deliberately: marking every visit on the
   * screen she has never seen says nothing. */
  changed: Set<string>;
  /** ISO, when she last opened it, or null on a first open. */
  lastOpened: string | null;
};

/**
 * A short fingerprint of exactly what a screen rendered.
 *
 * The page sends it with the acknowledgement that she has looked, and the route recomputes
 * it from the store before writing anything. If the schedule was republished in between,
 * the two differ and nothing is recorded, so lines she never saw are not marked as seen.
 * Nothing the client sends is ever written into her record: it either matches what the
 * store holds or it is ignored.
 */
export async function visitsDigest(visits: Visit[]): Promise<string> {
  const material = visits.map((visit) => `${visitIdentity(visit)}\u0000${visit.line}`).join("\u0001");
  const hashed = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(material));
  return [...new Uint8Array(hashed)]
    .slice(0, 12)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function sinceLastSeen(person: string, visits: Visit[]): Promise<SeenState> {
  let record: SeenRecord | null = null;
  try {
    const raw = await get(seenKey(person));
    record = raw ? (JSON.parse(raw) as SeenRecord) : null;
  } catch {
    record = null;
  }
  if (!record || !Array.isArray(record.visits)) {
    return { changed: new Set(), lastOpened: null };
  }

  const before = new Map(record.visits);
  const changed = new Set<string>();
  for (const visit of visits) {
    const identity = visitIdentity(visit);
    const previous = before.get(identity);
    // Absent is new. Present with different text is moved, re-timed, newly occupied, or
    // carrying a per-clean note it did not carry before. All of those are things she has
    // not read yet, which is what the marker means.
    if (previous === undefined || previous !== visit.line) changed.add(identity);
  }
  return { changed, lastOpened: record.at ?? null };
}

/**
 * Record what she was just shown.
 *
 * Written from the client once the screen has rendered, rather than during the render, so
 * that a page which was prepared and never seen does not count as having been looked at,
 * and so that a phone with no signal keeps its markers until the next time it has one.
 */
export async function recordSeen(person: string, visits: Visit[]): Promise<void> {
  const record: SeenRecord = {
    at: new Date().toISOString(),
    visits: visits.map((visit) => [visitIdentity(visit), visit.line]),
  };
  await set(seenKey(person), JSON.stringify(record), SEEN_TTL);
}
