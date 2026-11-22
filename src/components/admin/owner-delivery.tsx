"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CONTACT_SLOT } from "@/lib/admin/owner-delivery-slot";
import { adminCandidatePath, adminPropertyPath } from "@/lib/admin/routes";

/**
 * Asking pool owners about one renter lead, by hand.
 *
 * Every message is written on the server and only copied here. A person sends it from their
 * own LINE, Facebook or email, then presses the button that records it. Nothing on this
 * screen sends a message to anyone.
 *
 * The renter's details are the one thing gated: offered only once the owner has accepted the
 * terms and the renter ticked the box, and completed only by pasting the contact from the
 * request email, because the site does not hold it. Copy stays disabled until that is filled,
 * so a message with an empty contact line cannot be sent by accident.
 */

export type DeliveryRow = {
  propertyId: string;
  name: string;
  area: string;
  bedrooms: string;
  channel: string;
  handle: string;
  status: string;
  fits: string[];
  misses: string[];
  termsAgreed: boolean;
  candidateId: string | null;
  askedOn: string;
  askedForEarlier: { leadId: string; askedOn: string }[];
  ask: { th: string; en: string };
  details: { th: string; en: string } | null;
};

type Language = "th" | "en";

const BUTTON =
  "rounded-box border border-hairline px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50";
const PRIMARY =
  "rounded-box bg-ink px-3 py-1.5 text-xs font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-50";

function CopyBox({ text, disabled }: { text: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2">
      <textarea
        readOnly
        value={text}
        rows={Math.min(14, text.split("\n").length + 1)}
        className="w-full rounded-box border border-hairline bg-surface-2 p-3 font-mono text-xs text-text"
      />
      <button
        type="button"
        disabled={disabled}
        className={`${BUTTON} mt-1`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Copied" : "Copy message"}
      </button>
    </div>
  );
}

function Row({
  leadId,
  row,
  consent,
}: {
  leadId: string;
  row: DeliveryRow;
  consent: "yes" | "no" | "not recorded";
}) {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("th");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [contact, setContact] = useState("");

  async function act(action: "add" | "asked" | "terms") {
    if (
      action === "terms" &&
      !window.confirm(
        `Record that the owner of ${row.name} has accepted the introduction terms? This is what lets the renter's details be passed to them.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/owner-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          leadId,
          propertyId: row.propertyId,
          candidateId: row.candidateId,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "That did not save.");
      } else {
        router.refresh();
      }
    } catch {
      setError("That could not be sent. Check the connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const detailsAllowed = row.termsAgreed && consent === "yes" && row.candidateId !== null;
  const details = row.details ? row.details[language].replace(CONTACT_SLOT, contact.trim()) : "";

  return (
    <li className="rounded-panel border border-hairline bg-bg p-5 text-sm">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <a
          href={adminPropertyPath(row.propertyId)}
          className="font-semibold text-primary hover:underline"
        >
          {row.propertyId} {row.name}
        </a>
        <span
          className={`rounded-box px-2 py-0.5 text-xs font-semibold ${
            row.termsAgreed ? "bg-wash-green text-deep-green" : "bg-surface-2 text-muted"
          }`}
        >
          {row.termsAgreed ? "terms accepted" : "terms not accepted"}
        </span>
        {row.askedOn ? (
          <span className="text-xs font-semibold text-deep-green">asked {row.askedOn}</span>
        ) : null}
      </div>

      <p className="mt-1 text-xs text-muted">
        {[row.area, row.bedrooms ? `${row.bedrooms} bed` : "", row.channel, row.handle]
          .filter(Boolean)
          .join(", ") || "no details recorded"}
        {row.status ? `. Pool status: ${row.status}` : ""}
      </p>

      <p className="mt-2 text-xs">
        {row.fits.length > 0 ? (
          <span className="text-deep-green">Fits: {row.fits.join("; ")}. </span>
        ) : null}
        {row.misses.length > 0 ? (
          <span className="text-deep-red">May not fit: {row.misses.join("; ")}.</span>
        ) : null}
      </p>

      {row.askedForEarlier.length > 0 ? (
        <p className="mt-2 rounded-box bg-wash-gold p-2 text-xs text-deep-gold">
          Already asked for the same renter:{" "}
          {row.askedForEarlier.map((entry) => `${entry.leadId} on ${entry.askedOn}`).join(", ")}.
          Do not ask this owner again for this repeat.
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {row.candidateId === null ? (
          <button type="button" className={PRIMARY} disabled={busy} onClick={() => act("add")}>
            Add to shortlist
          </button>
        ) : (
          <a
            href={adminCandidatePath(leadId, row.candidateId)}
            className="text-xs text-primary hover:underline"
          >
            On the shortlist
          </a>
        )}
        <span className="text-xs text-muted">Message in</span>
        {(["th", "en"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`${BUTTON} ${language === value ? "bg-surface-2" : ""}`}
            aria-pressed={language === value}
            onClick={() => setLanguage(value)}
          >
            {value === "th" ? "Thai" : "English"}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs font-semibold text-muted">
        1. Ask the owner. No name, no contact, no budget.
      </p>
      <CopyBox text={row.ask[language]} />
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className={BUTTON}
          disabled={busy || row.candidateId === null}
          title={row.candidateId === null ? "Add it to the shortlist first" : undefined}
          onClick={() => act("asked")}
        >
          I sent it: record asked today
        </button>
        {!row.termsAgreed ? (
          <button type="button" className={BUTTON} disabled={busy} onClick={() => act("terms")}>
            Owner accepted the terms
          </button>
        ) : null}
      </div>

      <p className="mt-4 text-xs font-semibold text-muted">
        2. The renter&rsquo;s details, once the owner has accepted the terms.
      </p>
      {detailsAllowed && row.details ? (
        <>
          <label className="mt-2 block text-xs text-muted">
            Paste how to reach the renter, from the request email for {leadId} in
            hi@agentsiam.com
            <input
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              className="mt-1 w-full rounded-box border border-hairline bg-bg p-2 text-sm text-text"
              maxLength={200}
            />
          </label>
          <CopyBox text={details} disabled={contact.trim().length === 0} />
        </>
      ) : (
        <p className="mt-1 text-xs text-muted">
          {consent !== "yes"
            ? consent === "no"
              ? "Not offered: the renter did not tick the box allowing their request to be passed to an owner."
              : "Not offered: this lead was entered by hand, so there is no consent on record. Ask the renter first."
            : !row.termsAgreed
              ? "Not offered until the owner accepts the terms."
              : "Add it to the shortlist first."}
        </p>
      )}

      {error ? <p className="mt-2 text-xs text-deep-red">{error}</p> : null}
    </li>
  );
}

export function OwnerDelivery({
  leadId,
  rows,
  consent,
}: {
  leadId: string;
  rows: DeliveryRow[];
  consent: "yes" | "no" | "not recorded";
}) {
  if (rows.length === 0) {
    return (
      <p className="mt-4 rounded-panel border border-hairline bg-bg p-5 text-sm text-muted">
        The property pool is empty, so there is nobody to ask.
      </p>
    );
  }
  return (
    <ul className="mt-4 space-y-3">
      {rows.map((row) => (
        <Row key={row.propertyId} leadId={leadId} row={row} consent={consent} />
      ))}
    </ul>
  );
}
