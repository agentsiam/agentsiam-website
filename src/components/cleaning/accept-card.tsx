"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HouseMark } from "@/components/cleaning/glyphs";
import { CLEANING_API_ACCEPT } from "@/lib/cleaning/routes";
import { teamStrings, written, type TeamLang } from "@/lib/cleaning/strings";

/** One clean waiting to be taken on, flattened by the page so no document type crosses the
 * boundary into the browser. */
export type WaitingVisit = {
  slug: string;
  line: string;
  house: string | null;
  mark: number | null;
};

/**
 * The cleans waiting for her answer, at the top of the first screen she opens.
 *
 * Paul, 18/11/2026: a new clean, and a clean that has moved, should arrive as something she
 * accepts rather than as a line that quietly appeared. This is that arrival.
 *
 * **It never hides the job.** Everything in this card is also in her schedule below it,
 * marked as waiting, which was the one part of his design I argued with and he took: a
 * schedule that shows some of her cleans is a schedule she cannot trust, and the day she taps
 * past this card is the day the house gets nobody. The card is the prompt, not the gate.
 *
 * One button per clean rather than one for all of them. She is agreeing to turn up at a
 * particular house on a particular day, and a single button over a list of three is an
 * agreement to whatever happened to be in the list.
 *
 * A failed tap says so and changes nothing. Offline that is the ordinary case: the clean
 * stays in her schedule either way, so what she loses is the acknowledgement and never the
 * work.
 */
/**
 * The tap itself, on its own, because two screens need it and only one of them needs a card
 * around it. The job screen already has the line at the top, so a card there would print the
 * clean twice.
 */
export function AcceptButton({
  slug,
  lang,
  onInk = false,
}: {
  slug: string;
  lang: TeamLang;
  onInk?: boolean;
}) {
  const router = useRouter();
  const t = teamStrings(lang);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function take() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch(CLEANING_API_ACCEPT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      // The card, the marks down the list and this button are all server-rendered from one
      // record, so a refresh moves the whole screen on rather than this control hiding itself.
      if (response.ok) router.refresh();
      else setFailed(true);
    } catch {
      setFailed(true);
    }
    setBusy(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={take}
        disabled={busy}
        aria-label={t.acceptButton}
        className={`mt-3 w-full rounded-full px-4 py-3 text-[16px] font-semibold disabled:opacity-40 ${
          onInk ? "bg-gold-on-ink text-ink" : "bg-ink text-bg"
        }`}
      >
        {written(t.acceptButton) || t.acceptButton}
      </button>
      {failed && written(t.acceptFailed) ? (
        <p className={`mt-2 text-[15px] ${onInk ? "text-wash-red" : "text-deep-red"}`}>
          {written(t.acceptFailed)}</p>
      ) : null}
    </>
  );
}

export function AcceptCard({ waiting, lang }: { waiting: WaitingVisit[]; lang: TeamLang }) {
  const t = teamStrings(lang);
  if (waiting.length === 0) return null;
  const heading = written(t.acceptHeading);

  return (
    <section className="mt-4 rounded-panel border border-sand bg-wash-gold p-4">
      {heading ? (
        <h2 className="text-[15px] font-semibold text-deep-gold">{heading}</h2>
      ) : null}
      <ul className={heading ? "mt-3 space-y-4" : "space-y-4"}>
        {waiting.map((one) => (
          <li key={one.slug}>
            <p className="text-[17px] leading-7 text-text">{one.line}</p>
            {one.house ? (
              <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-bg px-2.5 py-0.5 text-[13px] font-semibold text-muted">
                {one.mark === null ? null : <HouseMark index={one.mark} size={12} />}
                {one.house}
              </span>
            ) : null}
            <AcceptButton slug={one.slug} lang={lang} />
          </li>
        ))}
      </ul>
    </section>
  );
}
