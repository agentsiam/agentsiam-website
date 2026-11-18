import { visitSlug, type Visit } from "./document";
import { acceptKey, get, set } from "./store";

/**
 * Which cleans she has taken on, and which are still waiting for her.
 *
 * Paul, 18/11/2026: a new clean, and a clean that has moved, should reach her as something to
 * accept rather than as a line that appeared. A marker already told her something had changed;
 * what it could not do was tell **him** she had seen it, and a cleaner who has not read a move
 * is a house nobody turns up to.
 *
 * **Either answer, and the record keeps both.** Paul, 18/11/2026: the cleaner has to be able to
 * reject the new schedule as well. So a clean she has answered is a clean she has answered, and
 * which way she answered is a fact Paul reads off his own screen rather than something she has
 * to put in a message. A declined clean leaves her waiting list and stays on her schedule
 * wearing the declined pill: nothing in this app can take a clean off a published document, and
 * a schedule quietly holding fewer jobs than the LINE Note in her other hand is the second
 * schedule this app exists not to be.
 *
 * **Neither answer decides who does the work.** The rule is the skill's and this app still holds
 * no scheduling rule, so a decline is her saying no and never the job moving to somebody else.
 * Reassigning it is Paul's, in the skill, and until the skill reads this record a decline he has
 * not read changes nothing at all. That is in README's known gaps.
 *
 * **Identity is the visit slug and deliberately not `visitIdentity`.** That one falls back to
 * the date when a job carries no booking id, which was safe while a person had at most one clean
 * a day and stopped being safe in November, when a second house arrived and a day could hold two.
 * Accepting the morning at one house would have accepted the afternoon at the other. The slug is
 * the date, the time and the property, which is what the job URL is built from and is unique per
 * clean.
 *
 * **The line is stored beside it**, because a slug is not the whole of what she agreed to. A cot
 * added to a clean, or a turnover that became a mid-stay, leaves the slug untouched and changes
 * what she is turning up to, so it goes back to waiting. A clean that moves changes its slug and
 * is waiting for the same reason, which is the case Paul asked about.
 */

/** Longer than the furthest clean a published schedule has carried, and refreshed on every
 * write. A record that expired while a July booking was still ahead of her would ask her to
 * accept a clean she took on months before. */
const ACCEPT_TTL = 60 * 60 * 24 * 400;

/** One entry per clean: its slug, the line it read when she answered, and when she did. */
type AcceptEntry = [string, string, string];

type AcceptRecord = {
  taken: AcceptEntry[];
  /** The same, for the cleans she said no to. A separate list rather than a flag on one list,
   * so a record written before there was a no reads as what it is: three accepted cleans and
   * nothing declined. */
  declined: AcceptEntry[];
};

/** Her answer, as the one route that writes this record receives it. */
export type AcceptAnswer = "yes" | "no";

export type AcceptState = {
  /** The slugs of cleans she has not answered, or has answered and which have changed since. */
  waiting: Set<string>;
  /** When she accepted each clean she accepted, ISO, for Paul's screen rather than hers. */
  takenAt: Map<string, string>;
  /** When she declined each clean she declined, ISO. Her screen prints a pill from this and
   * Paul's prints the time, because a decline nobody reads is a house nobody turns up to. */
  declinedAt: Map<string, string>;
};

function entries(value: unknown): AcceptEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (one): one is AcceptEntry =>
      Array.isArray(one) && one.length === 3 && one.every((part) => typeof part === "string"),
  );
}

async function read(person: string): Promise<AcceptRecord> {
  try {
    const raw = await get(acceptKey(person));
    const record = raw ? (JSON.parse(raw) as Partial<AcceptRecord>) : null;
    if (!record) return { taken: [], declined: [] };
    return { taken: entries(record.taken), declined: entries(record.declined) };
  } catch {
    // Unreachable or unreadable. Everything then reads as waiting, which is the safe way for
    // this to fail: she is asked again rather than a clean quietly counting as answered.
    return { taken: [], declined: [] };
  }
}

/** What she still has to answer, and how she answered the rest. */
export async function acceptState(person: string, visits: Visit[]): Promise<AcceptState> {
  const record = await read(person);
  // Accepted last, so a record that somehow held one slug in both lists reads as accepted
  // rather than as whichever list was walked second. A write cannot produce that, because it
  // drops the slug from both lists before it adds one.
  const answered = new Map<string, { line: string; at: string; yes: boolean }>();
  for (const [slug, line, at] of record.declined) answered.set(slug, { line, at, yes: false });
  for (const [slug, line, at] of record.taken) answered.set(slug, { line, at, yes: true });
  const waiting = new Set<string>();
  const takenAt = new Map<string, string>();
  const declinedAt = new Map<string, string>();
  for (const visit of visits) {
    const slug = visitSlug(visit);
    const already = answered.get(slug);
    // The line is compared either way. A clean she declined and which has since moved or
    // gained a cot is a clean she has not answered: asking again is the point of comparing.
    if (!already || already.line !== visit.line) waiting.add(slug);
    else if (already.yes) takenAt.set(slug, already.at);
    else declinedAt.set(slug, already.at);
  }
  return { waiting, takenAt, declinedAt };
}

/**
 * Answer one clean, either way, and prune anything that is no longer on her schedule.
 *
 * It refuses a slug that is not one of hers, so a crafted post cannot write a row about
 * somebody else's clean or grow the record with slugs nobody has. Pruning on every write is
 * what keeps it bounded: a year of cleans she answered and that have since happened would
 * otherwise sit in the record until the TTL took them.
 *
 * One answer per clean. The slug is dropped from both lists before the new entry is written,
 * so a clean she declined and then accepted is accepted and not both, and the pair of buttons
 * on her screen can be tapped in either order or twice with the same result.
 */
export async function answerVisit(
  person: string,
  visits: Visit[],
  slug: string,
  answer: AcceptAnswer,
): Promise<boolean> {
  const visit = visits.find((one) => visitSlug(one) === slug);
  if (!visit) return false;

  const record = await read(person);
  const live = new Set(visits.map((one) => visitSlug(one)));
  const keep = (list: AcceptEntry[]) =>
    list.filter(([one]) => live.has(one) && one !== slug);
  const taken = keep(record.taken);
  const declined = keep(record.declined);
  (answer === "yes" ? taken : declined).push([slug, visit.line, new Date().toISOString()]);
  await set(
    acceptKey(person),
    JSON.stringify({ taken, declined } satisfies AcceptRecord),
    ACCEPT_TTL,
  );
  return true;
}
