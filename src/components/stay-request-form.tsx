"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { trackEvent } from "@/lib/analytics";
import { CONTACT_EMAIL } from "@/lib/site";
import {
  BEDROOM_MINIMUMS,
  BUDGET_UNITS,
  CURRENCIES,
  DATE_FLEXIBILITY,
  MAX_ADULTS,
  MAX_CHILDREN,
  MAX_PETS,
  MUST_HAVES,
  PARTY,
  PETS,
  SMOKING,
  type BudgetUnit,
  type DateFlexibility,
  type MustHave,
  type Party,
  type Pets,
  type Smoking,
} from "@/lib/stay-request";

/**
 * The renter request form: the monthly-stay page, and every property page that is listed
 * for enquiry rather than bookable.
 *
 * It asks in fixed choices what renters are already telling us in prose. The lead file
 * carries "about 2026-12-21 (start flexible)" in a dates cell and a paragraph of must-haves
 * inside a requirements cell, which is information given and then made unmatchable against
 * the property pool. A select and eight checkboxes are the whole fix.
 *
 * WHAT IS REQUIRED IS DELIBERATELY SHORT: a name, one way to reach them, the dates, and how
 * they found us. Everything else is offered and optional, and the answers that only some
 * renters have, pets, children, smoking, a vehicle, sit behind one disclosure rather than in
 * front of everyone. A form that asks a majority to read a minority's questions costs
 * conversion for nothing.
 *
 * Email is no longer required, one named channel is. Thai and Chinese renters often use LINE
 * and nothing else, and an email field with a red asterisk is where that renter leaves.
 *
 * Labels arrive as props rather than the dictionary, because this is a client component and
 * serialising 700 keys to the browser so that forty can be read is what the home page and
 * the local guide were fixed for. `stayRequestLabels` in src/lib/stay-request-copy.ts
 * builds them.
 */

export type StayRequestLabels = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  line: string;
  contactTitle: string;
  contactHint: string;
  contactMissing: string;
  replyLanguage: string;
  languages: Record<Locale, string>;
  optional: string;
  area: string;
  areaAny: string;
  checkIn: string;
  checkOut: string;
  flexLabel: string;
  flexibility: Record<DateFlexibility, string>;
  adults: string;
  children: string;
  childrenAges: string;
  childrenAgesHint: string;
  bedroomsMin: string;
  budget: string;
  budgetHint: string;
  budgetUnit: string;
  budgetUnits: Record<BudgetUnit, string>;
  budgetCurrency: string;
  mustHavesTitle: string;
  mustHaves: Record<MustHave, string>;
  moreTitle: string;
  moreHint: string;
  partyLabel: string;
  party: Record<Party, string>;
  vehicle: string;
  yes: string;
  no: string;
  petsLabel: string;
  pets: Record<Pets, string>;
  petsCount: string;
  petsSpecies: string;
  smokingLabel: string;
  smoking: Record<Smoking, string>;
  notSaid: string;
  notes: string;
  notesHint: string;
  foundVia: string;
  foundViaHint: string;
  required: string;
  consentOwner: string;
  consentOwnerHint: string;
  aboutProperty: string;
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

const legend = "text-xs font-semibold uppercase tracking-[0.06em] text-muted";

function Optional({ word }: { word: string }) {
  return <span className="font-normal normal-case tracking-normal">({word})</span>;
}

export function StayRequestForm({
  labels,
  areas,
  defaultArea = "",
  page,
  locale,
  property = "",
  propertyName = "",
  privacyHref,
}: {
  labels: StayRequestLabels;
  /** English area names. The value is what reaches the record, and the record is kept in
   * English because the CRM files are. */
  areas: string[];
  defaultArea?: string;
  /** The bare route the form sits on, so the record says which page produced the lead. */
  page: string;
  /** The locale of the page they are reading, posted so the consent record can be stored in
   * the words they actually saw. */
  locale: Locale;
  /** A property's route slug when the form sits on its page. Decides the routing case, so a
   * renter asking about one house is never treated as an open requirement. */
  property?: string;
  propertyName?: string;
  privacyHref: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState<Pets | "">("");
  const sentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "sent") sentRef.current?.focus();
  }, [status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("sending");

    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "");

    // The one rule no HTML attribute can carry: at least one of four, none of them required
    // on its own. Checked here as well as on the server, because the generic failure message
    // points at the mailbox and that is no help to someone who just gave us their LINE ID
    // and typed nothing else.
    if (!["email", "phone", "whatsapp", "line"].some((key) => text(key).trim())) {
      setError(labels.contactMissing);
      setStatus("idle");
      return;
    }

    const data = {
      name: text("name"),
      email: text("email"),
      phone: text("phone"),
      whatsapp: text("whatsapp"),
      line: text("line"),
      replyLanguage: text("replyLanguage"),
      checkIn: text("checkIn"),
      checkOut: text("checkOut"),
      flexibility: text("flexibility"),
      adults: text("adults"),
      children: text("children"),
      childrenAges: text("childrenAges"),
      area: text("area"),
      bedrooms: text("bedrooms"),
      budgetAmount: text("budgetAmount"),
      budgetUnit: text("budgetUnit"),
      budgetCurrency: text("budgetCurrency"),
      // getAll, because every ticked box posts under the same name and
      // Object.fromEntries would keep one of them.
      mustHaves: form.getAll("mustHaves").map(String),
      party: text("party"),
      vehicle: text("vehicle"),
      pets: text("pets"),
      petsCount: text("petsCount"),
      petsSpecies: text("petsSpecies"),
      smoking: text("smoking"),
      message: text("message"),
      foundVia: text("foundVia"),
      consentOwner: form.get("consentOwner") === "yes",
      company: text("company"),
      page,
      locale,
      property,
    };

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
      {propertyName ? (
        <p className="mb-5 text-[14.5px] leading-relaxed text-body">
          {labels.aboutProperty.replace("{property}", propertyName)}
        </p>
      ) : null}

      <label className="grid gap-1.5 text-sm">
        <span className={label}>{labels.name}</span>
        <input required name="name" autoComplete="name" maxLength={80} className={field} />
      </label>

      {/* One named channel, not four optional ones: the hint says at least one, and the
          server refuses a submission with none. */}
      <fieldset className="mt-5">
        <legend className={legend}>{labels.contactTitle}</legend>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{labels.contactHint}</p>
        <div className="mt-3 grid gap-3.5 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            <span className={label}>{labels.email}</span>
            <input type="email" name="email" autoComplete="email" maxLength={160} className={field} />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className={label}>{labels.phone}</span>
            <input name="phone" autoComplete="tel" maxLength={60} className={field} />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className={label}>{labels.whatsapp}</span>
            <input name="whatsapp" maxLength={60} className={field} />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className={label}>{labels.line}</span>
            <input name="line" maxLength={60} className={field} />
          </label>
        </div>
      </fieldset>

      <label className="mt-3.5 grid gap-1.5 text-sm">
        <span className={label}>{labels.replyLanguage}</span>
        <select name="replyLanguage" defaultValue={locale} className={field}>
          {(Object.keys(labels.languages) as Locale[]).map((code) => (
            <option key={code} value={code}>
              {labels.languages[code]}
            </option>
          ))}
        </select>
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

      <label className="mt-3.5 grid gap-1.5 text-sm">
        <span className={label}>{labels.flexLabel}</span>
        <select name="flexibility" defaultValue="exact" className={field}>
          {DATE_FLEXIBILITY.map((value) => (
            <option key={value} value={value}>
              {labels.flexibility[value]}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-3.5 grid gap-3.5 sm:grid-cols-3">
        <label className="grid gap-1.5 text-sm">
          <span className={label}>{labels.adults}</span>
          <input
            type="number"
            name="adults"
            defaultValue={2}
            min={1}
            max={MAX_ADULTS}
            className={field}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className={label}>{labels.children}</span>
          <input
            type="number"
            name="children"
            defaultValue={0}
            min={0}
            max={MAX_CHILDREN}
            className={field}
            onChange={(event) => setChildren(Number(event.target.value) || 0)}
          />
        </label>
        {children > 0 ? (
          <label className="grid gap-1.5 text-sm">
            <span className={label}>{labels.childrenAges}</span>
            <input
              name="childrenAges"
              maxLength={60}
              className={field}
              placeholder={labels.childrenAgesHint}
            />
          </label>
        ) : null}
      </div>

      <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
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
          <span className={label}>{labels.bedroomsMin}</span>
          <select name="bedrooms" defaultValue="2" className={field}>
            {BEDROOM_MINIMUMS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* A budget with no unit is the most common unusable answer in the lead file, so the
          unit and the currency are asked beside the number rather than guessed from it. */}
      <div className="mt-3.5 grid gap-3.5 sm:grid-cols-3">
        <label className="grid gap-1.5 text-sm">
          <span className={label}>
            {labels.budget} <Optional word={labels.optional} />
          </span>
          {/* No `step`. With min={1} a step of 100 makes every round number invalid, so a
              renter typing 30000 was stopped by the browser saying the nearest valid values
              were 29901 and 30001, and the form did not submit at all. */}
          <input
            type="number"
            name="budgetAmount"
            min={1}
            className={field}
            placeholder={labels.budgetHint}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className={label}>{labels.budgetUnit}</span>
          <select name="budgetUnit" defaultValue="per month" className={field}>
            {BUDGET_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {labels.budgetUnits[unit]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className={label}>{labels.budgetCurrency}</span>
          <select name="budgetCurrency" defaultValue="THB" className={field}>
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="mt-5">
        <legend className={legend}>
          {labels.mustHavesTitle} <Optional word={labels.optional} />
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {MUST_HAVES.map((want) => (
            <label key={want} className="flex items-start gap-2.5 text-[14.5px] text-body">
              <input
                type="checkbox"
                name="mustHaves"
                value={want}
                className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
              />
              <span>{labels.mustHaves[want]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* The answers only some renters have. Behind a disclosure so the majority is not
          asked to read a minority's questions, which is the house rule on minority-case
          copy applied to a form. */}
      <details className="mt-5 rounded-box border border-hairline px-4 py-3">
        <summary className="cursor-pointer text-[14.5px] font-semibold">
          {labels.moreTitle}
        </summary>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{labels.moreHint}</p>

        <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            <span className={label}>{labels.partyLabel}</span>
            <select name="party" defaultValue="" className={field}>
              <option value="">{labels.notSaid}</option>
              {PARTY.map((who) => (
                <option key={who} value={who}>
                  {labels.party[who]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className={label}>{labels.vehicle}</span>
            <select name="vehicle" defaultValue="" className={field}>
              <option value="">{labels.notSaid}</option>
              <option value="no">{labels.no}</option>
              <option value="yes">{labels.yes}</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className={label}>{labels.petsLabel}</span>
            <select
              name="pets"
              value={pets}
              className={field}
              onChange={(event) => setPets(event.target.value as Pets | "")}
            >
              <option value="">{labels.notSaid}</option>
              {PETS.map((kind) => (
                <option key={kind} value={kind}>
                  {labels.pets[kind]}
                </option>
              ))}
            </select>
          </label>
          {pets !== "" && pets !== "none" ? (
            <label className="grid gap-1.5 text-sm">
              <span className={label}>{labels.petsCount}</span>
              <input
                type="number"
                name="petsCount"
                defaultValue={1}
                min={1}
                max={MAX_PETS}
                className={field}
              />
            </label>
          ) : null}
          {pets === "other" ? (
            <label className="grid gap-1.5 text-sm">
              <span className={label}>{labels.petsSpecies}</span>
              <input name="petsSpecies" maxLength={40} className={field} />
            </label>
          ) : null}
          <label className="grid gap-1.5 text-sm">
            <span className={label}>{labels.smokingLabel}</span>
            <select name="smoking" defaultValue="" className={field}>
              <option value="">{labels.notSaid}</option>
              {SMOKING.map((value) => (
                <option key={value} value={value}>
                  {labels.smoking[value]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-3.5 grid gap-1.5 text-sm">
          <span className={label}>{labels.notes}</span>
          <textarea
            name="message"
            rows={3}
            maxLength={4000}
            className={`${field} resize-y`}
            placeholder={labels.notesHint}
          />
        </label>
      </details>

      <label className="mt-5 grid gap-1.5 text-sm">
        <span className={label}>
          {labels.foundVia} <Optional word={labels.required} />
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

      {/* Opt-in, not a gate. An unticked box is a real answer and is recorded as one: the
          renter is still answered, out of what AgentSiam runs itself. */}
      <label className="mt-5 flex items-start gap-2.5 text-[14.5px] text-body">
        <input
          type="checkbox"
          name="consentOwner"
          value="yes"
          className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
        />
        <span>
          {labels.consentOwner}
          <span className="mt-1 block text-[12.5px] leading-relaxed text-muted">
            {labels.consentOwnerHint}
          </span>
        </span>
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
