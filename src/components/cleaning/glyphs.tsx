/**
 * Every shape this app draws, to the icon spec in the design system's guardrails.
 *
 * Stroke only, `fill="none"`, `currentColor`, width 1.8, round caps and joins, a 24 viewBox
 * rendered at 18 to 19px, and always `aria-hidden` beside a label that says the same thing.
 * Drawn inline rather than pulled from a library: two shapes do not justify a dependency,
 * and a library arrives with a house style that is not this one.
 *
 * Literal, never metaphorical, which is the other half of that spec. A padlock means the
 * thing behind it is locked. A chevron means the way back. A figure means somebody is in the
 * house. Nobody needs any of them explained, which is the test.
 *
 * The house marks below are the one exception and they are not a breach of it: a square does
 * not mean a house, it only means *this* house rather than that one, and it is drawn beside
 * the house's own name everywhere the name fits. src/lib/cleaning/houses.ts carries the
 * reasoning and decides which house gets which.
 */

/** The lock on the codes, and on the PIN that opens the app. */
export function Padlock({ size = 19 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="10.5" width="16" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/**
 * What kind of job this is, as a shape rather than a word.
 *
 * Taken from how the field already does it: the busiest screen in a cleaner's app carries
 * its meaning in icons, a spray bottle for a clean and a washing machine for linen, which
 * is how Turno labels every row of a cleaner's schedule. Worth more here than there,
 * because a word on these screens costs Paul a string and a decision and a shape costs
 * neither.
 *
 * Decorative, always beside the line that says the same thing in her own language.
 */
export function JobType({ role, size = 19 }: { role: string; size?: number }) {
  const common = {
    "aria-hidden": true as const,
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (role === "laundry") {
    // A washing machine: the drum is the laundry round, which is Ting's whole job.
    return (
      <svg {...common}>
        <rect x="4" y="3.5" width="16" height="17" rx="2" />
        <circle cx="12" cy="13.5" r="4" />
        <path d="M7 7h2" />
      </svg>
    );
  }
  // A spray bottle: body, neck, trigger, and three strokes of spray. Drawn large enough in
  // its own box to survive being rendered at 19px, which the first attempt did not.
  return (
    <svg {...common}>
      <rect x="10" y="9" width="8" height="12" rx="2" />
      <path d="M12.5 9V6h3M12.5 6h-2.5" />
      <path d="M6 4.5h1.5M4 7h1.5M6 9.5h1.5" />
    </svg>
  );
}

/** A place. Beside an address, never instead of one. */
export function Pin({ size = 19 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

/** There is more behind this row. */
export function ChevronRight({ size = 19 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

/** The way back to her schedule. Paired with the schedule's own title, never standing
 * alone: the label is what gives the control its name, and this app has no word for
 * "back" that Paul has written. */
export function ChevronLeft({ size = 19 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

/**
 * Which house, as a shape.
 *
 * Four of them, picked for being told apart at the size a calendar cell allows rather than
 * for meaning anything: a square, a circle, a triangle and a diamond. Which house gets which
 * is src/lib/cleaning/houses.ts and is derived from the house's id, so a house keeps its
 * shape across publishes.
 *
 * `filled` is not decoration. At 7px a stroke-only triangle is a smudge, so the calendar
 * takes the filled ones and every larger use takes the outlined ones, which sit beside Thai
 * text without shouting over it.
 */
export function HouseMark({
  index,
  size = 14,
  filled = false,
}: {
  index: number;
  size?: number;
  filled?: boolean;
}) {
  const paint = filled
    ? { fill: "currentColor", stroke: "none" }
    : { fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  const common = {
    "aria-hidden": true as const,
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...paint,
  };
  // The modulo is the contract with houseMarks, which hands out 0 to 3: it is here so that a
  // document carrying more houses than there are shapes draws a shape rather than nothing.
  switch (index % 4) {
    case 1:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7.5" />
        </svg>
      );
    case 2:
      return (
        <svg {...common}>
          <path d="M12 4.5 20 19.5H4z" />
        </svg>
      );
    case 3:
      return (
        <svg {...common}>
          <path d="M12 3.8 20.2 12 12 20.2 3.8 12z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" />
        </svg>
      );
  }
}

/**
 * Somebody is in the house.
 *
 * A mid-stay clean, which the published document says in its `type` and which her own line
 * has always said in words. It was the one piece of structure in the document that no screen
 * read, and it is the piece that changes how she arrives: a guest's things are in the rooms
 * and somebody may open the door. A figure, because that is literally what it means.
 */
export function Occupied({ size = 19 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3.3" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

/** A number that can be dialled. Beside the number, never instead of it. */
export function Phone({ size = 19 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 3.5h-3A1.5 1.5 0 0 0 4 5.2C4.6 13 11 19.4 18.8 20a1.5 1.5 0 0 0 1.7-1.5v-3l-4-1.4-1.6 2a12.5 12.5 0 0 1-4.9-4.9l2-1.6z" />
    </svg>
  );
}
