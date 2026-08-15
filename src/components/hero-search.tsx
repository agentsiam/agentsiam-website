"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Dictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { CITIES, DEFAULT_CITY } from "@/lib/areas";
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
 */
export function HeroSearch({ t, locale }: { t: Dictionary; locale: Locale }) {
  const router = useRouter();
  const [city, setCity] = useState(DEFAULT_CITY.slug);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [guests, setGuests] = useState(2);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(
      localePath(locale, "/properties") + searchToQuery({ city, from, to, guests }),
    );
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-panel bg-bg p-3.5 shadow-lg min-[900px]:grid-cols-[1.2fr_1fr_1fr_auto_auto] min-[900px]:items-end min-[900px]:gap-2.5"
    >
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
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className={control}
        />
      </Field>

      <Field label={t.checkOut}>
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => setTo(event.target.value)}
          className={control}
        />
      </Field>

      <Field label={t.guests}>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setGuests(Math.max(1, guests - 1))}
            disabled={guests <= 1}
            aria-label={`${t.guests} −`}
            className="h-9 w-9 shrink-0 cursor-pointer rounded-full border-[1.5px] border-hairline text-lg leading-none hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
          >
            −
          </button>
          <span className="min-w-6 text-center text-sm font-semibold">{guests}</span>
          <button
            type="button"
            onClick={() => setGuests(Math.min(12, guests + 1))}
            aria-label={`${t.guests} +`}
            className="h-9 w-9 shrink-0 cursor-pointer rounded-full border-[1.5px] border-hairline text-lg leading-none hover:border-ink"
          >
            +
          </button>
        </div>
      </Field>

      {/* Oversized on purpose: the handoff makes this the page's primary CTA and
          deliberately larger than a field-sized control, so it does not read as a fifth
          input. There is no second button beside it for the same reason. */}
      <button
        type="submit"
        className="cursor-pointer rounded-full bg-ink px-9 py-4 text-[15px] font-semibold text-white hover:bg-primary min-[900px]:py-4.5"
      >
        {t.search}
      </button>
    </form>
  );
}

const control =
  "w-full rounded-lg border-[1.5px] border-transparent bg-bg px-1 py-2 text-sm outline-none focus-visible:border-ink";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 px-2.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
