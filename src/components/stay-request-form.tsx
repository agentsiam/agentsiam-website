"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * "Tell us what you need": the guest request form on the monthly-stay pages.
 *
 * Built on the contact form's pattern (honeypot, focused confirmation, error that points at
 * the mailbox) but posting to /api/stay-request, so a guest request and an owner enquiry
 * arrive with different subject lines and are counted separately.
 *
 * English only for now: the labels arrive as props from the page, which renders on /en
 * only until the copy is settled and translated in one pass (R9).
 */

export type StayRequestLabels = {
  name: string;
  email: string;
  phone: string;
  optional: string;
  area: string;
  areaAny: string;
  checkIn: string;
  checkOut: string;
  bedrooms: string;
  budget: string;
  budgetHint: string;
  foundVia: string;
  foundViaHint: string;
  message: string;
  messageHint: string;
  required: string;
  send: string;
  sending: string;
  sentTitle: string;
  sentBody: string;
  error: string;
  consent: string;
  privacy: string;
};

const field =
  "rounded-lg border-[1.5px] border-hairline bg-bg px-3.5 py-3 text-sm outline-none focus-visible:border-ink";

const label = "text-xs font-semibold uppercase tracking-[0.06em] text-muted";

export function StayRequestForm({
  labels,
  areas,
  defaultArea = "",
  page,
  privacyHref,
}: {
  labels: StayRequestLabels;
  /** English area names. The value is what reaches the mailbox. */
  areas: string[];
  defaultArea?: string;
  /** The bare route the form sits on, so the email says which page produced the lead. */
  page: string;
  privacyHref: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const sentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "sent") sentRef.current?.focus();
  }, [status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("sending");

    const data = { ...Object.fromEntries(new FormData(event.currentTarget)), page, locale: "en" };

    try {
      const response = await fetch("/api/stay-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (result.error) console.warn("[stay-request]", result.error);
        setError(labels.error.replace("{email}", CONTACT_EMAIL));
        setStatus("idle");
        return;
      }
      setStatus("sent");
      // After the route accepted it, and with no parameters: nothing typed here goes to Google.
      trackEvent("stay_request_sent");
    } catch {
      setError(labels.error.replace("{email}", CONTACT_EMAIL));
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        ref={sentRef}
        tabIndex={-1}
        className="rounded-panel border border-hairline p-7 outline-none"
      >
        <div
          aria-hidden="true"
          className="flex h-10.5 w-10.5 items-center justify-center rounded-full bg-teal text-xl text-white"
        >
          ✓
        </div>
        <h3 className="mt-3.5 font-display text-[23px] font-extrabold tracking-[-0.02em]">
          {labels.sentTitle}
        </h3>
        <p className="mt-2 text-[14.5px] leading-relaxed text-body">
          {labels.sentBody}{" "}
          <a className="text-primary hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form onSubmit={handleSubmit} className="rounded-panel border border-hairline p-6">
      <div className="grid gap-3.5 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className={label}>{labels.name}</span>
          <input required name="name" autoComplete="name" className={field} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className={label}>{labels.email}</span>
          <input required type="email" name="email" autoComplete="email" className={field} />
        </label>
      </div>

      <label className="mt-3.5 grid gap-1.5 text-sm">
        <span className={label}>
          {labels.phone}{" "}
          <span className="font-normal normal-case tracking-normal">({labels.optional})</span>
        </span>
        <input name="phone" autoComplete="tel" className={field} />
      </label>

      <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className={label}>{labels.checkIn}</span>
          <input required type="date" name="checkIn" className={field} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className={label}>{labels.checkOut}</span>
          <input required type="date" name="checkOut" className={field} />
        </label>
      </div>

      <div className="mt-3.5 grid gap-3.5 sm:grid-cols-3">
        <label className="grid gap-1.5 text-sm">
          <span className={label}>{labels.area}</span>
          <select name="area" defaultValue={defaultArea} className={field}>
            <option value="">{labels.areaAny}</option>
            {areas.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className={label}>{labels.bedrooms}</span>
          <select name="bedrooms" defaultValue="2" className={field}>
            {["1", "2", "3", "4+"].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className={label}>{labels.budget}</span>
          <input name="budget" className={field} placeholder={labels.budgetHint} />
        </label>
      </div>

      <label className="mt-3.5 grid gap-1.5 text-sm">
        <span className={label}>
          {labels.foundVia}{" "}
          <span className="font-normal normal-case tracking-normal">({labels.required})</span>
        </span>
        <input
          required
          aria-required="true"
          name="foundVia"
          maxLength={200}
          className={field}
          placeholder={labels.foundViaHint}
        />
      </label>

      <label className="mt-3.5 grid gap-1.5 text-sm">
        <span className={label}>
          {labels.message}{" "}
          <span className="font-normal normal-case tracking-normal">({labels.optional})</span>
        </span>
        <textarea
          name="message"
          rows={3}
          maxLength={4000}
          className={`${field} resize-y`}
          placeholder={labels.messageHint}
        />
      </label>

      {/* Honeypot. Hidden from people and from screen readers. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-[12.5px] text-deep-red">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className="mt-6 w-full cursor-pointer rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-primary disabled:cursor-not-allowed disabled:bg-muted/40"
      >
        {sending ? labels.sending : labels.send}
      </button>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        {labels.consent}{" "}
        <Link className="underline hover:text-primary" href={privacyHref}>
          {labels.privacy}
        </Link>
        .
      </p>
    </form>
  );
}
