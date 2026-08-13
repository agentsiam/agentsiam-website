"use client";

import { useState } from "react";
import { CONTACT_EMAIL } from "@/lib/site";

const services = [
  "Feasibility study / STR management",
  "Business Setup & Compliance Advisory",
  "OEM & Supply Chain Enablement",
  "Ecommerce & Local Platform Launch",
  "Growth, Marketing & Operations Integration",
  "Not sure / general inquiry",
];

const field =
  "rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("sending");

    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          result.error ?? `Something went wrong. Please email ${CONTACT_EMAIL}.`,
        );
        setStatus("idle");
        return;
      }
      setStatus("sent");
    } catch {
      setError(`Could not reach the server. Please email ${CONTACT_EMAIL}.`);
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-border p-8 text-center">
        <p className="font-semibold text-text">
          Thank you, your message is on its way.
        </p>
        <p className="mt-2 text-sm text-muted">
          We read every enquiry ourselves and normally reply within one working
          day. If it is urgent, write to{" "}
          <a
            className="text-primary hover:underline"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-2xl border border-border p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm text-text">
          First name
          <input
            required
            name="firstName"
            autoComplete="given-name"
            className={field}
            placeholder="Nils"
          />
        </label>
        <label className="grid gap-1.5 text-sm text-text">
          Last name
          <input
            required
            name="lastName"
            autoComplete="family-name"
            className={field}
            placeholder="Meinhardt"
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm text-text">
        Email
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          className={field}
          placeholder="you@company.com"
        />
      </label>
      <label className="grid gap-1.5 text-sm text-text">
        Phone
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          className={field}
          placeholder="+66"
        />
      </label>
      <label className="grid gap-1.5 text-sm text-text">
        Which service?
        <select name="service" className={field}>
          {services.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm text-text">
        Message
        <textarea
          required
          name="message"
          rows={4}
          className={field}
          placeholder="Tell us about your property or business."
        />
      </label>

      {/* Honeypot. Hidden from people and from screen readers, irresistible to bots. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-primary">
          {error}
        </p>
      ) : null}

      <p className="text-xs text-muted">
        By sending this form you agree to us contacting you about your enquiry.
        See our{" "}
        <a
          className="hover:text-primary hover:underline"
          href="/privacy-policy"
        >
          privacy policy
        </a>
        .
      </p>

      <button
        type="submit"
        disabled={sending}
        className="justify-self-start rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
