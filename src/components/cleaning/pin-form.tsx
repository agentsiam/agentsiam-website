"use client";

import { useState } from "react";
import { field, primaryButton } from "@/components/cleaning/buttons";
import { Padlock } from "@/components/cleaning/glyphs";
import { CLEANING_API_PIN } from "@/lib/cleaning/routes";
import { teamStrings, written, type TeamLang } from "@/lib/cleaning/strings";

/**
 * The front door of the app.
 *
 * Paul's decision, 17/11/2026: the PIN stands in front of everything rather than in front
 * of the codes alone. She types it once on a phone and then has her schedule and her codes
 * both, which is how she described it: she has already put her password in, so she can see
 * all the schedules.
 *
 * What that costs is written down in the scope folder and belongs to him, not to this file:
 * a phone somebody else picks up unlocked is now one tap from the door codes, where before
 * it was one tap from the schedule and a PIN from the codes.
 *
 * Everything on this screen is large and central because of where it is used. A gate, in
 * daylight, one-handed, with a bag in the other hand, which is also why the field asks for
 * a numeric keypad and the button is the full width of the screen.
 */
export function PinForm({ name, lang }: { name: string | null; lang: TeamLang }) {
  const t = teamStrings(lang);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(CLEANING_API_PIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (response.ok) {
        // A full load rather than a client navigation, so the schedule is rendered on the
        // server by the page that checks the cookie it has just been given.
        window.location.reload();
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { state?: string };
      // Unwritten, these say nothing rather than saying it in English. A wrong PIN then
      // clears the field and reports nothing at all, which is the sharpest edge of taking
      // the placeholders off the screens.
      if (body.state === "locked") setMessage(written(t.pinLocked));
      else if (body.state === "unset") setMessage(written(t.pinMissing));
      else setMessage(written(t.pinWrong));
    } catch {
      setMessage(written(t.offline));
    }
    setPin("");
    setBusy(false);
  }

  return (
    <div className="mt-10">
      <span
        aria-hidden="true"
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-ink text-gold-on-ink"
      >
        <Padlock size={26} />
      </span>

      {name ? (
        <h1 className="mt-6 text-center text-[30px] font-semibold leading-10 text-text">
          {name}
        </h1>
      ) : null}

      <form onSubmit={submit} className="mt-7">
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
          maxLength={8}
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
          className={`${field} mt-4 px-4 py-5 text-center text-[32px] tracking-[0.45em]`}
          style={{ fontFamily: "var(--font-plex-sans), system-ui, sans-serif" }}
          required
        />
        <button
          type="submit"
          aria-label={t.pinPrompt}
          disabled={busy || pin.length < 4}
          className={`${primaryButton} mt-5 h-[64px] w-full px-4 text-[18px]`}
        >
          <Padlock size={20} />
        </button>
        {message ? (
          <p className="mt-5 rounded-box bg-wash-red px-4 py-3 text-center text-[16px] leading-7 text-deep-red">
            {message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
