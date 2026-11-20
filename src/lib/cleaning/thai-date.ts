/**
 * A Thai date composed from the skill's own words.
 *
 * **This is the one place in the app that writes a Thai date, and it invents nothing.** Every
 * Thai word here was written by the `cleaning-schedule` skill and published in the document;
 * what this file adds is arithmetic, which is the half a script does not get wrong. The rule
 * in src/lib/cleaning/english.ts, that Thai dates belong to the skill, stands: this does not
 * break it, it reads the skill's vocabulary instead of making one up.
 *
 * Paul, 20/11/2026, on being asked to type the date himself every time he moves a clean to
 * another day: no. The weekday for a date is arithmetic and the words for it are house style,
 * and only the second of those had any business being his. The box he types into stays, for a
 * document published before the words existed and for anything he would rather word himself.
 *
 * **The words are checked against the skill's own output before they are used.** A document
 * carries a finished label on every visit, so composing a label for a date the document
 * already has one for, and comparing the two, says whether this file agrees with the script
 * that wrote them. One disagreement anywhere and nothing is composed at all, because a date
 * that is nearly right is the worst thing this could produce: it would read as the skill's
 * and be the app's. That check costs one pass over the visits and it is what makes writing
 * Thai here defensible rather than clever.
 *
 * The format is the script's, read from it rather than guessed:
 * `{weekday} {day} {month}`, no leading zero on the day and no year.
 */

import type { DayWords, TeamDocument, Visit } from "./document";

/** Monday is 0, as the script's own table is indexed, where a JavaScript day is Sunday 0. */
function mondayFirst(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

/**
 * One date in Thai, or null for a date that will not parse.
 *
 * UTC throughout, the same as every other date in this app: these are calendar dates and a
 * phone in another timezone must not shift one.
 */
export function thaiDate(iso: string, words: DayWords): string | null {
  const ms = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  const date = new Date(ms);
  const day = words.days[mondayFirst(date)];
  const month = words.months[date.getUTCMonth()];
  if (!day || !month) return null;
  return `${day} ${date.getUTCDate()} ${month}`;
}

/**
 * Whether this file and the script that wrote the document agree, on every label in it.
 *
 * A document with words but nothing to check them against is trusted, because the words came
 * from the skill either way and there is nothing here to be wrong about. A single visit whose
 * published label is not what this would have composed is a disagreement about format, and
 * the answer to that is to compose nothing.
 */
export function wordsAgree(visits: Visit[], words: DayWords): boolean {
  for (const visit of visits) {
    if (!visit.dayLabel) continue;
    if (thaiDate(visit.date, words) !== visit.dayLabel) return false;
  }
  return true;
}

/**
 * How this document says a date, or null where it cannot say one.
 *
 * Null covers three cases that are the same answer to the caller: a document published before
 * the skill carried its words, a document whose words this file disagrees with, and a
 * document in another language, where the labels are not Thai and composing Thai over them
 * would be worse than saying nothing.
 */
export function dayWordsOf(document: TeamDocument): ((iso: string) => string | null) | null {
  const words = document.dayWords;
  if (!words || document.lang !== "th") return null;
  if (!wordsAgree(document.visits, words)) return null;
  return (iso: string) => thaiDate(iso, words);
}
