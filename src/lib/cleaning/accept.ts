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
 * to put in a message.
 *
 * **A clean she turned down leaves her screens entirely**, which is Paul's instruction of the
 * same evening and reverses what shipped a few hours earlier. It shipped staying, marked, on the
 * argument that nothing here can take a clean off a published document and a schedule holding
 * fewer jobs than the LINE Note in her other hand is a second schedule. He watched Aun turn
 * three down and still see all three, and said plainly that a clean she has rejected is not her
 * schedule. `hidingDeclined` below is that rule, and it is applied to every screen of hers at
 * once rather than screen by screen.
 *
 * **The record is what keeps it gone**, so it is never pruned while the clean is still published:
 * the document still carries that clean on every run until somebody changes the run, and this
 * record is the only thing that knows she said no. A clean whose line then changes is a different
 * clean and comes back as a question, which is the same rule as for one she accepted.
 *
 * **Neither answer decides who does the work.** The rule is the skill's and this app still holds
 * no scheduling rule, so a decline is her saying no and never the job moving to somebody else.
 * It is now invisible to her and visible only to Paul, on `/admin/cleaning`, which is where it
 * waits until he reassigns it in the skill and re-runs. That makes his screen the only place a
 * declined clean exists, and it is why it is at the top of it rather than inside a person's page.
 *
 * **Identity is the visit slug and deliberately not `visitIdentity`.** That one falls back to
 * the date when a job carries no booking id, which was safe while a person had at most one clean
 * a day and stopped being safe in November, when a second house arrived and a day could hold two.
 * Accepting the morning at one house would have accepted the afternoon at the other. The slug is
 * the date, the time and the property, which is what the job URL is built from and is unique per
 * clean.
 *
 * **The shape of the clean is stored beside it**, because a slug is not the whole of what she
 * agreed to. A cot added to a clean, or a turnover that became a mid-stay, leaves the slug
 * untouched and changes what she is turning up to, so it goes back to waiting. A clean that
 * moves changes its slug and is waiting for the same reason, which is the case Paul asked
 * about. What is deliberately **not** in it is who else is on the clean: `agreedShape` below
 * says why.
 */

/** Longer than the furthest clean a published schedule has carried, and refreshed on every
 * write. A record that expired while a July booking was still ahead of her would ask her to
 * accept a clean she took on months before. */
const ACCEPT_TTL = 60 * 60 * 24 * 400;

/** One entry per clean: its slug, the shape of the clean she answered about, and when she
 * answered. */
type AcceptEntry = [string, string, string];

/**
 * The clean as she agreed to it, in the one string that decides whether she is asked again.
 *
 * **It is deliberately not the job line.** It was the line until 19/11/2026, and the line
 * carries who else is on the clean: `พฤหัส 19 พย - 12.00 (Ting) กับ ดา`. Paul, that day: when
 * the cleaning moves between Da and Aun it does not move Ting, and a clean Ting has already
 * accepted stands until she cancels it. Comparing the line meant the laundry run was put back
 * in front of her for an answer every time the cleaner beside her changed, which is both
 * noise and, read at a gate, a different clean.
 *
 * So the question "is this still the clean she said yes to" is answered by the slug, which is
 * the date, the hour and the house, plus these two fields: what kind of clean it is, and
 * anything asked for on it. A cot added to a clean asks her again. A colleague swapped does
 * not. Nothing here parses a published string.
 *
 * The separator is a character no published line can hold, which is what lets a record
 * written before this change be told apart from one written after it and compared the old
 * way. Nothing has to be migrated and nobody is asked again for a change of format.
 */
const SHAPE = "\u0001";

export function agreedShape(visit: Visit): string {
  const published = `${visit.type ?? ""}${SHAPE}${visit.note ?? ""}`;
  // **A clean Paul has moved to another hour is a different clean to answer.** Paul,
  // 20/11/2026: if the time moves, the laundry run has to accept it again; if only the
  // cleaner changes, it does not. The hour is not in the shape above, because it was in the
  // slug, and a moved clean keeps its published slug. So the hour it moved to goes here, and
  // only when there is one: every clean nobody has moved keeps the shape it already had, so
  // nobody is asked again for a change of format.
  return visit.movedTo ? `${published}${SHAPE}${visit.movedTo}` : published;
}

/** Whether what she answered about is what is published now, either way the record was
 * written. */
export function sameClean(stored: string, visit: Visit): boolean {
  return stored.includes(SHAPE) ? stored === agreedShape(visit) : stored === visit.line;
}

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

/**
 * Her visits as her own screens may show them: everything except what she turned down.
 *
 * **One filter, applied once per screen**, rather than a condition on every row, a count, a
 * calendar cell and a day heading. A declined clean has to be gone from the list, the next-visit
 * card, the month grid's counts, the day behind a tapped date and the job screen behind a kept
 * link, and the way to get that wrong is to remember five places.
 *
 * It is never applied to what is written back. `answerVisit` prunes the record against the
 * visits it is handed, so handing it a filtered list would drop the very entry that is doing the
 * hiding and the clean would reappear as a question. The route passes the whole document.
 */
export function hidingDeclined(visits: Visit[], state: AcceptState): Visit[] {
  return visits.filter((visit) => !state.declinedAt.has(visitSlug(visit)));
}

/** What she still has to answer, and how she answered the rest. */
export async function acceptState(person: string, visits: Visit[]): Promise<AcceptState> {
  const record = await read(person);
  // Accepted last, so a record that somehow held one slug in both lists reads as accepted
  // rather than as whichever list was walked second. A write cannot produce that, because it
  // drops the slug from both lists before it adds one.
  const answered = new Map<string, { shape: string; at: string; yes: boolean }>();
  for (const [slug, shape, at] of record.declined) answered.set(slug, { shape, at, yes: false });
  for (const [slug, shape, at] of record.taken) answered.set(slug, { shape, at, yes: true });
  const waiting = new Set<string>();
  const takenAt = new Map<string, string>();
  const declinedAt = new Map<string, string>();
  for (const visit of visits) {
    const slug = visitSlug(visit);
    const already = answered.get(slug);
    // The shape is compared either way. A clean she declined and which has since gained a cot
    // is a clean she has not answered: asking again is the point of comparing. A clean that
    // moved in time has a different slug and arrives here as a new clean.
    if (!already || !sameClean(already.shape, visit)) waiting.add(slug);
    else if (already.yes) takenAt.set(slug, already.at);
    else declinedAt.set(slug, already.at);
  }
  return { waiting, takenAt, declinedAt };
}

/**
 * Forget how she answered one clean, so that it reaches her again as new work.
 *
 * Paul, 19/11/2026: when a clean is turned down, the admin should be able to give it back to
 * the person who turned it down, because it does not have to go to somebody else. She said no
 * on a Tuesday and they spoke on the Wednesday, and the answer to that is not a second cleaner,
 * it is the same cleaner being asked again.
 *
 * It is Paul's to do and never hers. A cleaner who could clear her own no would be a cleaner
 * being asked the same question until she said yes.
 */
export async function clearAnswer(
  person: string,
  visits: Visit[],
  slug: string,
): Promise<void> {
  const record = await read(person);
  const live = new Set(visits.map((one) => visitSlug(one)));
  const keep = (list: AcceptEntry[]) => list.filter(([one]) => live.has(one) && one !== slug);
  await set(
    acceptKey(person),
    JSON.stringify({ taken: keep(record.taken), declined: keep(record.declined) } satisfies AcceptRecord),
    ACCEPT_TTL,
  );
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
  (answer === "yes" ? taken : declined).push([slug, agreedShape(visit), new Date().toISOString()]);
  await set(
    acceptKey(person),
    JSON.stringify({ taken, declined } satisfies AcceptRecord),
    ACCEPT_TTL,
  );
  return true;
}
