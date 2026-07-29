"use client";

import { useState } from "react";

const services = [
  "Feasibility study / STR management",
  "Business Setup & Compliance Advisory",
  "OEM & Supply Chain Enablement",
  "Ecommerce & Local Platform Launch",
  "Growth, Marketing & Operations Integration",
  "Not sure / general inquiry",
];

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border p-8 text-center">
        <p className="text-text">
          Form UI only &mdash; nothing was actually sent. Real submission
          handling (an API route + email delivery, or a form backend) isn&rsquo;t
          wired up yet.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="grid gap-5 rounded-2xl border border-border p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm text-text">
          First name
          <input
            required
            className="rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="Nils"
          />
        </label>
        <label className="grid gap-1.5 text-sm text-text">
          Last name
          <input
            required
            className="rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="Meinhardt"
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm text-text">
        Email
        <input
          required
          type="email"
          className="rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
          placeholder="you@company.com"
        />
      </label>
      <label className="grid gap-1.5 text-sm text-text">
        Phone
        <input
          className="rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
          placeholder="+66"
        />
      </label>
      <label className="grid gap-1.5 text-sm text-text">
        Which service?
        <select className="rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary">
          {services.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm text-text">
        Message
        <textarea
          required
          rows={4}
          className="rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
          placeholder="Tell us about your property or business."
        />
      </label>
      <button
        type="submit"
        className="justify-self-start rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary"
      >
        Send
      </button>
    </form>
  );
}
