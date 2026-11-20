/**
 * A clean Paul has moved to another date or hour.
 *
 * Paul, 20/11/2026: he needs to move a clean to a new date and time; moving it asks him again
 * who it goes to; if the hour moved the laundry run has to accept it again, and if only the
 * cleaner changed it does not.
 *
 * **It is an override and not a schedule**, the same as src/lib/cleaning/assign.ts beside it.
 * The `cleaning-schedule` skill still decides when every clean happens, from the booking, and
 * republishes that hour on every run. This record sits over the top of it on every render for
 * as long as it stands. The two are separate keys because they are separate facts: who does a
 * clean reaches one person, when it happens reaches everybody on the job.
 *
 * **A moved clean keeps the slug it was published under.** A slug is the date, the hour and
 * the house, and it is the identity of that job everywhere: the thread, the answers, the
 * ledger row, the URL, and the one string the cleaner and the laundry run share. Rebuilding
 * it from the new hour would detach all of that and leave the next run free to recreate the
 * original clean beside the moved one. So `slug` is pinned on the visit and `date` and `time`
 * say where the work actually is.
 *
 * **The move lapses rather than lingers**, by the same test an assignment uses: the clean as
 * it reads now against the shape it read when it was moved. Two kinds of change end it. A
 * clean that gains a cot is a different clean and goes back to its published hour, and a
 * booking whose own hour changes publishes a different slug entirely, which this record no
 * longer answers to. A stale override is worse than no button: it would stand a cleaner in
 * front of a house at an hour nobody else believes in.
 *
 * **What it cannot do is say the new date in Thai.** Every Thai date in this system belongs
 * to the skill, which renders them beside the Note it posts, because the day of the week is
 * the easiest thing here to get wrong and the hardest for Paul to spot;
 * src/lib/cleaning/english.ts holds that rule. So a clean moved to another hour on the same
 * day keeps its published Thai day and prints the new hour beside it, which invents nothing.
 * A clean moved to another **day** drops the Thai day rather than carrying one that now names
 * the wrong date, and prints the hour alone. It still sorts, lands on the right day screen and
 * marks the right square on the calendar, and an English phone reads the whole new date,
 * because that half is composed from the ISO date and not from prose. The fix is the skill
 * publishing a label per date in the document's range, which is a change in
 * /Users/paulb/code/agentsiam/agentsiam-consulting and not here.
 */

import { sameClean } from "./accept";
import { visitSlug, type Visit } from "./document";
import { WHEN_KEY, get, set } from "./store";

/** One move of a clean's own date and hour. `shape` is what the clean read when it was
 * moved, so a clean that has changed since drops the move instead of holding it. */
export type WhenMove = {
  slug: string;
  /** ISO. Where the clean now is. */
  date: string;
  /** `HH.MM`, written the way the document writes an hour. */
  time: string;
  shape: string;
  at: string;
};

type Stored = [slug: string, date: string, time: string, shape: string, at: string];

/** As long as the assignment record's and refreshed on every write, for the same reason: a
 * schedule runs months ahead and an override that expired under a clean still in front of
 * her would snap it back to an hour nobody is expecting. */
const WHEN_TTL = 60 * 60 * 24 * 400;

/** An hour as the document writes one. Digits and a dot, which this app is allowed to
 * compose because it is not language. */
export const MOVED_TIME = /^([01]\d|2[0-3])\.[0-5]\d$/;

/** An ISO calendar date, which is what every date in a document is. */
export const MOVED_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * An hour typed on the admin screen, in the document's own form, or null.
 *
 * `15:30` and `15.30` and `1530` are the same hour typed three ways and all three are what a
 * person reaches for; what comes back is the one shape every published line already uses, so
 * a moved clean reads like its neighbours rather than like something this app wrote.
 */
export function cleanTime(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.trim().replace(/\D/g, "");
  if (digits.length !== 4) return null;
  const written = `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return MOVED_TIME.test(written) ? written : null;
}

function entries(value: unknown): Stored[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (one): one is Stored =>
      Array.isArray(one) && one.length === 5 && one.every((part) => typeof part === "string"),
  );
}

/** Every move of an hour that stands, by the slug of the clean it moves. */
export async function readWhenMoves(): Promise<Map<string, WhenMove>> {
  try {
    const raw = await get(WHEN_KEY);
    const stored = raw ? entries((JSON.parse(raw) as { moved?: unknown }).moved) : [];
    return new Map(
      stored.map(([slug, date, time, shape, at]) => [slug, { slug, date, time, shape, at }]),
    );
  } catch {
    // Unreadable or unreachable. Nothing is moved, which is the safe way for this to fail:
    // every clean reads at the hour the skill published it at, which is the hour the LINE
    // Note in her hand prints too.
    return new Map();
  }
}

/**
 * The later of where a clean was published and where it was moved to.
 *
 * What a row is pruned on. Pruning on the published date alone would drop a move that pushed
 * a clean forward, on the morning after the date it left, and snap it back into the past;
 * pruning on the moved date alone would do the same to one pulled earlier.
 */
function lastDay(move: WhenMove): string {
  const published = move.slug.slice(0, 10);
  return published > move.date ? published : move.date;
}

async function write(moves: Map<string, WhenMove>, today: string): Promise<void> {
  const kept = [...moves.values()]
    .filter((move) => lastDay(move) >= today)
    .map((move) => [move.slug, move.date, move.time, move.shape, move.at] as Stored);
  await set(WHEN_KEY, JSON.stringify({ moved: kept }), WHEN_TTL);
}

/** Move one clean's date and hour, or move it again. One entry per clean, so the last word
 * wins and a clean is never at two hours. */
export async function moveWhen(move: Omit<WhenMove, "at">, today: string): Promise<void> {
  const moves = await readWhenMoves();
  moves.set(move.slug, { ...move, at: new Date().toISOString() });
  await write(moves, today);
}

/** Put it back at the hour the skill published it at. */
export async function clearWhen(slug: string, today: string): Promise<void> {
  const moves = await readWhenMoves();
  moves.delete(slug);
  await write(moves, today);
}

/**
 * The visits as the screens must show them, with every move of an hour applied.
 *
 * Applied to a document the moment it is parsed, before anything else reads it, so that one
 * answer about when a clean is reaches every screen, every route and the accept record
 * together. src/lib/cleaning/assign.ts calls this and is the only caller that needs to.
 */
export function applyWhen(visits: Visit[], moves: Map<string, WhenMove>): Visit[] {
  if (moves.size === 0) return visits;
  return visits.map((visit) => {
    const slug = visitSlug(visit);
    const move = moves.get(slug);
    if (!move || !sameClean(move.shape, visit)) return visit;
    const movedDay = move.date !== visit.date;
    return {
      ...visit,
      slug,
      movedTo: `${move.date} ${move.time}`,
      date: move.date,
      time: move.time,
      // The skill's Thai for the day it used to be on would name the wrong date now.
      dayLabel: movedDay ? null : visit.dayLabel,
      // With no day label, `plainLine` falls back to the published line, and that line opens
      // with the published date in Thai. The hour on its own is the only part of it that is
      // still true, and it is the part she is reading the line for.
      line: movedDay ? move.time : visit.line,
    };
  });
}
