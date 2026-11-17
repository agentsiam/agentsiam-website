import type { TeamDocument } from "./document";

/**
 * How this app tells one house from another on sight.
 *
 * Paul's question, 17/11/2026: how do you differentiate between the two properties? The
 * honest answer about what existed was "by reading the name on a grey chip, and on the
 * calendar not at all", which is not differentiation on a phone held at arm's length while
 * she is walking.
 *
 * So each house gets a **mark**: one of four shapes, drawn beside its name everywhere the
 * name fits and standing alone in the one place it does not, which is a calendar cell a
 * seventh of a phone wide. She learns which shape is which house by seeing the two together
 * on every row, every card and every code panel, and then reads the grid without them.
 *
 * **Not a colour**, and that is the design system rather than a preference: these screens
 * have white, ink, sand and two golds, and the only other pairs in the palette mean error.
 * Spending red on a house would mean a house looks like a problem. A shape costs nothing
 * from the palette and nothing from Paul, who would otherwise owe a word per house.
 *
 * **The mark follows the id, not the order the houses were published in.** A run that
 * merges two houses concatenates them in whatever order the files were passed, so an order
 * taken from the list would silently swap two houses' shapes between one publish and the
 * next, and she would learn the wrong thing. Derived from the id, a house keeps its mark for
 * as long as it keeps its id.
 */

/**
 * Which house takes which shape, by house id.
 *
 * A plain object rather than a Map because the month grid is a client component now, and
 * props cross that boundary as serialised data: an object survives the trip and needs no
 * second shape on the other side.
 */
export type HouseMarks = Record<string, number>;

/** The four shapes src/components/cleaning/glyphs.tsx draws, in index order. */
export const HOUSE_MARKS = 4;

/**
 * A small number from an id, the same one every time.
 *
 * Deliberately not a cryptographic hash and deliberately not `Math.random`: it has to agree
 * between the server that renders the page and the next render a week later, and that is the
 * whole specification.
 */
function hashOf(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 100_000_007;
  }
  return hash;
}

/**
 * Which mark belongs to each house in this document.
 *
 * Ids are taken in sorted order so that the result cannot depend on the order the publish
 * happened to merge them in, and each house takes the shape its id hashes to, or the next
 * free one when two houses hash to the same shape. With more houses than shapes the shapes
 * repeat, and the name beside the mark is what keeps that readable; four covers every house
 * this venture has on its books and a few it does not.
 */
export function houseMarks(document: TeamDocument): HouseMarks {
  const marks: HouseMarks = {};
  const taken = new Set<number>();
  const ids = document.properties.map((house) => house.id).sort((a, b) => a.localeCompare(b));

  for (const id of ids) {
    const wanted = hashOf(id) % HOUSE_MARKS;
    let mark = wanted;
    for (let step = 0; step < HOUSE_MARKS && taken.has(mark); step += 1) {
      mark = (wanted + step + 1) % HOUSE_MARKS;
    }
    marks[id] = mark;
    taken.add(mark);
  }
  return marks;
}

/**
 * The mark for one house, or null when there is nothing to tell apart.
 *
 * Null for a document naming no houses, which is what every document published before there
 * was a second one looks like, and null for a single house: a mark that is on every row
 * without exception carries no information and is one more thing on the screen.
 */
export function markOf(marks: HouseMarks, property: string | null): number | null {
  if (!property || Object.keys(marks).length < 2) return null;
  return marks[property] ?? null;
}
