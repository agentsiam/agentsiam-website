"use client";

import { useState } from "react";
import { OUTLET_KINDS } from "@/lib/admin/blocked";

/** What each kind of outlet matches, in the words the list's own file uses. */
const WHAT_IT_MATCHES: Record<string, string> = {
  domain: "A host, and any subdomain of it, in a source link or a map link.",
  link: "A specific link, anywhere in a link, protocol and www ignored.",
  phone: "A number, compared on its last nine digits.",
  handle: "An account name on a channel. @name, name and NAME all match.",
  name: "A trading name, inside a property name or a contact handle.",
};

const INPUT = "mt-1 w-full rounded-box border border-border bg-bg px-3 py-2 text-sm text-text";

export function AddOutletForm({ operators }: { operators: string[] }) {
  const [operator, setOperator] = useState(operators[0] ?? "");
  const [kind, setKind] = useState<string>("domain");
  const [value, setValue] = useState("");
  const [channel, setChannel] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/blocked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operator, kind, value, channel, note }),
      });
      if (response.ok) {
        window.location.reload();
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "The addition did not land.");
    } catch {
      setError("The addition could not be sent.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-panel border border-hairline bg-bg p-5">
      {error ? <p className="mb-4 text-sm text-deep-red">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="operator" className="block text-xs font-semibold text-muted">
            Operator
          </label>
          <input
            id="operator"
            list="known-operators"
            className={INPUT}
            value={operator}
            onChange={(event) => setOperator(event.target.value)}
            required
          />
          <datalist id="known-operators">
            {operators.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="kind" className="block text-xs font-semibold text-muted">
            Kind of outlet
          </label>
          <select
            id="kind"
            className={INPUT}
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            {OUTLET_KINDS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">{WHAT_IT_MATCHES[kind]}</p>
        </div>

        <div>
          <label htmlFor="value" className="block text-xs font-semibold text-muted">
            The outlet
          </label>
          <input
            id="value"
            className={INPUT}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="channel" className="block text-xs font-semibold text-muted">
            Channel, if it helps
          </label>
          <input
            id="channel"
            className={INPUT}
            placeholder="LINE, WhatsApp, website"
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="note" className="block text-xs font-semibold text-muted">
            Note
          </label>
          <input
            id="note"
            className={INPUT}
            placeholder="How it was found, or what it covers"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={busy || value.trim().length === 0 || operator.trim().length === 0}
        className="mt-4 rounded-box bg-ink px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50"
      >
        {busy ? "Adding" : "Add to the list"}
      </button>
    </form>
  );
}
