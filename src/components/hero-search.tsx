"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { CITIES, DEFAULT_CITY } from "@/lib/areas";
import { PROPERTIES } from "@/lib/property";
import { searchToQuery } from "@/lib/search";

/**
 * The homepage search bar — the page's primary action.
 *
 * Where · Check-in · Check-out · Guests · Search, laid out horizontally on desktop and
 * stacked into labelled rows on a phone. It submits to /properties as a query string,
 * because on that page the URL is the search.
 *
 * All four fields are optional. An empty search returns everything in Chiang Mai, which
 * is the handoff's intent: the bar should never be a gate. It is a real form with a real
 * submit, so Enter works and the whole thing is operable from the keyboard.
 *
 * "Where" is city-level, and lists two cities we cannot yet serve. That is deliberate —
 * naming Bangkok and Phuket signals intent — but it only works because /properties
 * answers a non-live city with a page that says what is coming and offers something to
 * do. An unexplained empty result would read as a broken site.
 *
 * Dates are carried, not enforced. Nothing here checks availability: that is Beds24's
 * answer and it is given per property, on the property page, against the live calendar.
 * What it does check is that the dates are possible at all — a search for last January
 * used to render as a live result set, and a check-out earlier than the check-in was
 * reported by a native browser bubble on a field the guest had already finished with.
 */

/** The largest party any property we manage can take. The stepper stops there. */
const MAX_GUESTS = Math.max(...PROPERTIES.map((property) => property.maxGuests));

/**
 * Today, in UTC, matching the server's own date arithmetic. Read at submit time rather
 * than at render, so a tab left open overnight validates against the right day.
 */
function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function HeroSearch({ t, locale }: { t: Dictionary; locale: Locale }) {
  const router = useRouter();
  const [city, setCity] = useState(DEFAULT_CITY.slug);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [guests, setGuests] = useState(2);
  const [error, setError] = useState<string | null>(null);

  const checkIn = useRef<HTMLInputElement>(null);
  const checkOut = useRef<HTMLInputElement>(null);

  /**
   * The floor on the check-in picker, written to the DOM rather than rendered.
   *
   * It cannot be a React prop: this page is prerendered, so a `min` baked at build time
   * would be stale by the time anyone sees it, and computing it during render would make
   * the server's UTC date and the guest's clock disagree at hydration. Setting it once
   * on mount gets a value that is always today, from the browser that is actually using
   * the field.
   */
  useEffect(() => {
    checkIn.current?.setAttribute("min", utcToday());
  }, []);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const today = utcToday();

    if (from && from < today) {
      setError(t.bkPastCheckIn);
      checkIn.current?.focus();
      return;
    }
    if (to && to < today) {
      setError(t.bkPastCheckIn);
      checkOut.current?.focus();
      return;
    }
    if (from && to && to <= from) {
      setError(t.bkCheckOutAfter);
      checkOut.current?.focus();
      return;
    }

    setError(null);
    router.push(
      localePath(locale, "/properties") + searchToQuery({ city, from, to, guests }),
    );
  }

  return (
    <form
      onSubmit={submit}
      // Our own message, in the page, in the guest's language. The native bubble fires on
      // whichever field the browser decides, in the browser's language, and vanishes.
      noValidate
      className="rounded-panel bg-bg p-3.5 shadow-lg"
    >
      <div className="grid gap-3 min-[900px]:grid-cols-[1.2fr_1fr_1fr_auto_auto] min-[900px]:items-end min-[900px]:gap-2.5">
        <Field label={t.where}>
          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className={control}
          >
            {CITIES.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.name}
                {option.live ? "" : ` — ${t.launchingSoon}`}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t.checkIn}>
          <input
            ref={checkIn}
            type="date"
            value={from}
            onChange={(event) => {
              const next = event.target.value;
              setFrom(next);
              setError(null);
              // A check-out the new check-in has just overtaken is no longer an answer to
              // anything. Clearing it beats leaving a value the browser silently refuses.
              if (next && to && to <= next) setTo("");
            }}
            className={control}
          />
        </Field>

        <Field label={t.checkOut}>
          <input
            ref={checkOut}
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => {
              setTo(event.target.value);
              setError(null);
            }}
            className={control}
          />
        </Field>

        {/* A group, not a label. The old `<label>` wrapped both stepper buttons, so the
            browser bound it to the first one and clicking the word "Guests" took a guest
            off the count. */}
        <div role="group" aria-labelledby="hero-guests" className="grid gap-1 px-2.5">
          <span id="hero-guests" className={fieldLabel}>
            {t.guests}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setGuests(Math.max(1, guests - 1))}
              disabled={guests <= 1}
              aria-label={t.bkFewerGuests}
              className="h-11 w-11 shrink-0 cursor-pointer rounded-full border-[1.5px] border-hairline text-lg leading-none hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
            >
              −
            </button>
            <span aria-hidden="true" className="min-w-6 text-center text-sm font-semibold">
              {guests}
            </span>
            <span className="sr-only" aria-live="polite" aria-atomic="true">
              {guests === 1
                ? t.bkOneGuestSelected
                : t.bkGuestsSelected.replace("{n}", String(guests))}
            </span>
            <button
              type="button"
              onClick={() => setGuests(Math.min(MAX_GUESTS, guests + 1))}
              disabled={guests >= MAX_GUESTS}
              aria-label={t.bkMoreGuests}
              className="h-11 w-11 shrink-0 cursor-pointer rounded-full border-[1.5px] border-hairline text-lg leading-none hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>

        {/* Oversized on purpose: the handoff makes this the page's primary CTA and
            deliberately larger than a field-sized control, so it does not read as a fifth
            input. There is no second button beside it for the same reason. */}
        <button
          type="submit"
          className="min-h-11 cursor-pointer rounded-full bg-ink px-9 py-4 text-[15px] font-semibold text-white hover:bg-primary min-[900px]:py-4.5"
        >
          {t.search}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-2.5 px-2.5 text-[12.5px] text-deep-red">
          {error}
        </p>
      ) : null}
    </form>
  );
}

const control =
  "w-full min-h-11 rounded-lg border-[1.5px] border-transparent bg-bg px-1 py-2 text-sm outline-none focus-visible:border-ink";

const fieldLabel =
  "text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 px-2.5">
      <span className={fieldLabel}>{label}</span>
      {children}
    </label>
  );
}
