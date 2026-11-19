import {
  parseDocument,
  sortVisits,
  visitSlug,
  type TeamDocument,
  type Visit,
} from "./document";
import { plainLine } from "./english";
import { ASSIGN_KEY, get, readNote, set } from "./store";

/**
 * A clean moved from the person it was published to, to somebody else.
 *
 * Paul, 18/11/2026: the cleaners are freelancers, so turning a clean down is an option they
 * have, and a clean one of them turns down has to go back to the admin for him to give to
 * another cleaner. The decline half of that shipped first and left the clean nowhere: off her
 * screens, on nobody else's, waiting in a red block on his screen. This is the other half.
 *
 * **It is an override and not a schedule.** The rule that decides who cleans what is still the
 * `cleaning-schedule` skill's, and this app still holds none: every run rebuilds from the
 * property's own file and republishes the clean to the same person. What this record does is
 * sit over the top of that, on every render, for as long as it stands. So a move survives the
 * next run, and the next ten.
 *
 * **What it cannot reach is the LINE Note.** The skill renders that from the same run, so the
 * Note Paul pastes still prints the clean under the name of the person it was published to
 * until the skill reads this record at build time. That disagreement is the price of the
 * button, it is the second one this evening after a declined clean leaving her screens, and it
 * is in README's known gaps. The app and the Note were identical by construction until today.
 *
 * **A door code is never moved with the clean.** The access block in a document carries that
 * person's own code for that house, and per-person codes exist so that a lost phone costs one
 * lock slot. So the house, its address and its map travel with a moved clean and the codes do
 * not: the new cleaner sees the code only where her own document already carries one for that
 * house. The admin screen says so before Paul moves it, because a cleaner at a gate with no
 * number is the failure this whole app was built to end.
 *
 * **The line travels differently.** A job line is finished text rendered by the skill and it
 * names the person it was published to, so carrying it unchanged to somebody else would tell
 * her the clean is Aun's. A moved clean therefore carries the day label and the time, which are
 * two other fields of the same published visit; `plainLine` in src/lib/cleaning/english.ts is
 * what builds it, and since 19/11/2026 that is what every screen prints for every clean anyway.
 */

/** One move. `line` is what the clean read when it was moved: a clean whose line has since
 * changed is a different clean, and the move lapses rather than binding somebody to work
 * nobody showed her. The same rule as the accept record, for the same reason. */
export type Assignment = {
  slug: string;
  from: string;
  to: string;
  line: string;
  at: string;
};

type Stored = [slug: string, from: string, to: string, line: string, at: string];

/** As long as the accept record's, and refreshed on every write. A published schedule runs
 * months ahead, and an override that expired under a clean still in front of her would hand
 * that clean back to the person who turned it down, silently. */
const ASSIGN_TTL = 60 * 60 * 24 * 400;

function entries(value: unknown): Stored[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (one): one is Stored =>
      Array.isArray(one) && one.length === 5 && one.every((part) => typeof part === "string"),
  );
}

/** Every move that stands, by the slug of the clean it moves. */
export async function readAssignments(): Promise<Map<string, Assignment>> {
  try {
    const raw = await get(ASSIGN_KEY);
    const stored = raw ? entries((JSON.parse(raw) as { moved?: unknown }).moved) : [];
    return new Map(
      stored.map(([slug, from, to, line, at]) => [slug, { slug, from, to, line, at }]),
    );
  } catch {
    // Unreadable or unreachable. Nothing is moved, which is the safe way for this to fail:
    // every clean reads as belonging to the person it was published to, which is what the
    // LINE Note in her hand says too.
    return new Map();
  }
}

async function write(moves: Map<string, Assignment>, today: string): Promise<void> {
  // Pruned by the date in the slug, which is where a visit's date already is. A move for a
  // clean that has happened is a row nobody will read again.
  const kept = [...moves.values()]
    .filter((move) => move.slug.slice(0, 10) >= today)
    .map((move) => [move.slug, move.from, move.to, move.line, move.at] as Stored);
  await set(ASSIGN_KEY, JSON.stringify({ moved: kept }), ASSIGN_TTL);
}

/** Give one clean to somebody else, or move it again. One entry per clean, so the last word
 * wins and a clean is never on two schedules. */
export async function moveVisit(
  move: Omit<Assignment, "at">,
  today: string,
): Promise<void> {
  const moves = await readAssignments();
  moves.set(move.slug, { ...move, at: new Date().toISOString() });
  await write(moves, today);
}

/** Give it back to the person it was published to. */
export async function clearMove(slug: string, today: string): Promise<void> {
  const moves = await readAssignments();
  moves.delete(slug);
  await write(moves, today);
}

/** Whether this move still stands against the clean as it is published now. */
function holds(move: Assignment | undefined, visit: Visit): boolean {
  return Boolean(move && move.line === visit.line);
}

/**
 * One person's schedule as her screens must show it, with every move applied.
 *
 * **Everything that reads a schedule goes through this**, her five screens and the four routes
 * that write about a visit, because a route that read the published document instead would
 * refuse the comment, the photograph or the acceptance of a clean she can see on her screen.
 * The one exception is Paul's own first screen, which reads the published documents directly:
 * it is the screen that shows him what the skill said before he moved anything.
 *
 * It reads one extra key, and one more document per person who has given her work. With
 * nothing moved it is one extra read and the published document, unchanged.
 */
export async function scheduleFor(person: string): Promise<TeamDocument | null> {
  const own = parseDocument(await readNote(person));
  const moves = await readAssignments();
  if (moves.size === 0 || !own) return own;

  const mine = own.visits.filter((visit) => {
    const move = moves.get(visitSlug(visit));
    return !holds(move, visit) || move?.to === person;
  });

  const donors = new Set(
    [...moves.values()].filter((move) => move.to === person && move.from !== person).map((m) => m.from),
  );
  const extra: Visit[] = [];
  const properties = [...own.properties];
  for (const donor of donors) {
    const document = parseDocument(await readNote(donor).catch(() => null));
    if (!document) continue;
    for (const visit of document.visits) {
      const move = moves.get(visitSlug(visit));
      if (!holds(move, visit) || move?.to !== person) continue;
      // The stored line goes too, not only what the screens draw. Every screen prints
      // `plainLine` now, so this changes nothing on one; what it changes is the line the
      // accept record writes down and the line Paul's own screens print, neither of which
      // should carry the name of the cleaner who turned it down.
      extra.push({ ...visit, line: plainLine(visit) });
      // The house, so her screen can say which gate and put the address on a map. Never the
      // access block beside it: those are her colleague's own door codes.
      const house = document.properties.find((one) => one.id === visit.property);
      if (house && !properties.some((one) => one.id === house.id)) properties.push(house);
    }
  }

  return { ...own, visits: sortVisits([...mine, ...extra]), properties };
}
