"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_API_CLEANING } from "@/lib/cleaning/routes";

export type DeviceRow = {
  device: string;
  enrolledAt: string;
  lastSeenAt: string;
  agent?: string;
};

/**
 * One person's row on the revocation screen: her phones, her PIN, and a fresh link.
 *
 * Three actions and nothing else. There is no door code on this screen and no schedule:
 * both live in her published document, which only her own phone can open.
 *
 * The enrolment link is shown once, after Paul asks for it, and is not kept anywhere he can
 * find it again. It is single-use and a week long, so a link left on a screen is a link
 * that gets used by whoever is holding that screen; if he loses it before pasting it, the
 * cheap fix is another one.
 */
export function CleaningPerson({
  person,
  devices,
  pinSetAt,
  hasDocument,
}: {
  person: string;
  devices: DeviceRow[];
  pinSetAt: string | null;
  hasDocument: boolean;
}) {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function act(payload: Record<string, string>) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(ADMIN_API_CLEANING, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person, ...payload }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!response.ok) {
        setMessage(body.error ?? "That did not work.");
      } else if (body.url) {
        setLink(body.url);
      } else {
        setMessage("Done.");
        router.refresh();
      }
    } catch {
      setMessage("The request could not be sent.");
    }
    setBusy(false);
  }

  return (
    <section className="mt-6 rounded-panel border border-hairline bg-bg p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2
          className="text-base font-semibold text-text"
          style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
        >
          {person}
        </h2>
        <span className="text-xs text-muted">
          {hasDocument ? "schedule published" : "nothing published"}
        </span>
        <span className="text-xs text-muted">
          {pinSetAt ? `PIN set ${pinSetAt.slice(0, 10)}` : "no PIN set"}
        </span>
      </div>

      {devices.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No phone enrolled.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {devices.map((device) => (
            <li
              key={device.device}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-box border border-hairline bg-surface px-3 py-2 text-sm"
            >
              <span className="font-mono text-xs text-muted">
                {device.device.slice(0, 8)}
              </span>
              <span className="text-xs text-muted">
                enrolled {device.enrolledAt.slice(0, 10)}, last seen{" "}
                {device.lastSeenAt.slice(0, 10)}
              </span>
              {device.agent ? (
                <span className="max-w-full truncate text-xs text-muted">{device.agent}</span>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={() => act({ action: "revoke", device: device.device })}
                className="ml-auto rounded-box border border-deep-red px-3 py-1 text-xs font-semibold text-deep-red disabled:opacity-50"
              >
                Revoke this phone
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => act({ action: "link" })}
          className="rounded-box bg-ink px-3 py-2 text-sm font-semibold text-bg disabled:opacity-50"
        >
          New enrolment link
        </button>
        <label htmlFor={`pin-${person}`} className="text-xs font-semibold text-muted">
          Set her PIN
        </label>
        <input
          id={`pin-${person}`}
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          maxLength={8}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
          className="w-28 rounded-box border border-border bg-bg px-3 py-2 text-sm text-text"
        />
        <button
          type="button"
          disabled={busy || pin.length < 4}
          onClick={() => act({ action: "pin", pin }).then(() => setPin(""))}
          className="rounded-box border border-ink px-3 py-2 text-sm font-semibold text-text disabled:opacity-50"
        >
          Save PIN
        </button>
      </div>

      {link ? (
        <p className="mt-3 break-all rounded-box border border-hairline bg-wash-gold px-3 py-2 text-xs text-deep-gold">
          Send this to her in LINE. It works once, on the first phone that opens it, and
          stops working after a week. {link}
        </p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
    </section>
  );
}
