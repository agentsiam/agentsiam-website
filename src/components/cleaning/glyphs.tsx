/**
 * The two shapes this app draws, to the icon spec in the design system's guardrails.
 *
 * Stroke only, `fill="none"`, `currentColor`, width 1.8, round caps and joins, a 24 viewBox
 * rendered at 18 to 19px, and always `aria-hidden` beside a label that says the same thing.
 * Drawn inline rather than pulled from a library: two shapes do not justify a dependency,
 * and a library arrives with a house style that is not this one.
 *
 * Literal, never metaphorical, which is the other half of that spec. A padlock means the
 * thing behind it is locked. A chevron means the way back. Neither needs explaining, which
 * is the test.
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
