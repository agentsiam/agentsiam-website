"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Cross, Tick } from "@/components/cleaning/glyphs";
import { CLEANING_API_ACCEPT } from "@/lib/cleaning/routes";
import { teamStrings, written, type TeamLang } from "@/lib/cleaning/strings";

/**
 * Her answer to one clean: take it, or say she cannot.
 *
 * Paul, 18/11/2026: a new clean, and a clean that has moved, should arrive as something she
 * accepts, and she has to be able to reject it as well. This is the pair of buttons that
 * answers one clean, and it is the only thing in this app that writes a decision rather than
 * a message.
 *
 * **One clean per pair, never one pair over a list.** She is agreeing to turn up at a
 * particular house on a particular day, and a single pair of buttons under three cleans is an
 * agreement to whatever happened to be in the list.
 *
 * **It never hides the job.** A clean she has declined stays on her schedule wearing the
 * declined pill, because nothing in this app can take a clean off a published document and a
 * schedule she cannot trust is worse than one that tells her something she would rather not
 * read. A decline is her answer, not a reassignment: who does the work is the skill's and
 * Paul's, and README's known gaps carry what the skill cannot yet do about one.
 *
 * Both grounds this sits on are dark, the blue panels on the new-work screen and the ink card
 * on a job, so the pair is drawn once: a white pill for yes, an outlined one for no, a tick
 * and a cross so a thumb has something besides a word to aim at.
 *
 * A failed tap says so and changes nothing. Offline that is the ordinary case: the clean is on
 * her schedule either way, so what she loses is the answer and never the work.
 */
export function AcceptChoice({ slug, lang }: { slug: string; lang: TeamLang }) {
  const router = useRouter();
  const t = teamStrings(lang);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<"yes" | "no" | null>(null);

  async function answer(which: "yes" | "no") {
    if (busy) return;
    setBusy(true);
    setFailed(null);
    try {
      const response = await fetch(CLEANING_API_ACCEPT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, answer: which }),
      });
      // The screen she is on, the marks down her list and these two buttons are all rendered
      // on the server from one record, so a refresh moves the whole screen on rather than a
      // control here hiding itself. On the new-work screen the last answer takes her to her
      // schedule, because the screen stops existing once nothing is waiting.
      if (response.ok) router.refresh();
      else setFailed(which);
    } catch {
      setFailed(which);
    }
    setBusy(false);
  }

  const yes = written(t.acceptButton);
  const no = written(t.rejectButton);
  const trouble = failed === "no" ? written(t.rejectFailed) : written(t.acceptFailed);

  return (
    <>
      <div className="mt-4 flex items-stretch gap-3">
        <button
          type="button"
          onClick={() => answer("yes")}
          disabled={busy}
          aria-label={t.acceptButton}
          className="flex flex-[3] items-center justify-center gap-2 rounded-full bg-bg px-4 py-3.5 text-[16px] font-semibold text-primary disabled:opacity-40"
        >
          <Tick size={18} />
          {yes}
        </button>
        <button
          type="button"
          onClick={() => answer("no")}
          disabled={busy}
          aria-label={t.rejectButton}
          className="flex flex-[2] items-center justify-center gap-2 rounded-full border border-bg/50 px-4 py-3.5 text-[16px] font-semibold text-bg disabled:opacity-40"
        >
          <Cross size={18} />
          {no}
        </button>
      </div>
      {failed && trouble ? <p className="mt-2 text-[15px] text-wash-red">{trouble}</p> : null}
    </>
  );
}
