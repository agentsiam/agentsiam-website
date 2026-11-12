"use client";

import { useState } from "react";

/**
 * The passphrase form.
 *
 * Posts to /api/admin/session, which is what sets the cookie, and then does a full page
 * load rather than a client navigation: the admin is a separate root layout from the rest
 * of the site and the header has to re-render with the session in it.
 *
 * One deliberate vagueness. A wrong passphrase says the passphrase is wrong and does not
 * say whether that name exists, because there are two names and both are easy to guess.
 */
export function SignInForm({ next }: { next: string }) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });
      if (response.ok) {
        window.location.assign(next);
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "That did not work.");
    } catch {
      setError("The sign-in could not be sent. Check the connection and try again.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-6">
      <label htmlFor="passphrase" className="block text-xs font-semibold text-muted">
        Passphrase
      </label>
      <input
        id="passphrase"
        name="passphrase"
        type="password"
        autoComplete="current-password"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        value={passphrase}
        onChange={(event) => setPassphrase(event.target.value)}
        className="mt-1 w-full rounded-box border border-border bg-bg px-3 py-2 text-sm text-text"
        required
      />
      <button
        type="submit"
        disabled={busy || passphrase.length === 0}
        className="mt-4 w-full rounded-box bg-ink px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50"
      >
        {busy ? "Signing in" : "Sign in"}
      </button>
      {error ? <p className="mt-3 text-sm text-deep-red">{error}</p> : null}
    </form>
  );
}
