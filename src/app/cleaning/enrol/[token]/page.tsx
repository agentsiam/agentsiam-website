import { Message } from "@/components/cleaning/blocks";
import { ChevronRight } from "@/components/cleaning/glyphs";
import { parseDocument } from "@/lib/cleaning/document";
import { peekEnrolToken } from "@/lib/cleaning/devices";
import { CLEANING_API_ENROL } from "@/lib/cleaning/routes";
import { readNote } from "@/lib/cleaning/store";
import { TEAM_STRINGS, written } from "@/lib/cleaning/strings";

/**
 * The link Paul sends her in LINE. The one URL in this app that answers without a cookie.
 *
 * Opening it does not enrol anything. The page reads who the link is for, greets her by the
 * name her own schedule is addressed to, and shows one button; **the token is spent by the
 * POST that button makes**, never by this GET. That split is not tidiness: LINE fetches a
 * link to build its preview card, and a GET that enrolled would be spent by the chat app
 * before she had seen it.
 *
 * It is single-use for the other half of the same problem. A link forwarded to a second
 * phone, or screenshotted, or sitting in a chat backup, opens nothing once this one has
 * been used.
 *
 * A plain form rather than a fetch, so this step works on a phone with JavaScript turned
 * off or broken. It is the one step that cannot be retried from inside the app.
 */

export const dynamic = "force-dynamic";

export default async function EnrolPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let person: string | null = null;
  try {
    person = await peekEnrolToken(token);
  } catch {
    person = null;
  }

  if (!person) {
    return (
      <main>
        <Message text={TEAM_STRINGS.askPaul} />
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
      {written(TEAM_STRINGS.enrolHelp) ? (
        <p className="mt-3 text-center text-[16px] leading-7 text-body">
          {written(TEAM_STRINGS.enrolHelp)}
        </p>
      ) : null}

      <form method="POST" action={CLEANING_API_ENROL} className="mt-8">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          aria-label={TEAM_STRINGS.enrolOpen}
          className="flex w-full items-center justify-center rounded-box bg-ink px-4 py-5 text-[19px] font-semibold text-bg"
        >
          {/* The one control on this screen, so it cannot go quiet with its words: an
              arrow stands in until the sentence is written, and the spoken name stays
              whatever the string says, which is never seen. */}
          {written(TEAM_STRINGS.enrolOpen) || <ChevronRight size={24} />}
        </button>
      </form>
    </main>
  );
}
