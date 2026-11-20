"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_DEVICE_LABEL } from "@/lib/cleaning/device-shape";
import { ADMIN_API_CLEANING, adminCleaningPersonPath } from "@/lib/cleaning/routes";

export type DeviceRow = {
  device: string;
  enrolledAt: string;
  lastSeenAt: string;
  agent?: string;
  label?: string;
};

/**
 * One person's row on the revocation screen: her phones, her PIN, and a fresh link.
 *
 * Four actions and nothing else. There is no door code on this screen and no schedule:
 * both live in her published document, which only her own phone can open.
 *
 * **A row is one browser, not one phone**, so a handset that opens the app in LINE and in
 * its own browser stands here twice, with two agent strings that differ by a version
 * number. Naming them is the fourth action and the only thing that makes the delete on each
 * one answerable.
 *
 * The enrolment link is shown once, after Paul asks for it, and is not kept anywhere he can
 * find it again. It opens with her PIN and lasts thirty days, so a link left on a screen is
 * worth whatever the person holding that screen knows of her code; if he loses it before
 * pasting it, the cheap fix is another one.
 *
 * **The link button is dead until she has a PIN**, because the PIN is what opens the link.
 * Minting one first would hand her a URL that can only tell her no code has been set.
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
  /** What he has typed into one phone's name field, until it saves. Keyed by device id
   * rather than by position, because revoking a phone re-renders the list without it. */
  const [names, setNames] = useState<Record<string, string>>({});

  async function act(payload: Record<string, string>): Promise<boolean> {
    setBusy(true);
    setMessage("");
    let ok = false;
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
      ok = response.ok;
    } catch {
      setMessage("The request could not be sent.");
    }
    setBusy(false);
    return ok;
  }

  /** Saved, then handed back to the stored value, so a field he has typed into is only
   * dropped once the store has the same words. A failed save leaves his typing alone. */
  async function saveName(device: string, label: string) {
    if (!(await act({ action: "label", device, label }))) return;
    setNames((held) => {
      const next = { ...held };
      delete next[device];
      return next;
    });
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
        {/* The one way into her threads. It is a separate screen because this one carries no
            schedule by design, and a message about a clean has to name the clean. */}
        {hasDocument ? (
          <Link
            href={adminCleaningPersonPath(person)}
            className="text-xs font-semibold text-deep-gold underline"
          >
            messages
          </Link>
        ) : null}
      </div>

      {devices.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No phone enrolled.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {devices.map((device) => (
            <li
              key={device.device}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-box border border-hairline bg-surface px-3 py-2 text-sm"
            >
              {/* First on the row, because it is the only thing here that answers which
                  phone this is. The field is the display as well as the editor: a name
                  shown twice is a name that can disagree with itself. */}
              <input
                aria-label={`What this phone is: ${person}, ${device.device.slice(0, 8)}`}
                value={names[device.device] ?? device.label ?? ""}
                maxLength={MAX_DEVICE_LABEL}
                autoComplete="off"
                placeholder="name this phone"
                onChange={(event) =>
                  setNames((held) => ({ ...held, [device.device]: event.target.value }))
                }
                className="w-40 rounded-box border border-border bg-bg px-2 py-1 text-sm font-semibold text-text"
              />
              <button
                type="button"
                disabled={
                  busy ||
                  (names[device.device] ?? device.label ?? "").trim() === (device.label ?? "")
                }
                onClick={() => saveName(device.device, names[device.device] ?? "")}
                className="rounded-box border border-ink px-2 py-1 text-xs font-semibold text-text disabled:opacity-50"
              >
                Save name
              </button>
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
          disabled={busy || !pinSetAt}
          onClick={() => act({ action: "link" })}
          className="rounded-box bg-ink px-3 py-2 text-sm font-semibold text-bg disabled:opacity-50"
        >
          New enrolment link
        </button>
        {pinSetAt ? null : (
          <span className="text-xs text-muted">Set her PIN first. The link opens with it.</span>
        )}
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
          Send this to her in LINE. She opens it with her PIN, in every browser she wants the
          app in, and it stops working after thirty days. {link}
        </p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
    </section>
  );
}
