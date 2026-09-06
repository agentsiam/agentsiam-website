"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Owner intake, in the shape the handoff designed: name, a way to reach you, property type
 * and neighbourhood as chips, and a message field that hints at size / furnishing /
 * anything unusual.
 *
 * Two departures from the design, both to keep the existing Resend pipeline working:
 *
 * - Email is its own required field. The design has a single "Email, phone or LINE" input,
 *   but the notification sets reply-to from the address, so a LINE handle in that slot
 *   would silently break replies. Phone / LINE stays as an optional second field.
 * - Selecting a condo shows the warning inline rather than after submitting. That is the
 *   design's own note, moved earlier: telling someone the answer is probably no *before*
 *   they write three paragraphs is the whole point of the qualifier upstream.
 */

const field =
  "rounded-lg border-[1.5px] border-hairline bg-bg px-3.5 py-3 text-sm outline-none focus-visible:border-ink";

function Chip({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`cursor-pointer rounded-full border-[1.5px] px-3.5 py-2 text-[12.5px] ${
        selected
          ? "border-ink bg-ink font-semibold text-white"
          : "border-hairline bg-bg text-text hover:border-ink"
      }`}
    >
      {label}
    </button>
  );
}

export function ContactForm({
  t,
  locale,
  homeHref,
  privacyHref,
}: {
  t: Dictionary;
  locale: Locale;
  /** Locale-aware hrefs, resolved on the server so this component stays locale-agnostic. */
  homeHref: string;
  privacyHref: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  // The confirmation replaces the form, so focus has to be moved onto it or it lands on
  // <body> and the reader is left with no cursor and no announcement.
  const sentRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [propertyType, setPropertyType] = useState("");
  const [area, setArea] = useState("");

  // English values, translated labels. The value is what reaches the mailbox, so an
  // enquiry reads the same whichever language it was written in.
  const types: [string, string][] = [
    ["House", t.typeHouse],
    ["Townhouse", t.typeTownhouse],
    ["Pool villa", t.typePoolVilla],
    ["Condo / apartment", t.typeCondoShort],
  ];
  const areas: [string, string][] = [
    ["Nimman", t.areaNimman],
    ["Santitham", t.areaSantitham],
    ["Old City", t.areaOldCity],
    ["Chang Khlan", t.areaChangKhlan],
    ["Riverside", t.areaRiverside],
    ["Hang Dong", t.areaHangDong],
    ["Mae Rim", t.areaMaeRim],
    ["San Sai", t.areaSanSai],
  ];

  useEffect(() => {
    if (status === "sent") sentRef.current?.focus();
  }, [status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("sending");

    const data = {
      ...Object.fromEntries(new FormData(event.currentTarget)),
      propertyType,
      area,
      locale,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        // The route's own English string is no longer shown to the reader: it reached a
        // Thai owner verbatim. It still travels, so it is kept for the console.
        if (result.error) console.warn("[contact]", result.error);
        setError(t.ctErrorGeneric.replace("{email}", CONTACT_EMAIL));
        setStatus("idle");
        return;
      }
      setStatus("sent");
    } catch {
      setError(t.ctErrorNetwork.replace("{email}", CONTACT_EMAIL));
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      // role="status" and a focused heading. The form is removed on success, so without
      // both of these a screen-reader user got silence and a cursor on <body>.
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
        <h2 className="mt-3.5 font-display text-[23px] font-extrabold tracking-[-0.02em]">
          {t.ctSentTitle}
        </h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-body">
          {t.ctSentBody}{" "}
          <a className="text-primary hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <Link
          href={homeHref}
          className="mt-5 inline-block text-sm font-semibold underline underline-offset-4"
        >
          {t.backHome}
        </Link>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form onSubmit={handleSubmit} className="rounded-panel border border-hairline p-6">
      <div className="grid gap-3.5 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <label className="grid gap-1.5 text-sm">
          <span className="sr-only">{t.yourName}</span>
          <input
            required
            name="name"
            autoComplete="name"
            className={field}
            placeholder={t.yourName}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="sr-only">{t.labelEmail}</span>
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            className={field}
            placeholder={t.labelEmail}
          />
        </label>
      </div>

      <label className="mt-3.5 grid gap-1.5 text-sm">
        <span className="sr-only">{t.contactWay}</span>
        <input
          name="phone"
          autoComplete="tel"
          className={field}
          placeholder={`${t.contactWay} (${t.optional})`}
        />
      </label>

      <fieldset className="mt-5.5">
        <legend className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
          {t.propertyType}
        </legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {types.map(([value, label]) => (
            <Chip
              key={value}
              label={label}
              selected={propertyType === value}
              onSelect={() => setPropertyType(value)}
            />
          ))}
        </div>
      </fieldset>

      {/* role="status": picking the condo chip inserts a paragraph of consequential
          advice, and a sighted user sees it appear while a screen-reader user was told
          nothing until they happened to wander back. */}
      {propertyType === "Condo / apartment" ? (
        <p
          role="status"
          className="mt-3 rounded-box bg-wash-red px-3.5 py-3 text-[13.5px] leading-relaxed text-deep-red"
        >
          {t.ctCondoNote}
        </p>
      ) : null}

      <fieldset className="mt-5.5">
        <legend className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
          {t.whereIsIt}
        </legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {areas.map(([value, label]) => (
            <Chip
              key={value}
              label={label}
              selected={area === value}
              onSelect={() => setArea(value)}
            />
          ))}
        </div>
      </fieldset>

      {/* The label said "Anything else (optional)" on a field carrying `required`, so the
          browser refused the form over a field the label called optional. The field stays
          required, because a lead with no message is not a lead; the label now says so.
          maxLength matches the server, which silently truncated at 4,000 characters and
          returned success. */}
      <label className="mt-5.5 grid gap-2.5 text-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
          {t.ctMessageLabel}{" "}
          <span className="font-normal normal-case tracking-normal">
            ({t.ctRequired})
          </span>
        </span>
        <textarea
          required
          aria-required="true"
          maxLength={4000}
          name="message"
          rows={4}
          className={`${field} resize-y`}
          placeholder={t.contactMsgHint}
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
        <p role="alert" className="mt-3 text-[12.5px] text-deep-red">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className="mt-6 w-full cursor-pointer rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-primary disabled:cursor-not-allowed disabled:bg-muted/40"
      >
        {sending ? t.sending : t.send}
      </button>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        {t.formConsent}{" "}
        <Link className="underline hover:text-primary" href={privacyHref}>
          {t.privacy}
        </Link>
        {/* English closes the sentence with a full stop after the link. Thai and Chinese
            introduce it with a colon and take no terminal stop -- Thai does not use one at
            all. This cannot live in the dictionary: getDictionary treats a blank string as
            a translator's placeholder and falls back to English, so an empty value here
            would render the English full stop on every locale. */}
        {locale === DEFAULT_LOCALE ? "." : null}
      </p>
    </form>
  );
}
