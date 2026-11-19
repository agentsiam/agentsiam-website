import type { DaySection, Visit } from "./document";
import type { TeamLang } from "./strings";

/**
 * What a screen prints for a job line, which is no longer the job line.
 *
 * Two instructions put this file between the published document and every screen that shows a
 * clean. Paul, 18/11/2026: work out the English text as well, because some of it is showing in
 * Thai. And 19/11/2026: the name of the cleaner should not be in brackets next to the date,
 * because the clean does not belong to her yet, and a special request belongs in the note and
 * not in the title of the clean.
 *
 * A published job line is all four of those things at once: `พุธ 18 พย - 10.00 (ดา) มีแขกพักอยู่
 * เพิ่มเตียงเด็ก`, which is the day, the hour, whose it is, that somebody is in the house and what
 * is being asked for. On a LINE Note that is right, because a Note is one block of text for a
 * person to read. On a screen it is four things in one sentence, and three of them are already
 * drawn beside it: the occupied figure, the house, and the request under its own heading.
 *
 * **So a screen prints the day and the hour and nothing else**, from two published fields, and
 * the rest of the line is drawn where it belongs. Nothing here parses a published string, which
 * is the rule that keeps a change in the skill's wording from breaking a screen.
 *
 * The English half, below, is the same idea arrived at from the other direction.
 *
 * What was showing in Thai is everything the published document carries as finished text: every
 * job line, every day heading, the headings over the blocks at the foot. The switch in
 * src/lib/cleaning/strings.ts changes the app's own sentences and could never reach those, so a
 * phone set to English was reading English prompts over a Thai schedule.
 *
 * **This is the one file in the app that composes a date, and it composes one only in
 * English.** Every Thai date in this system belongs to the `cleaning-schedule` skill, which
 * renders them beside the LINE Note it posts, because the day of the week is the easiest
 * thing here to get wrong and the hardest for Paul to spot. Nothing in this file touches
 * Thai: a phone set to Thai gets the document's own text, unchanged, exactly as it did
 * before this file existed.
 *
 * What it composes it composes out of structure and never out of prose. The ISO date, the
 * hour as the document carries it, the house id: fields the skill publishes beside the
 * finished line precisely so that a screen never has to read the line itself. **Nothing
 * here parses a published string**, which is the rule that keeps a change in the skill's
 * wording from breaking a screen.
 *
 * **What it cannot compose**, and what therefore stays Thai on an English phone:
 *
 *   the lines inside the contact block   names and roles, written by the skill
 *   the change lines at the foot         sentences about what moved and why
 *   the words beside each door code      which code is the gate and which is the door
 *   anything true of one clean           the per-clean note, the skill's own words, which is
 *                                        now printed under the clean rather than inside its line
 *
 * Those are prose, in one language, and the honest fix for them is the skill publishing a
 * document per language, which is a change in `/Users/paulb/code/agentsiam/agentsiam-consulting`
 * and not in this repository. It is in README's known gaps. The headings over the first three
 * are app furniture rather than content, so they are here; the lines under them are not.
 */

/** A calendar date as a UTC instant. The dates in a document carry no time, so they are
 * handled as calendar dates and never as local midnight. Same reasoning, and the same one
 * line, as `at` in src/lib/cleaning/document.ts. */
function at(iso: string): number | null {
  const ms = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(ms) ? null : ms;
}

/** `Wednesday 18 November`, for a heading that stands over a day. */
const DAY = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** `Wed 18 Nov`, for a line that has a time after it and a phone's width to fit in. */
const LINE = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** A day, written out, or nothing for a date that will not parse. UTC throughout: these are
 * calendar dates, and a phone in another timezone must not shift one. */
export function englishDay(date: string): string {
  const ms = at(date);
  return ms === null ? "" : DAY.format(ms);
}

/**
 * One job as an English line: the day, the date and the hour.
 *
 * Shorter than its Thai twin, which also carries her own name and, on a mid-stay, that a
 * guest is in the house. Both of those are already on the screen beside it: the schedule is
 * hers, so the name adds nothing, and the occupied figure and the sentence under "About this
 * job" say the rest. What is left is the part she is reading the line for.
 *
 * The hour is the document's own string, `10.00`, printed and never parsed.
 */
export function englishLine(visit: Visit): string {
  const day = englishDay(visit.date) ? LINE.format(at(visit.date) as number) : "";
  if (!day) return visit.time;
  return visit.time ? `${day}, ${visit.time}` : day;
}

/**
 * The day and the hour of one clean, in Thai, out of the document's own two fields.
 *
 * `พุธ 18 พย` is the skill's rendering of the date and `10.00` is the hour as it published it;
 * the dash between them is the one the skill itself puts there. No word is invented, no date is
 * formatted and nothing is parsed, which is what keeps this on the right side of the rule that
 * every Thai date in this system belongs to the skill.
 *
 * A document old enough to carry no day label keeps its published line, name and all, because
 * the alternative is a row with no date on it.
 */
export function plainLine(visit: Visit): string {
  if (!visit.dayLabel) return visit.line;
  return visit.time ? `${visit.dayLabel} - ${visit.time}` : visit.dayLabel;
}

/** What a screen prints for one clean, in the language this phone is set to. **Every screen
 * that shows a job line goes through this**, so none of them can be the one that stayed in
 * Thai, and none of them can be the one still printing somebody's name in brackets. */
export function visitLine(visit: Visit, lang: TeamLang): string {
  return lang === "en" ? englishLine(visit) : plainLine(visit);
}

/** A day's heading, in the language this phone is set to, or nothing where there is none to
 * show: a Thai document published before the skill rendered day labels still has none, and a
 * day with no heading reads as the old flat list rather than as a missing one. */
export function dayHeading(day: DaySection, lang: TeamLang): string {
  if (lang === "en") return englishDay(day.date);
  return day.label ?? "";
}

/**
 * The headings over the three blocks the document publishes finished.
 *
 * Furniture, not content: each one says what the panel under it is, and the lines inside it
 * stay the skill's in whichever language they were written. A Thai heading over a Thai block
 * is right; a Thai heading on a phone she has set to English is the thing Paul was looking at.
 */
const HEADINGS = {
  contact: "Contact numbers",
  codes: "House codes",
  changes: "Notes and changes",
} as const;

export type BlockKind = keyof typeof HEADINGS;

/** The English heading for one of those blocks, or the document's own on a Thai phone. */
export function blockHeading(kind: BlockKind, published: string, lang: TeamLang): string {
  return lang === "en" ? HEADINGS[kind] : published;
}
