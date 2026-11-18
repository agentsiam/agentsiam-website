import type { DaySection, Visit } from "./document";
import type { TeamLang } from "./strings";

/**
 * The English this app has to compose, because the document it reads is written in one
 * language and that language is Thai.
 *
 * Paul, 18/11/2026: work out the English text as well, because some of it is showing in
 * Thai. What was showing in Thai is everything the published document carries as finished
 * text: every job line, every day heading, the headings over the blocks at the foot. The
 * switch in src/lib/cleaning/strings.ts changes the app's own sentences and could never
 * reach those, so a phone set to English was reading English prompts over a Thai schedule.
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
 *   anything true of one clean           the per-clean note, the skill's own words
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

/** A job line in the language this phone is set to: the document's own, or the composed
 * English one. **Every screen that prints a job line goes through this**, so none of them can
 * be the screen that stayed in Thai. */
export function visitLine(visit: Visit, lang: TeamLang): string {
  return lang === "en" ? englishLine(visit) : visit.line;
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
