"use client";

import { useState } from "react";
import { CLEANING_API_PIN } from "@/lib/cleaning/routes";
import { TEAM_STRINGS } from "@/lib/cleaning/strings";

/**
 * The PIN in front of the door codes.
 *
 * A numeric keypad, four to eight digits, no name field and nothing to remember beyond the
 * number Paul told her in LINE. There is nothing else on this screen, because there is
 * nothing else she can do here: no reset, no second factor, no way back in that does not
 * go through Paul.
 *
 * Three answers, and the server decides which: wrong, locked out, or no PIN set for her
 * yet. All three are her own copy from src/lib/cleaning/strings.ts; none of them says how
 * many tries are left, and none names anybody.
 */
export function PinForm() {
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
        // A full load rather than a client navigation, so the codes are rendered on the
        // server by the page that checks the cookie it has just been given.
        window.location.reload();
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { state?: string };
      if (body.state === "locked") setMessage(TEAM_STRINGS.pinLocked);
      else if (body.state === "unset") setMessage(TEAM_STRINGS.pinMissing);
      else setMessage(TEAM_STRINGS.pinWrong);
    } catch {
      setMessage(TEAM_STRINGS.offline);
    }
    setPin("");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-6">
      <label htmlFor="pin" className="block text-[17px] leading-7 text-body">
        {TEAM_STRINGS.pinPrompt}
      </label>
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
        className="mt-3 w-full rounded-box border border-border bg-bg px-4 py-4 text-center text-[28px] tracking-[0.4em] text-text"
        style={{ fontFamily: "var(--font-plex-sans), system-ui, sans-serif" }}
        required
      />
      {/* The only thing in this button is a padlock, correctly aria-hidden, which left it
          announcing nothing at all: a bare submit button in the accessibility tree. It
          borrows the prompt above the field rather than taking a string of its own, because
          that sentence already says what the button is for and Paul writes every string here
          from a sheet. A screen reader therefore reads the same line twice, once for the
          field and once for the button, which is worth an eleventh string one day and is not
          worth inventing one. */}
      <button
        type="submit"
        aria-label={TEAM_STRINGS.pinPrompt}
        disabled={busy || pin.length < 4}
        className="mt-5 w-full rounded-box bg-ink px-4 py-4 text-[18px] font-semibold text-bg disabled:opacity-40"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto"
        >
          <rect x="4" y="10.5" width="16" height="10" rx="2" />
          <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
        </svg>
      </button>
      {message ? (
        <p className="mt-4 rounded-box bg-wash-red px-3 py-2 text-[16px] text-deep-red">
          {message}
        </p>
      ) : null}
    </form>
  );
}
