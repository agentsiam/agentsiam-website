"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LineFollowPanel } from "./line-cta";
import type { Locale } from "@/i18n/config";
import { trackEvent } from "@/lib/analytics";
import { AREAS } from "@/lib/areas";
import { CONTACT_EMAIL, EMAIL_PATTERN } from "@/lib/site";
import {
  BEDROOM_MINIMUMS,
  BUDGET_UNITS,
  CONTACT_KINDS,
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
  type ContactKind,
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
 * the property pool. A select and eight choices are the whole fix.
 *
 * WHAT IS REQUIRED IS DELIBERATELY SHORT: a name, one way to reach them, the dates, and how
 * they found us. Everything else is offered and optional, and the answers that only some
 * renters have, pets, children, smoking, a vehicle, sit behind one disclosure rather than in
 * front of everyone. A form that asks a majority to read a minority's questions costs
 * conversion for nothing.
 *
 * THE LAYOUT IS THE SECOND DRAFT, and the first one is why these rules are written down.
 * It shipped as one undifferentiated column of thirty-two controls under twenty-four
 * shouted labels, led by four empty contact boxes that read as four required fields when
 * the rule is that any one of them will do.
 *
 *   One channel, chosen. A select naming the four channels and one field for the handle,
 *   which states the any-one-will-do rule in its shape instead of contradicting it. The
 *   handle still posts under that channel's own field name, so the endpoint and the record
 *   see exactly what they saw before.
 *
 *   Three sections with real headings, not one card, so a renter can see where they are.
 *
 *   A qualifier is a sentence, not a row. The reply language and the date flexibility read
 *   as "and answer me in English" under the thing they qualify, rather than taking a
 *   full-width labelled row each and shouting as loudly as the dates do.
 *
 *   A label only where a label earns it. The budget's unit and currency sit unlabelled
 *   beside the amount, because "PER" and "CURRENCY" as headings describe the database
 *   rather than the question.
 *
 *   Must-haves are chips. Eight checkboxes in two sparse columns looked unfinished and
 *   read as a list of demands.
 *
 * Labels arrive as props rather than the dictionary, because this is a client component and
 * serialising 700 keys to the browser so that forty can be read is what the home page and
 * the local guide were fixed for. `stayRequestLabels` in src/lib/stay-request-copy.ts
 * builds them.
 */

export type StayRequestLabels = {
  name: string;
  contactTitle: string;
  contactPick: string;
  contactKinds: Record<ContactKind, string>;
  contactExamples: Record<ContactKind, string>;
  contactMissing: string;
  emailIncomplete: string;
  replyLanguage: string;
  answerInline: string;
  languages: Record<Locale, string>;
  optional: string;
  sectionYou: string;
  sectionLooking: string;
  area: string;
  areaAny: string;
  checkIn: string;
  checkOut: string;
  flexLabel: string;
  datesInline: string;
  flexibility: Record<DateFlexibility, string>;
  guests: string;
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
  lineTitle: string;
  lineBody: string;
  lineCta: string;
  lineQrAlt: string;
  error: string;
  consent: string;
  privacy: string;
};

const field =
  "w-full rounded-lg border-[1.5px] border-hairline bg-bg px-3.5 py-3 text-sm outline-none focus-visible:border-ink";

/** The loud label, for a question that leads. Used sparingly on purpose. */
const label = "text-xs font-semibold uppercase tracking-[0.06em] text-muted";

/** The quiet one, for a field sitting under a question already asked. */
const labelQuiet = "text-[12.5px] text-muted";

/** A select inside a sentence rather than under a label of its own. */
/**
 * A qualifier's control: under the sentence it belongs to, and visibly narrower than the
 * fields it qualifies.
 *
 * It used to sit inside the sentence at 13px, which read well and stopped reading well the
 * day every control on a phone went to 16px to keep Safari from zooming the page. At that
 * size it out-sized the words around it and pushed the last of them onto a line of its own,
 * next to a control with a ragged right edge. The register is kept by the muted label above
 * it rather than by shrinking the control below what a thumb can use.
 */
const qualifierSelect =
  "w-full max-w-[220px] rounded-lg border-[1.5px] border-hairline bg-bg px-3 py-2 outline-none focus-visible:border-ink";

const sectionHeading = "font-display text-[17px] font-bold tracking-[-0.015em]";

function Optional({ word }: { word: string }) {
  return <span className="font-normal normal-case tracking-normal">({word})</span>;
}

/** The input type and autocomplete that belong to the channel they picked. The example
 * comes from the labels, because an empty box beside a chooser says nothing about what
 * shape the answer takes. */
const HANDLE_INPUT: Record<ContactKind, { type: string; autoComplete: string; pattern?: string }> = {
  email: { type: "email", autoComplete: "email", pattern: EMAIL_PATTERN },
  phone: { type: "tel", autoComplete: "tel" },
  WhatsApp: { type: "tel", autoComplete: "tel" },
  LINE: { type: "text", autoComplete: "off" },
};

/** A date as the date input writes it, in the reader's own day. */
function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dayAfter(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return isoDay(new Date(year, month - 1, day + 1));
}

/**
 * Arrive no earlier than today, leave at least a day after arriving. The endpoint already
 * refuses a leave date on or before the arrival, but the form could only answer that refusal
 * with "Sending failed, please email us", which reads as the site being broken. Constraints
 * on the inputs let the browser stop it at the field, in its own words and language, before
 * anything is sent. Set from the client, because "today" is the reader's and not the
 * server's.
 */
function syncDateLimits(form: HTMLFormElement) {
  const checkIn = form.elements.namedItem("checkIn") as HTMLInputElement | null;
  const checkOut = form.elements.namedItem("checkOut") as HTMLInputElement | null;
  if (!checkIn || !checkOut) return;
  const today = isoDay(new Date());
  checkIn.min = today;
  checkOut.min = dayAfter(checkIn.value || today);
}

export function StayRequestForm({
  labels,
  areas,
  defaultArea = "",
  defaultBedrooms = 2,
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
  /** The home's own bedroom count when the form sits on its page. Starting every form at
   * two meant a renter asking about a four-bedroom villa sent "2 bedrooms or more" unless
   * they changed it. */
  defaultBedrooms?: number;
  /** The bare route the form sits on, so the record says which page produced the lead. */
  page: string;
  /** The locale of the page they are reading, posted so the consent record can be stored in
   * the words they actually saw. */
  locale: Locale;
  /** The house's `unitKey()` (src/lib/property.ts) when the form sits on its page. Decides
   * the routing case, so a renter asking about one house is never treated as an open
   * requirement. */
  property?: string;
  propertyName?: string;
  privacyHref: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [contactKind, setContactKind] = useState<ContactKind>("email");
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState<Pets | "">("");
  const sentRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const prefilled = useRef(false);

  /* What the renter already told the search arrives with them. /properties carries `from`,
   * `to` and `guests` onto each property link, and its "Tell us what you need" links add
   * `area` and `beds`, so the request form at the foot of an enquiry-only home does not ask
   * again for dates they typed a page ago. Read from the address bar after mount rather
   * than from the server's searchParams, so the pages that host this form stay static. Only
   * an empty or default field is filled, and every value is checked against what the field
   * accepts: a hand-edited URL fills nothing rather than something wrong. */
  useEffect(() => {
    const form = formRef.current;
    // Once per mount, so a re-render never overwrites what the renter has since typed.
    if (!form || prefilled.current) return;
    prefilled.current = true;
    const query = new URLSearchParams(window.location.search);
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    const from = query.get("from") ?? "";
    const to = query.get("to") ?? "";
    const named = (name: string) =>
      form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null;

    if (isoDate.test(from) && isoDate.test(to) && to > from) {
      const checkIn = named("checkIn");
      const checkOut = named("checkOut");
      if (checkIn && checkOut && !checkIn.value && !checkOut.value) {
        checkIn.value = from;
        checkOut.value = to;
      }
    }

    const guests = Number(query.get("guests"));
    const adults = named("adults");
    if (adults && Number.isInteger(guests) && guests >= 1 && guests <= MAX_ADULTS) {
      adults.value = String(guests);
    }

    const beds = Number(query.get("beds"));
    const bedrooms = named("bedrooms");
    if (bedrooms && Number.isInteger(beds) && beds >= 1) {
      bedrooms.value = beds >= 5 ? "5+" : String(beds);
    }

    // The first area only: the form asks for one, the search allows several.
    const areaSlug = (query.get("area") ?? "").split(",")[0];
    const areaName = AREAS.find((item) => item.slug === areaSlug)?.name;
    const area = named("area");
    if (area && !area.value && areaName && areas.includes(areaName)) area.value = areaName;

    syncDateLimits(form);
  }, [areas]);

  useEffect(() => {
    if (status === "sent") sentRef.current?.focus();
  }, [status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("sending");

    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "");

    const handle = text("contactHandle").trim();
    if (!handle) {
      setError(labels.contactMissing);
      setStatus("idle");
      return;
    }

    // The handle is posted under its own channel's field name. The endpoint has always read
    // four separate fields and named the channel by whichever carried a value, so collapsing
    // the four boxes into a chooser is a change to the form and to nothing behind it.
    const channel = {
      email: contactKind === "email" ? handle : "",
      phone: contactKind === "phone" ? handle : "",
      whatsapp: contactKind === "WhatsApp" ? handle : "",
      line: contactKind === "LINE" ? handle : "",
    };

    const data = {
      name: text("name"),
      ...channel,
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
        <LineFollowPanel
          labels={{
            title: labels.lineTitle,
            body: labels.lineBody,
            cta: labels.lineCta,
            qrAlt: labels.lineQrAlt,
          }}
        />
      </div>
    );
  }

  const sending = status === "sending";
  const handle = HANDLE_INPUT[contactKind];

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="rounded-panel border border-hairline p-6 sm:p-7">
      {propertyName ? (
        <p className="mb-6 text-[14.5px] leading-relaxed text-body">
          {labels.aboutProperty.replace("{property}", propertyName)}
        </p>
      ) : null}

      {/* You and your dates */}
      <h3 className={sectionHeading}>{labels.sectionYou}</h3>

      <label className="mt-4 grid gap-1.5 text-sm">
        <span className={label}>{labels.name}</span>
        <input required name="name" autoComplete="name" maxLength={80} className={field} />
      </label>

      {/* One channel, chosen, rather than four empty boxes that read as four required
          fields. The handle's label, type and autocomplete follow the choice. */}
      <div className="mt-4">
        <span className={label}>{labels.contactTitle}</span>
        <div className="mt-1.5 grid gap-2.5 sm:grid-cols-[minmax(0,10rem)_1fr]">
          <select
            aria-label={labels.contactTitle}
            value={contactKind}
            onChange={(event) => setContactKind(event.target.value as ContactKind)}
            className={field}
          >
            {CONTACT_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {labels.contactKinds[kind]}
              </option>
            ))}
          </select>
          <input
            required
            key={contactKind}
            name="contactHandle"
            type={handle.type}
            autoComplete={handle.autoComplete}
            pattern={handle.pattern}
            // The browser's own words for a pattern miss are "match the requested format",
            // which names nothing. Only the email option carries a pattern.
            onInvalid={(event) => {
              const input = event.currentTarget;
              if (input.validity.patternMismatch || input.validity.typeMismatch) {
                input.setCustomValidity(labels.emailIncomplete);
              }
            }}
            onInput={(event) => event.currentTarget.setCustomValidity("")}
            aria-label={labels.contactKinds[contactKind]}
            placeholder={labels.contactExamples[contactKind]}
            maxLength={160}
            className={field}
          />
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
          {labels.contactPick}
        </p>
        <label className="mt-2.5 grid min-w-0 gap-1 text-[12.5px] text-muted">
          <span>{labels.answerInline}</span>
          <select
            name="replyLanguage"
            aria-label={labels.replyLanguage}
            defaultValue={locale}
            className={qualifierSelect}
          >
            {(Object.keys(labels.languages) as Locale[]).map((code) => (
              <option key={code} value={code}>
                {labels.languages[code]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
        <label className="grid min-w-0 gap-1.5 text-sm">
          <span className={label}>{labels.checkIn}</span>
          <input
            required
            type="date"
            name="checkIn"
            className={field}
            onChange={(event) => {
              if (event.currentTarget.form) syncDateLimits(event.currentTarget.form);
            }}
          />
        </label>
        <label className="grid min-w-0 gap-1.5 text-sm">
          <span className={label}>{labels.checkOut}</span>
          <input required type="date" name="checkOut" className={field} />
        </label>
      </div>

      {/* A qualifier sits under the thing it qualifies, quieter than it. */}
      <label className="mt-2.5 grid min-w-0 gap-1 text-[12.5px] text-muted">
        <span>{labels.datesInline}</span>
        <select
          name="flexibility"
          aria-label={labels.flexLabel}
          defaultValue="exact"
          className={qualifierSelect}
        >
          {DATE_FLEXIBILITY.map((value) => (
            <option key={value} value={value}>
              {labels.flexibility[value]}
            </option>
          ))}
        </select>
      </label>

      {/* What you are looking for */}
      <h3 className={`${sectionHeading} mt-8 border-t border-hairline pt-7`}>
        {labels.sectionLooking}
      </h3>

      <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
        <label className="grid min-w-0 gap-1.5 text-sm">
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
        <label className="grid min-w-0 gap-1.5 text-sm">
          <span className={label}>{labels.bedroomsMin}</span>
          <select
            name="bedrooms"
            defaultValue={defaultBedrooms >= 5 ? "5+" : String(Math.max(1, defaultBedrooms))}
            className={field}
          >
            {BEDROOM_MINIMUMS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4">
        <span className={label}>{labels.guests}</span>
        <div className="mt-1.5 grid gap-3.5 sm:grid-cols-3">
          <label className="grid min-w-0 gap-1 text-sm">
            <span className={labelQuiet}>{labels.adults}</span>
            <input
              type="number"
              name="adults"
              defaultValue={2}
              min={1}
              max={MAX_ADULTS}
              className={field}
            />
          </label>
          <label className="grid min-w-0 gap-1 text-sm">
            <span className={labelQuiet}>{labels.children}</span>
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
            <label className="grid min-w-0 gap-1 text-sm">
              <span className={labelQuiet}>{labels.childrenAges}</span>
              <input
                name="childrenAges"
                maxLength={60}
                className={field}
                placeholder={labels.childrenAgesHint}
              />
            </label>
          ) : null}
        </div>
      </div>

      {/* A budget with no unit is the most common unusable answer in the lead file, so the
          unit and the currency sit beside the number. Unlabelled: "PER" and "CURRENCY" as
          headings describe the database rather than the question. */}
      <div className="mt-4">
        <span className={label}>
          {labels.budget} <Optional word={labels.optional} />
        </span>
        <div className="mt-1.5 grid gap-2.5 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="number"
            name="budgetAmount"
            min={1}
            className={field}
            placeholder={labels.budgetHint}
          />
          <select
            name="budgetUnit"
            aria-label={labels.budgetUnit}
            defaultValue="per month"
            className={field}
          >
            {BUDGET_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {labels.budgetUnits[unit]}
              </option>
            ))}
          </select>
          <select
            name="budgetCurrency"
            aria-label={labels.budgetCurrency}
            defaultValue="THB"
            className={field}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chips rather than two sparse columns of checkboxes. The input stays a real
          checkbox behind the chip, so the keyboard and the screen reader are unaffected. */}
      <fieldset className="mt-5">
        <legend className={label}>
          {labels.mustHavesTitle} <Optional word={labels.optional} />
        </legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {MUST_HAVES.map((want) => (
            <label key={want} className="cursor-pointer">
              <input type="checkbox" name="mustHaves" value={want} className="peer sr-only" />
              <span className="inline-block rounded-full border-[1.5px] border-hairline px-3.5 py-2 text-[13.5px] text-body peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:border-ink peer-focus-visible:ring-2 peer-focus-visible:ring-ink/30">
                {labels.mustHaves[want]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* The answers only some renters have. Behind a disclosure so the majority is not
          asked to read a minority's questions, which is the house rule on minority-case
          copy applied to a form. */}
      <details className="group mt-5 border-t border-hairline pt-5">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-[14.5px] font-semibold">
          <span
            aria-hidden="true"
            className="inline-block text-muted transition-transform group-open:rotate-90"
          >
            &rsaquo;
          </span>
          {labels.moreTitle}
        </summary>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{labels.moreHint}</p>

        <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
          <label className="grid min-w-0 gap-1.5 text-sm">
            <span className={labelQuiet}>{labels.partyLabel}</span>
            <select name="party" defaultValue="" className={field}>
              <option value="">{labels.notSaid}</option>
              {PARTY.map((who) => (
                <option key={who} value={who}>
                  {labels.party[who]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid min-w-0 gap-1.5 text-sm">
            <span className={labelQuiet}>{labels.vehicle}</span>
            <select name="vehicle" defaultValue="" className={field}>
              <option value="">{labels.notSaid}</option>
              <option value="no">{labels.no}</option>
              <option value="yes">{labels.yes}</option>
            </select>
          </label>
          <label className="grid min-w-0 gap-1.5 text-sm">
            <span className={labelQuiet}>{labels.petsLabel}</span>
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
            <label className="grid min-w-0 gap-1.5 text-sm">
              <span className={labelQuiet}>{labels.petsCount}</span>
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
            <label className="grid min-w-0 gap-1.5 text-sm">
              <span className={labelQuiet}>{labels.petsSpecies}</span>
              <input name="petsSpecies" maxLength={40} className={field} />
            </label>
          ) : null}
          <label className="grid min-w-0 gap-1.5 text-sm">
            <span className={labelQuiet}>{labels.smokingLabel}</span>
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
          <span className={labelQuiet}>{labels.notes}</span>
          <textarea
            name="message"
            rows={3}
            maxLength={4000}
            className={`${field} resize-y`}
            placeholder={labels.notesHint}
          />
        </label>
      </details>

      {/* The last question, the consent, then send. */}
      <label className="mt-8 grid gap-1.5 border-t border-hairline pt-7 text-sm">
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
          renter is still answered, out of what AgentSiam runs itself. It sits in a panel of
          its own because it was three lines of small print crowding the send button, which
          is the one place on the form where nothing should read as fine print. */}
      <div className="mt-5 rounded-box bg-surface p-4">
        <label className="flex cursor-pointer items-start gap-2.5 text-[14.5px] text-body">
          <input
            type="checkbox"
            name="consentOwner"
            value="yes"
            className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
          />
          <span>{labels.consentOwner}</span>
        </label>
        <p className="mt-2 pl-7 text-[12.5px] leading-relaxed text-muted">
          {labels.consentOwnerHint}
        </p>
      </div>

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
        className="mt-5 w-full cursor-pointer rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-primary disabled:cursor-not-allowed disabled:bg-muted/40"
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
