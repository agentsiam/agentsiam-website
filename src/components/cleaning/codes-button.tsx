import Link from "next/link";
import { Padlock } from "@/components/cleaning/glyphs";
import { CLEANING_CODES } from "@/lib/cleaning/routes";

/**
 * The codes, one tap from wherever she is.
 *
 * The research is specific about when the code screen gets used, and it is not while she is
 * reading a job: it is when she is **not** on one. Standing at a gate she came to directly,
 * or checking before she leaves home. Until now the only ways in were the button inside the
 * next job's card and the link on a job screen, so both routes went through a particular
 * job, and a woman at a gate who had scrolled down her month had to find her way back up.
 *
 * So it sits in the same place on every screen behind the PIN, bottom right, where a thumb
 * is on a phone held in one hand with a bag in the other. It opens the whole list rather
 * than one house, which is the other half of the difference: the card's button points at the
 * house she is going to next, and this one asks "show me all of them".
 *
 * **Its name is the document's own.** No visible label, because the padlock already means
 * the codes on these screens, it is on the PIN gate and inside the card that opens them, and
 * the one word that would go here is the word the card beside it already carries. The name a
 * screen reader announces is the access block's own heading, which the skill rendered in her
 * language, so this control is named without Paul owing a string for it.
 */
export function CodesButton({ label }: { label: string | null }) {
  return (
    <Link
      href={CLEANING_CODES}
      aria-label={label ?? undefined}
      // The elevation the site uses for anything that floats over content, rather than a
      // heavier one from the framework: a raised control here is a 1px to 2px shadow.
      style={{ boxShadow: "0 2px 8px rgb(0 0 0 / 0.22)" }}
      className="fixed bottom-5 right-5 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-gold-on-ink transition-transform duration-150 active:scale-95"
    >
      <Padlock size={24} />
    </Link>
  );
}
