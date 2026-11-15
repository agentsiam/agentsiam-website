"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { trackEvent } from "@/lib/analytics";
import type { OutletSlug } from "@/lib/editorial";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * The email capture on an outlet index.
 *
 * One field, because one field is the whole ask. The contact form upstream qualifies an
 * owner across eight answers and is right to; this is a reader saying "tell me when there
 * is another one", and every extra box on it is a reason not to.
 *
 * The register in the body line differs by outlet -- คุณ for the guest journal, ท่าน for the
 * owner newsletter -- which is why the caller passes the string rather than this component
 * choosing it. The consent line is shared and is written without a pronoun in Thai for the
 * same reason.
 *
 * On success the panel replaces itself with the confirmation and moves focus onto it,
 * which is the pattern the contact form established: without it a screen-reader user gets
 * silence and a cursor on <body>.
 */
export function SubscribeForm({
  t,
  locale,
  outlet,
  body,
  privacyHref,
  /** Dark panel, where the capture sits on ink rather than on a wash. */
  tone = "wash",
}: {
  t: Dictionary;
  locale: Locale;
  outlet: OutletSlug;
  body: string;
  privacyHref: string;
  tone?: "wash" | "ink";
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const sentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "sent") sentRef.current?.focus();
  }, [status]);

  const ink = tone === "ink";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const email = String(fields.email ?? "").trim();
    // Checked here as well as on the route, so a typo costs a keystroke rather than a
    // round trip. The route is the one that decides.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t.subErrorEmail);
      return;
    }
    setStatus("sending");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company: fields.company ?? "", outlet, locale }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        // The route answers in English. It reached a Thai owner verbatim once, through the
        // contact form, so it stays in the console and the reader gets the dictionary.
        if (result.error) console.warn("[subscribe]", result.error);
        setError(t.subErrorGeneric.replace("{email}", CONTACT_EMAIL));
        setStatus("idle");
        return;
      }
      setStatus("sent");
      // After the route accepted it, never before. Carries the event name and nothing
      // else, so the address does not go to Google.
      trackEvent("newsletter_subscribed");
    } catch {
      setError(t.subErrorNetwork.replace("{email}", CONTACT_EMAIL));
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        ref={sentRef}
        tabIndex={-1}
        className="outline-none"
      >
        <div
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-teal text-lg text-white"
        >
          ✓
        </div>
        <h3
          className={`mt-3.5 font-display text-[21px] font-extrabold tracking-[-0.02em] ${
            ink ? "text-white" : ""
          }`}
        >
          {t.subSentTitle}
        </h3>
        <p
          className={`mt-2 max-w-[42ch] text-[14.5px] leading-relaxed ${
            ink ? "text-white/75" : "text-body"
          }`}
        >
          {t.subSentBody}
        </p>
      </div>
    );
  }

  const sending = status === "sending";
  const [consentBefore, consentAfter] = t.subConsent.split("{privacy}");

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h3
        className={`font-display text-[clamp(21px,2.6vw,26px)] font-extrabold tracking-[-0.02em] ${
          ink ? "text-white" : ""
        }`}
      >
        {t.subTitle}
      </h3>
      <p
        className={`mt-2.5 max-w-[46ch] text-[14.5px] leading-relaxed ${
          ink ? "text-white/75" : "text-body"
        }`}
      >
        {body}
      </p>

      {/* Stacked below 480 and side by side above it. The button keeps its own row on a
          phone rather than shrinking to a square: a 44px target matters more here than a
          tidy line. */}
      <div className="mt-5 flex flex-col gap-2.5 min-[480px]:flex-row">
        <label htmlFor={`sub-email-${outlet}`} className="sr-only">
          {t.subEmailLabel}
        </label>
        <input
          id={`sub-email-${outlet}`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          disabled={sending}
          placeholder={t.subEmailPlaceholder}
          aria-describedby={error ? `sub-error-${outlet}` : undefined}
          aria-invalid={error ? true : undefined}
          className={`min-h-[48px] flex-1 rounded-full border-[1.5px] px-5 text-[15px] outline-none disabled:opacity-60 ${
            ink
              ? "border-white/25 bg-white/10 text-white placeholder:text-white/45 focus-visible:border-white"
              : "border-hairline bg-bg text-text placeholder:text-muted focus-visible:border-ink"
          }`}
        />
        <button
          type="submit"
          disabled={sending}
          className={`min-h-[48px] cursor-pointer rounded-full px-6 text-[15px] font-semibold disabled:opacity-60 ${
            ink ? "bg-white text-ink hover:bg-sand" : "bg-ink text-white hover:bg-primary"
          }`}
        >
          {sending ? `${t.subSending}…` : t.subButton}
        </button>
        {/* Never seen by a person, so anything in it is a bot. */}
        <input name="company" tabIndex={-1} autoComplete="off" className="hidden" />
      </div>

      {error ? (
        <p
          id={`sub-error-${outlet}`}
          role="alert"
          className={`mt-3 text-[13.5px] font-semibold ${ink ? "text-pink" : "text-deep-red"}`}
        >
          {error}
        </p>
      ) : null}

      <p
        className={`mt-3.5 max-w-[52ch] text-[12.5px] leading-relaxed ${
          ink ? "text-white/55" : "text-muted"
        }`}
      >
        {consentBefore}
        <Link
          href={privacyHref}
          className={`underline underline-offset-2 ${ink ? "hover:text-white" : "hover:text-primary"}`}
        >
          {t.subConsentPrivacy}
        </Link>
        {consentAfter}
      </p>
    </form>
  );
}
