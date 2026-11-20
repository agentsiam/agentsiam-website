import { Message } from "@/components/cleaning/blocks";
import { ChevronRight } from "@/components/cleaning/glyphs";
import { parseDocument } from "@/lib/cleaning/document";
import { peekEnrolToken } from "@/lib/cleaning/devices";
import { CLEANING_API_ENROL } from "@/lib/cleaning/routes";
import { readNote } from "@/lib/cleaning/store";
import { teamLang } from "@/lib/cleaning/lang";
import { teamStrings, written } from "@/lib/cleaning/strings";

/**
 * The link Paul sends her in LINE. The one URL in this app that answers without a cookie.
 *
 * Opening it does not enrol anything. The page reads who the link is for, greets her by the
 * name her own schedule is addressed to, and asks for her PIN; **the enrolling is done by
 * the POST behind the button**, never by this GET. That split is not tidiness: LINE fetches
 * a link to build its preview card, and a GET that enrolled would have been spent by the
 * chat app before she had seen it.
 *
 * **Her PIN is on this screen, and that is the whole of the change of 20/11/2026.** The link
 * used to be the only proof, so it died on its first open, which enrolled whichever browser
 * she tapped it in and left her other one at a PIN gate with no cookie behind it, looking as
 * though the link had not worked. The same link now opens every browser she has, and what
 * stands in front of it is the code Paul told her. She types it here instead of on the next
 * screen, so nothing was added to what she already did.
 *
 * The two answers she can act on come back to this screen as `?wrong=1` and `?unset=1`, in
 * her own words. A link that is dead sends her to the ask-Paul page instead, because there
 * is nothing for her to retype.
 *
 * A plain form rather than a fetch, so this step works on a phone with JavaScript turned
 * off or broken. It is the one step that cannot be retried from inside the app.
 */

export const dynamic = "force-dynamic";

export default async function EnrolPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ wrong?: string; unset?: string }>;
}) {
  const { token } = await params;
  const asked = await searchParams;
  // Set on this screen as readily as anywhere else: it is the first one a new cleaner
  // ever opens, and the switch is in the layout above it.
  const t = teamStrings(await teamLang());

  // What the POST sent her back with, said in her own language. A wrong code is first
  // because it is the one she can put right by typing again.
  const trouble = asked.wrong
    ? written(t.pinWrong)
    : asked.unset
      ? written(t.pinMissing)
      : "";

  let person: string | null = null;
  try {
    person = await peekEnrolToken(token);
  } catch {
    person = null;
  }

  if (!person) {
    return (
      <main>
        <Message text={t.askPaul} />
      </main>
    );
  }

  // Her name as the skill writes it, so the link greets her in the same script her Note
  // does. Absent when nothing has been published for her yet, in which case the button
  // stands on its own rather than this page inventing a greeting.
  let name: string | null = null;
  try {
    name = parseDocument(await readNote(person))?.name ?? null;
  } catch {
    name = null;
  }

  return (
    <main>
      {name ? (
        <h1 className="mt-10 text-center text-[30px] font-semibold leading-10 text-text">
          {name}
        </h1>
      ) : null}
      {written(t.enrolHelp) ? (
        <p className="mt-3 text-center text-[16px] leading-7 text-body">
          {written(t.enrolHelp)}
        </p>
      ) : null}

      {trouble ? (
        <p className="mt-5 rounded-box bg-wash-red px-4 py-3 text-center text-[16px] leading-7 text-deep-red">
          {trouble}
        </p>
      ) : null}

      <form method="POST" action={CLEANING_API_ENROL} className="mt-8">
        <input type="hidden" name="token" value={token} />
        {/* The same field as the gate on /cleaning, in the plain-form version: this screen
            has to work with no JavaScript, so there is no client state and the browser does
            the length check. Large and central for the same reason as the gate's, a gate in
            daylight with a bag in the other hand. */}
        {written(t.pinPrompt) ? (
          <label htmlFor="pin" className="block text-center text-[17px] leading-7 text-body">
            {written(t.pinPrompt)}
          </label>
        ) : null}
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          pattern="[0-9]*"
          minLength={4}
          maxLength={8}
          required
          className="mt-4 w-full rounded-box border-2 border-ink bg-bg px-4 py-5 text-center text-[32px] tracking-[0.45em] text-text"
          style={{ fontFamily: "var(--font-plex-sans), system-ui, sans-serif" }}
        />
        <button
          type="submit"
          aria-label={t.enrolOpen}
          className="mt-5 flex w-full items-center justify-center rounded-box bg-ink px-4 py-5 text-[19px] font-semibold text-bg"
        >
          {/* The one control on this screen, so it cannot go quiet with its words: an
              arrow stands in until the sentence is written, and the spoken name stays
              whatever the string says, which is never seen. */}
          {written(t.enrolOpen) || <ChevronRight size={24} />}
        </button>
      </form>
    </main>
  );
}
