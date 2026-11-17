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
