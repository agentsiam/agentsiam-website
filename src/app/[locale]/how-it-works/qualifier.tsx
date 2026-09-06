"use client";

import Link from "next/link";
import { useState } from "react";
import type { Dictionary } from "@/i18n";

/**
 * The qualifier from the handoff: four questions, and a verdict card that changes tone and
 * colour with the answer.
 *
 * The verdicts are the point. A real no stays a real no -- a one-bed usually loses to a
 * long-term tenant -- and softening one into lead capture is the one change the handoff says
 * breaks the product. A "no" may offer a lower-commitment link; none of them pretends the
 * answer was yes.
 *
 * The condo verdict is deliberately conditional rather than a no. Condos went into scope on
 * 20/08/2026 with a precondition: the building's juristic person must permit short stays in
 * writing, and that has to be on file before anything is signed. The exemption reasoning in
 * the old copy was correct and is kept -- it just does not decide the answer, the building
 * does. An unconfirmed condo is still treated as excluded; the verdict says so without
 * closing the door on a building that does permit it.
 *
 * Verdict logic is the design's, unchanged. The copy is the design's too, and every string
 * in it -- the four legends, all eight verdicts and the indicative-pricing footnote -- now
 * reads from the dictionary. A Thai owner used to answer translated chips inside English
 * questions and be handed an English verdict; the verdict is chosen by the English value
 * behind the chip, not by its label, so the logic stays language-independent.
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
  maybe: { panel: "bg-wash-gold border-sand/70", accent: "text-deep-gold" },
  neutral: { panel: "bg-surface border-hairline", accent: "text-muted" },
};

function verdictFor(
  t: Dictionary,
  type: string,
  beds: string,
  area: string,
  pool: string,
): Verdict {
  const outer = OUTER_RING.includes(area);
  const thin = THIN_DATA.includes(area);

  if (!type || !beds) {
    return {
      kicker: t.hwVEmptyKicker,
      title: t.hwVEmptyTitle,
      body: t.hwVEmptyBody,
      tone: "neutral",
    };
  }

  if (type === "Condo / apartment") {
    return {
      kicker: t.hwVCondoKicker,
      title: t.hwVCondoTitle,
      body: t.hwVCondoBody,
      tone: "maybe",
      cta: t.hwVCondoCta,
    };
  }

  if (beds === "1") {
    return {
      kicker: t.hwV1Kicker,
      title: t.hwV1Title,
      body: t.hwV1Body,
      tone: "no",
      cta: t.hwV1Cta,
    };
  }

  if (beds === "2") {
    return {
      kicker: t.hwV2Kicker,
      title: t.hwV2Title,
      // The outer-ring clause carries its own leading separator per language, so Chinese
      // does not gain a stray space where Thai and English need one.
      body: `${t.hwV2Body}${outer ? t.hwV2Outer : ""}`,
      tone: "yes",
      cta: t.bookStudy,
    };
  }

  if (beds === "3") {
    if (pool === "Yes" && outer) {
      return {
        kicker: t.hwV3PoolKicker,
        title: t.hwV3PoolTitle,
        body: t.hwV3PoolBody,
        tone: "yes",
        cta: t.bookStudy,
      };
    }
    if (pool === "No") {
      return {
        kicker: t.hwV3NoPoolKicker,
        title: t.hwV3NoPoolTitle,
        body: `${t.hwV3NoPoolBody}${thin ? t.hwV3ThinData : ""}${t.hwV3NoPoolTail}`,
        tone: "no",
        cta: t.hwV3NoPoolCta,
      };
    }
    return {
      kicker: t.hwV3AskPoolKicker,
      title: t.hwV3AskPoolTitle,
      body: t.hwV3AskPoolBody,
      tone: "neutral",
    };
  }

  return {
    kicker: t.hwV4Kicker,
    title: t.hwV4Title,
    body: t.hwV4Body,
    tone: "maybe",
    cta: t.hwV4Cta,
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

  const verdict = verdictFor(t, type, beds, area, pool);
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
          <legend className="eyebrow">{t.hwQ1Legend}</legend>
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
          <legend className="eyebrow">{t.hwQ2Legend}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {["1", "2", "3", "4+"].map((value) => (
              <Chip
                key={value}
                label={t.bedSuffix.replace("{n}", value)}
                selected={beds === value}
                onSelect={() => setBeds(value)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="eyebrow">{t.hwQ3Legend}</legend>
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
          <legend className="eyebrow">{t.hwQ4Legend}</legend>
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
          {t.hwQualifierFoot}
        </p>
      </div>
    </div>
  );
}
