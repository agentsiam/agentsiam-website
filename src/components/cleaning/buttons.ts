/**
 * The cleaning app's buttons and fields, written once.
 *
 * Paul, 21/11/2026: the buttons should be modern and the app should feel clean and sleek.
 * Until then every screen spelled its own button out of the same few classes, and they had
 * drifted: one primary action was a 12px box and the rest were pills, one dimmed when it was
 * busy and one did not, none of them answered a tap, and the accept screen painted the whole
 * card in the structural blue. So the shapes live here and the screens name them.
 *
 * They follow the design guardrails in the document store,
 * as-context/06-design-system/design-guardrails.md, sections 4 and 5:
 *
 * - **The primary action is a solid ink pill** that turns `primary` blue under the finger
 *   or the pointer, a colour change over 0.15s and nothing more elaborate. Its text keeps the
 *   gold this app has always set on ink.
 * - **The other action is lower weight**: an outline on the same pill, so the pair reads as
 *   one decision with one recommended answer.
 * - **On an ink panel the pair inverts** to the gold that stays legible on ink, because an
 *   ink button on an ink card is no button at all.
 * - **Fields are 8px**, the radius the guardrails give a form field, with the focus drawn in
 *   the structural blue.
 *
 * `enabled:` keeps a disabled button from answering a tap, and Tailwind applies `hover:` only
 * where a pointer can hover, so a phone never shows a hover stuck on after a tap.
 */

const pill =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold select-none " +
  "transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:cursor-not-allowed";

/** The one thing the screen is for: accept, open, send. On a white ground. */
export const primaryButton =
  `${pill} bg-ink text-gold-on-ink enabled:hover:bg-primary enabled:hover:text-bg ` +
  "enabled:active:bg-primary enabled:active:text-bg focus-visible:outline-primary " +
  "disabled:bg-surface-2 disabled:text-muted";

/** The other answer, beside the primary one. On a white ground. */
export const secondaryButton =
  `${pill} border border-border bg-bg text-text enabled:hover:border-ink ` +
  "enabled:active:bg-surface focus-visible:outline-primary disabled:text-muted";

/** The primary action inside an ink panel. */
export const primaryOnInk =
  `${pill} bg-gold-on-ink text-ink enabled:hover:bg-bg enabled:active:bg-bg ` +
  "focus-visible:outline-gold-on-ink disabled:opacity-40";

/** The other answer inside an ink panel. */
export const secondaryOnInk =
  `${pill} border border-bg/30 text-bg enabled:hover:bg-bg/10 enabled:active:bg-bg/10 ` +
  "focus-visible:outline-gold-on-ink disabled:opacity-40";

/** A round control holding a glyph and no word, such as the camera. */
export const iconButton =
  "flex shrink-0 items-center justify-center rounded-full border border-border bg-bg text-body " +
  "transition-colors duration-150 ease-out enabled:hover:border-ink enabled:hover:text-text " +
  "enabled:active:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-primary";

/** A text field or a text area. */
export const field =
  "w-full rounded-lg border border-border bg-surface text-text placeholder:text-muted " +
  "transition-colors duration-150 ease-out focus:border-ink focus:bg-bg focus:outline-none " +
  "focus:ring-4 focus:ring-primary/10";
