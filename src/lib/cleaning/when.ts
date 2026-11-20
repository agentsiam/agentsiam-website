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
 * **It cannot say the new date in Thai, so Paul says it.** Every Thai date in this system
 * belongs to the skill, which renders them beside the Note it posts, because the day of the
 * week is the easiest thing here to get wrong and the hardest for Paul to spot;
 * src/lib/cleaning/english.ts holds that rule, and this file does not break it. A clean moved
 * to another hour on the same day keeps its published Thai day and prints the new hour beside
 * it, which invents nothing. A clean moved to another **day** has no honest label of its own,
 * so the move carries one Paul typed, in his words, stored exactly as he wrote it. Without one
 * the Thai day is dropped rather than carrying one that names the wrong date, and the hour
 * stands alone; the clean still sorts, lands on the right day screen and marks the right
 * square on the calendar, and an English phone reads the whole new date either way, because
 * that half is composed from the ISO date.
 *
 * **Why he types it rather than this app composing it.** The weekday for a date is arithmetic
 * and the words for it are not: the month's short Thai name and the house style of the line
 * are the skill's, and a date this app assembled would read as nearly right, which is the
 * worst way for it to be wrong. The durable fix is the skill publishing a label per date in
 * the document's range rather than one per visit, which is a change in
 * /Users/paulb/code/agentsiam/agentsiam-consulting and would make the box unnecessary.
 *
 * **The label is not in what the two of them accepted.** Correcting a typo in a date's words
 * changes nothing about the work, so it does not put the clean back in front of either of
 * them; `movedTo` carries the date and the hour, which are the facts, and nothing else.
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
  /**
   * The new day in Thai, as Paul typed it, or empty where he typed nothing.
   *
   * His words and not this app's, kept exactly as written apart from the ends being trimmed.
   * It stands in for the day label the skill publishes, and it is only ever read when the
   * clean has moved to another day, because on the same day the published label is still true.
   */
  label: string;
};

/** Five parts until 20/11/2026 and six after it. A row written before the label existed is
 * read as a row with no label rather than being dropped, which matters: dropping it would put
 * a clean already moved back at an hour nobody is expecting. */
type Stored =
  | [slug: string, date: string, time: string, shape: string, at: string]
  | [slug: string, date: string, time: string, shape: string, at: string, label: string];

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
      Array.isArray(one) &&
      (one.length === 5 || one.length === 6) &&
      one.every((part) => typeof part === "string"),
  );
}

/**
 * The Thai day as Paul typed it, trimmed at the ends and capped, or "".
 *
 * **Nothing inside it is touched.** Spacing in Thai is a convention this app has no standing
 * to correct, so runs of spaces he typed are his, and the only changes are the ends and
 * anything that would break a line. The cap is a line's worth: a date, not a sentence.
 */
export function cleanDayLabel(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/[\r\n\t]+/g, " ").trim().slice(0, MAX_DAY_LABEL);
}

/** A day in words is short. `อังคาร 15 ธค` is twelve characters. */
export const MAX_DAY_LABEL = 40;

/** Every move of an hour that stands, by the slug of the clean it moves. */
export async function readWhenMoves(): Promise<Map<string, WhenMove>> {
  try {
    const raw = await get(WHEN_KEY);
    const stored = raw ? entries((JSON.parse(raw) as { moved?: unknown }).moved) : [];
    return new Map(
      stored.map(([slug, date, time, shape, at, label]) => [
        slug,
        { slug, date, time, shape, at, label: label ?? "" },
      ]),
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
    .map(
      (move) => [move.slug, move.date, move.time, move.shape, move.at, move.label] as Stored,
    );
  await set(WHEN_KEY, JSON.stringify({ moved: kept }), WHEN_TTL);
}

/** Move one clean's date and hour, or move it again. One entry per clean, so the last word
 * wins and a clean is never at two hours. */
export async function moveWhen(move: Omit<WhenMove, "at">, today: string): Promise<void> {
  const moves = await readWhenMoves();
  // Cleaned here as well as at the screen that typed it, so no caller can leave a line break
  // in a day's words and no row can hold one.
  moves.set(move.slug, {
    ...move,
    label: cleanDayLabel(move.label),
    at: new Date().toISOString(),
  });
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
    // The skill's Thai for the day it used to be on would name the wrong date now, so what
    // stands in its place is Paul's own words where he wrote any, and nothing where he did
    // not. On the same day the published label is still true and is left alone.
    const label = move.label || (movedDay ? null : visit.dayLabel);
    return {
      ...visit,
      slug,
      movedTo: `${move.date} ${move.time}`,
      date: move.date,
      time: move.time,
      dayLabel: label,
      // `plainLine` builds the line from the label and the hour, and falls back to the
      // published line when there is no label. That published line opens with the date it
      // used to be on, so for a clean that moved day the hour on its own is the only part of
      // it still true, and it is the part she is reading the line for.
      line: label ? `${label} - ${move.time}` : movedDay ? move.time : visit.line,
    };
  });
}
