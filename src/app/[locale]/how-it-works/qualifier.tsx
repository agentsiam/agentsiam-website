"use client";

import Link from "next/link";
import { useState } from "react";
import type { Dictionary } from "@/i18n";

/**
 * The qualifier from the handoff: four questions, and a verdict card that changes tone and
 * colour with the answer.
 *
 * The verdicts are the point. Two of them are a real no -- condos have no route through the
 * non-hotel exemption, and a one-bed usually loses to a long-term tenant -- and softening
 * either into lead capture is the one change the handoff says breaks the product. A "no"
 * may offer a lower-commitment link; none of them pretends the answer was yes.
 *
 * Verdict logic and copy are the design's, unchanged. The question labels are translated;
 * the verdict bodies are not, and the page carries the pending-translation note for that.
 */

type Tone = "yes" | "no" | "maybe" | "neutral";

type Verdict = {
  kicker: string;
  title: string;
  body: string;
  tone: Tone;
  cta?: string;
};

const AREAS = [
  "Nimman",
  "Santitham",
  "Old City",
  "Chang Khlan",
  "Riverside",
  "Hang Dong",
  "Mae Rim",
  "San Sai",
] as const;

const OUTER_RING = ["Hang Dong", "Mae Rim", "San Sai"];
const THIN_DATA = ["Riverside"];

const TONE: Record<Tone, { panel: string; accent: string }> = {
  yes: { panel: "bg-wash-green border-teal/50", accent: "text-deep-green" },
  no: { panel: "bg-wash-red border-secondary/50", accent: "text-deep-red" },
  maybe: { panel: "bg-wash-gold border-sand/70", accent: "text-[#8a6a2f]" },
  neutral: { panel: "bg-surface border-hairline", accent: "text-muted" },
};

function verdictFor(
  type: string,
  beds: string,
  area: string,
  pool: string,
): Verdict {
  const outer = OUTER_RING.includes(area);
  const thin = THIN_DATA.includes(area);

  if (!type || !beds) {
    return {
      kicker: "Answer the questions",
      title: "We will give you a straight read.",
      body: "Property type and bedroom count move the answer more than anything else, so start there.",
      tone: "neutral",
    };
  }

  if (type === "Condo / apartment") {
    return {
      kicker: "Almost certainly not",
      title: "We do not take condominium units.",
      body: "The non-hotel exemption that makes short-let legal is available to landed property — houses, townhouses, small buildings — and not to condos. Most Thai condo buildings also prohibit stays under 30 days outright. We would rather say that now than take a study fee for it.",
      tone: "no",
    };
  }

  if (beds === "1") {
    return {
      kicker: "Probably a no",
      title: "A one-bedroom rarely beats a tenant.",
      body: "On the conservative case, a one-bed usually earns you less than a long-term let would, and it competes head-on against cheap condo rentals we cannot beat on cost. If yours is unusual — a design-led place, or an exceptional location — tell us and we will look properly.",
      tone: "no",
      cta: "Tell us why yours is different",
    };
  }

  if (beds === "2") {
    return {
      kicker: "This is the core fit",
      title: "A two-bed landed property is exactly what we look for.",
      body: `Two-bedroom stock is the clearest gap between what Chiang Mai lists and what guests actually book, and it serves both the long-stay remote worker and the cultural tourist — so the forecast does not rest on one kind of guest.${
        outer ? " Out in the ring you will want off-street parking to make it work." : ""
      }`,
      tone: "yes",
      cta: "Book a feasibility study",
    };
  }

  if (beds === "3") {
    if (pool === "Yes" && outer) {
      return {
        kicker: "Good fit, with a caveat",
        title: "A three-bed with a pool in the outer ring works.",
        body: "It clears the conservative case with a modest margin. Bookings are lumpier than in town, so the seasonality assumptions matter more here than anywhere — which is the part the study is for.",
        tone: "yes",
        cta: "Book a feasibility study",
      };
    }
    if (pool === "No") {
      return {
        kicker: "Likely a no",
        title: "A three-bed without a pool tends not to clear its own alternative.",
        body: `The nightly rate does not climb enough to cover the drop in occupancy, and the long-term let for a three-bed house is strong.${
          thin
            ? " Riverside also has thin comparable data, which widens the error bars considerably."
            : ""
        } We would need to see a real reason the rate would run high.`,
        tone: "no",
        cta: "Ask us to look anyway",
      };
    }
    return {
      kicker: "Depends on the pool",
      title: "For a three-bed, the pool is the deciding factor.",
      body: "With one, in the outer ring, it works. Without one it usually does not, because the rate does not rise enough to offset lower occupancy. Answer the pool question above.",
      tone: "neutral",
    };
  }

  return {
    kicker: "Conditional",
    title: "Four bedrooms and up is the highest-variance case we see.",
    body: "It has the strongest long-term rental alternative to beat, and thinner occupancy. It works when the property is genuinely design-led and can hold a premium rate — not when it is simply a large house. We will only quote it against real comparables.",
    tone: "maybe",
    cta: "Send us the details",
  };
}

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

export function Qualifier({ t, contactHref }: { t: Dictionary; contactHref: string }) {
  const [type, setType] = useState("");
  const [beds, setBeds] = useState("");
  const [area, setArea] = useState("");
  const [pool, setPool] = useState("");

  const verdict = verdictFor(type, beds, area, pool);
  const tone = TONE[verdict.tone];

  // English keys, translated labels: the value that drives the logic never changes with
  // the language, which is what keeps the verdicts language-independent.
  const types: [string, string][] = [
    ["House", t.typeHouse],
    ["Townhouse", t.typeTownhouse],
    ["Pool villa", t.typePoolVilla],
    ["Condo / apartment", t.typeCondoShort],
  ];
  const areaLabels: Record<string, string> = {
    Nimman: t.areaNimman,
    Santitham: t.areaSantitham,
    "Old City": t.areaOldCity,
    "Chang Khlan": t.areaChangKhlan,
    Riverside: t.areaRiverside,
    "Hang Dong": t.areaHangDong,
    "Mae Rim": t.areaMaeRim,
    "San Sai": t.areaSanSai,
  };

  return (
    <div className="mt-6.5 grid items-stretch gap-8 min-[900px]:grid-cols-[1fr_380px]">
      <div className="h-full rounded-panel border border-hairline p-6.5">
        <fieldset>
          <legend className="eyebrow">1 · What kind of property</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {types.map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                selected={type === value}
                onSelect={() => setType(value)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="eyebrow">2 · Bedrooms</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {["1", "2", "3", "4+"].map((value) => (
              <Chip
                key={value}
                label={`${value} ${t.bedSuffix}`}
                selected={beds === value}
                onSelect={() => setBeds(value)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="eyebrow">3 · Where in Chiang Mai</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {AREAS.map((value) => (
              <Chip
                key={value}
                label={areaLabels[value] ?? value}
                selected={area === value}
                onSelect={() => setArea(value)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="eyebrow">Does it have a private pool?</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["Yes", t.yes],
              ["No", t.no],
            ].map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                selected={pool === value}
                onSelect={() => setPool(value)}
              />
            ))}
          </div>
        </fieldset>
      </div>

      <div
        aria-live="polite"
        className={`flex h-full flex-col rounded-panel border-[1.5px] px-6.5 py-6 ${tone.panel}`}
      >
        <p className={`eyebrow ${tone.accent}`}>{verdict.kicker}</p>
        <p className="mt-2 font-display text-xl font-bold leading-tight tracking-[-0.015em]">
          {verdict.title}
        </p>
        <p className="mt-2.5 text-sm leading-relaxed text-body">{verdict.body}</p>

        {verdict.cta ? (
          <Link href={contactHref} className="pill-primary mt-4.5 self-start text-sm">
            {verdict.cta}
          </Link>
        ) : null}

        <p className="mt-auto pt-4 text-[11.5px] leading-normal text-muted">
          Indicative only. The study prices your property against real local comparables
          rather than a rule of thumb.
        </p>
      </div>
    </div>
  );
}
