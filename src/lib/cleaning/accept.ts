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
 * **Accepting is an acknowledgement and never a gate.** The clean is hers from the moment it is
 * published, it is in her schedule the whole time, and nothing here decides who does what: that
 * is the skill's, and this app still holds no scheduling rule. What this adds is a record of her
 * saying yes, and a prompt that is hard to walk past.
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

type AcceptRecord = {
  /** One entry per clean: its slug, the line it read when she accepted, and when she did. */
  taken: Array<[string, string, string]>;
};

export type AcceptState = {
  /** The slugs of cleans she has not taken on, or has taken on and which have changed since. */
  waiting: Set<string>;
  /** When she accepted each clean she has accepted, ISO, for Paul's screen rather than hers. */
  takenAt: Map<string, string>;
};

async function read(person: string): Promise<AcceptRecord> {
  try {
    const raw = await get(acceptKey(person));
    const record = raw ? (JSON.parse(raw) as AcceptRecord) : null;
    if (!record || !Array.isArray(record.taken)) return { taken: [] };
    return {
      taken: record.taken.filter(
        (one): one is [string, string, string] =>
          Array.isArray(one) && one.length === 3 && one.every((part) => typeof part === "string"),
      ),
    };
  } catch {
    // Unreachable or unreadable. Everything then reads as waiting, which is the safe way for
    // this to fail: she is asked again rather than a clean quietly counting as agreed.
    return { taken: [] };
  }
}

/** What she still has to take on, and when she took on the rest. */
export async function acceptState(person: string, visits: Visit[]): Promise<AcceptState> {
  const record = await read(person);
  const taken = new Map(record.taken.map(([slug, line, at]) => [slug, { line, at }]));
  const waiting = new Set<string>();
  const takenAt = new Map<string, string>();
  for (const visit of visits) {
    const slug = visitSlug(visit);
    const already = taken.get(slug);
    if (already && already.line === visit.line) takenAt.set(slug, already.at);
    else waiting.add(slug);
  }
  return { waiting, takenAt };
}

/**
 * Take one clean on, and prune anything that is no longer on her schedule.
 *
 * It refuses a slug that is not one of hers, so a crafted post cannot write a row about
 * somebody else's clean or grow the record with slugs nobody has. Pruning on every write is
 * what keeps it bounded: a year of cleans she accepted and that have since happened would
 * otherwise sit in the record until the TTL took them.
 */
export async function acceptVisit(
  person: string,
  visits: Visit[],
  slug: string,
): Promise<boolean> {
  const visit = visits.find((one) => visitSlug(one) === slug);
  if (!visit) return false;

  const record = await read(person);
  const live = new Set(visits.map((one) => visitSlug(one)));
  const kept = record.taken.filter(([one]) => live.has(one) && one !== slug);
  kept.push([slug, visit.line, new Date().toISOString()]);
  await set(acceptKey(person), JSON.stringify({ taken: kept } satisfies AcceptRecord), ACCEPT_TTL);
  return true;
}
