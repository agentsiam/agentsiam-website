/**
 * Putting a renter's requirement to the owners in the property pool, by hand.
 *
 * Stage 1 of the design in agentsiam-consulting, as-work/2026-11-22-owner-delivery/: a person
 * sends every message, from their own LINE, Facebook or email, and the admin prepares the
 * message and records what was done. Nothing here sends anything.
 *
 * Three rules from the record shape it. Decision 92: the owner is shown the requirement, and
 * the renter's name and contact cross only once that owner has accepted the introduction
 * terms, never waived. Decision 94: an open requirement is put to every matching property at
 * once, and "matching" means the required fields of the inquiry form. And the fee is read
 * from the price book at the moment the message is written, never restated here.
 *
 * Pure functions only, so the page and the API can share them and a test can call them.
 */

import { getDictionary } from "@/i18n";
import { stayRequestLabels } from "@/lib/stay-request-copy";
import type { Candidate, Inquiry, Lead, PoolProperty } from "./types";

export type OwnerLanguage = "th" | "en";

/* ---------------------------------------------------------------------------------------
 * The fee, from the price book.
 * ------------------------------------------------------------------------------------- */

export type IntroductionFee = { ratePct: number; cap: string };

/**
 * `rate_pct` and `cap` from the `renter_introduction` block of price-book.md, and only while
 * that block says `status: agreed`. Null otherwise, and the screen then says the fee could
 * not be read rather than writing a message without it or with a remembered figure.
 */
export function introductionFee(priceBook: string): IntroductionFee | null {
  const start = priceBook.search(/^\s{2}renter_introduction:\s*$/m);
  if (start < 0) return null;
  const rest = priceBook.slice(start);
  const lines = rest.split("\n");
  const block: string[] = [lines[0]];
  for (const line of lines.slice(1)) {
    // The next sibling key at the same indent ends the block.
    if (/^\s{2}[a-z_]+:\s*$/.test(line)) break;
    block.push(line);
  }
  const text = block.join("\n");
  const field = (name: string) =>
    text.match(new RegExp(`^\\s{4}${name}:\\s*(.+?)\\s*(?:#.*)?$`, "m"))?.[1] ?? "";
  if (field("status") !== "agreed") return null;
  const ratePct = Number(field("rate_pct"));
  const cap = field("cap");
  if (!Number.isFinite(ratePct) || ratePct <= 0 || !cap) return null;
  return { ratePct, cap };
}

/** The cap in Thai, for the one value the price book uses today. Any other wording is left
 * in English and flagged on screen, because a fee cap is not something to machine-translate. */
const CAP_IN_THAI: Record<string, string> = { "one month's rent": "ค่าเช่าหนึ่งเดือน" };

/* ---------------------------------------------------------------------------------------
 * What the renter asked for, from the inquiry record when there is one.
 * ------------------------------------------------------------------------------------- */

/**
 * A requirement in one shape whether it came through the form or was typed into the lead
 * row by hand. A hand-entered lead has no inquiry record, so most fields are blank, its
 * dates are whatever the row says, and it has no consent on record.
 */
export type Requirement = {
  fromForm: boolean;
  checkIn: string;
  checkOut: string;
  nights: string;
  datesAsTyped: string;
  flexibility: string;
  adults: number | null;
  children: number;
  guestsAsTyped: string;
  area: string;
  bedroomsMinimum: string;
  pets: string;
  petsCount: number | null;
  petsSpecies: string;
  smoking: string;
  mustHaves: string[];
  replyLanguage: string;
  consent: "yes" | "no" | "not recorded";
  repeatOf: string;
};

export function requirementOf(lead: Lead, inquiry: Inquiry | null): Requirement {
  if (!inquiry) {
    return {
      fromForm: false,
      checkIn: "",
      checkOut: "",
      nights: lead.nights,
      datesAsTyped: lead.dates_requested,
      flexibility: "",
      adults: null,
      children: 0,
      guestsAsTyped: lead.guests,
      area: lead.area_wanted,
      bedroomsMinimum: "",
      pets: "",
      petsCount: null,
      petsSpecies: "",
      smoking: "",
      mustHaves: [],
      replyLanguage: "",
      consent: "not recorded",
      repeatOf: "",
    };
  }
  return {
    fromForm: true,
    checkIn: inquiry.check_in,
    checkOut: inquiry.check_out,
    nights: String(inquiry.nights),
    datesAsTyped: "",
    flexibility: inquiry.date_flexibility,
    adults: inquiry.adults,
    children: inquiry.children,
    guestsAsTyped: "",
    area: inquiry.area_wanted,
    bedroomsMinimum: inquiry.bedrooms_minimum,
    pets: inquiry.pets,
    petsCount: inquiry.pets_count,
    petsSpecies: inquiry.pets_species,
    smoking: inquiry.smoking,
    mustHaves: inquiry.must_haves,
    replyLanguage: inquiry.reply_language,
    consent: inquiry.consent_to_pass_to_owner === "yes" ? "yes" : "no",
    repeatOf: inquiry.repeat_of ?? "",
  };
}

/* ---------------------------------------------------------------------------------------
 * Matching the pool against the requirement.
 * ------------------------------------------------------------------------------------- */

export type PoolMatch = {
  property: PoolProperty;
  /** Why it fits and why it may not, in words, for the person deciding whether to ask. */
  fits: string[];
  misses: string[];
  /** The candidate on this lead's shortlist that is this property, if there is one. */
  candidate: Candidate | null;
  termsAgreed: boolean;
  /** Earlier leads, from a repeat, where this property was already asked. */
  askedForEarlier: { leadId: string; askedOn: string }[];
};

function firstNumber(value: string): number | null {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function sameArea(wanted: string, theirs: string): boolean {
  const a = wanted.trim().toLowerCase();
  const b = theirs.trim().toLowerCase();
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

/**
 * Every pool property, sorted fits first, each with its reasons.
 *
 * Only the two required fields a pool row can be checked against decide a fit: the area,
 * where "Any" fits everything, and the bedroom minimum. Dates cannot be checked, because
 * availability is what asking the owner finds out. Nothing is hidden: a property that misses
 * on bedrooms is still listed under the ones that fit, because the pool is seven rows and the
 * person asking knows things the row does not.
 */
export function matchPool(
  requirement: Requirement,
  properties: PoolProperty[],
  shortlist: Candidate[],
  earlier: { leadId: string; candidates: Candidate[] }[],
): PoolMatch[] {
  const matches = properties.map((property): PoolMatch => {
    const fits: string[] = [];
    const misses: string[] = [];

    const area = requirement.area.trim();
    if (!area || area.toLowerCase() === "any") fits.push("any area is fine");
    else if (sameArea(area, property.area)) fits.push(`in ${property.area}`);
    else misses.push(`in ${property.area || "an area not recorded"}, asked for ${area}`);

    const minimum = firstNumber(requirement.bedroomsMinimum);
    const theirs = firstNumber(property.bedrooms);
    if (minimum === null) {
      // A hand-entered lead, or none given: nothing to check.
    } else if (theirs === null) misses.push("bedrooms not recorded");
    else if (theirs >= minimum) fits.push(`${theirs} ${theirs === 1 ? "bedroom" : "bedrooms"}`);
    else {
      misses.push(
        `${theirs} ${theirs === 1 ? "bedroom" : "bedrooms"}, asked for ${requirement.bedroomsMinimum}`,
      );
    }

    if (/^not available/i.test(property.status.trim())) {
      misses.push(`pool status: ${property.status}`);
    }

    const candidate =
      shortlist.find((entry) => entry.property_id === property.property_id) ?? null;

    const askedForEarlier = earlier.flatMap(({ leadId, candidates }) =>
      candidates
        .filter((entry) => entry.property_id === property.property_id && entry.asked_on)
        .map((entry) => ({ leadId, askedOn: entry.asked_on })),
    );

    return {
      property,
      fits,
      misses,
      candidate,
      termsAgreed: property.g2_terms_agreed.trim().toLowerCase() === "yes",
      askedForEarlier,
    };
  });

  return matches.sort((a, b) => a.misses.length - b.misses.length);
}

/* ---------------------------------------------------------------------------------------
 * The two messages.
 * ------------------------------------------------------------------------------------- */

/** DD/MM/YYYY, the form dates are written in to a person. */
function dmy(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

const SIGN_OFF = "AgentSiam, www.agentsiam.com, hi@agentsiam.com";

/**
 * The first message: the requirement, the question, and the fee for an owner who has not
 * accepted the terms. It carries no name, no handle and no budget. The budget is left out on
 * purpose (opinion, not a recorded rule): an owner asked "what would the total be" and told
 * the renter's ceiling answers with the ceiling.
 */
export function askOwnerMessage(
  requirement: Requirement,
  propertyName: string,
  fee: IntroductionFee | null,
  termsAgreed: boolean,
  language: OwnerLanguage,
): string {
  const labels = stayRequestLabels(getDictionary(language));
  const lines: string[] = [];
  const th = language === "th";
  // The form's labels are written to start a line on screen. Inside a sentence the English
  // ones read better lower case; Thai has no case.
  const inline = (label: string) => (th ? label : label.charAt(0).toLowerCase() + label.slice(1));

  lines.push(th ? `เรียน เจ้าของ ${propertyName}` : `Hello, about ${propertyName}.`);
  lines.push(
    th
      ? `AgentSiam (www.agentsiam.com) มีผู้เช่าที่กำลังหาที่พัก และเราคิดว่า ${propertyName} อาจเหมาะ`
      : `AgentSiam (www.agentsiam.com) has a renter looking for a home, and we think ${propertyName} may suit them.`,
  );
  lines.push("");

  // Dates.
  if (requirement.checkIn && requirement.checkOut) {
    const flex =
      requirement.flexibility && requirement.flexibility !== "exact"
        ? ` (${inline(labels.flexibility[requirement.flexibility as keyof typeof labels.flexibility] ?? requirement.flexibility)})`
        : "";
    lines.push(
      th
        ? `- วันที่: ${dmy(requirement.checkIn)} ถึง ${dmy(requirement.checkOut)} (${requirement.nights} คืน)${flex}`
        : `- Dates: ${dmy(requirement.checkIn)} to ${dmy(requirement.checkOut)} (${requirement.nights} nights)${flex}`,
    );
  } else if (requirement.datesAsTyped) {
    lines.push(th ? `- วันที่: ${requirement.datesAsTyped}` : `- Dates: ${requirement.datesAsTyped}`);
  }

  // Guests.
  if (requirement.adults !== null) {
    const kids = requirement.children > 0;
    lines.push(
      th
        ? `- ผู้เข้าพัก: ผู้ใหญ่ ${requirement.adults} คน${kids ? ` เด็ก ${requirement.children} คน` : ""}`
        : `- Guests: ${requirement.adults} ${requirement.adults === 1 ? "adult" : "adults"}${
            kids ? `, ${requirement.children} ${requirement.children === 1 ? "child" : "children"}` : ""
          }`,
    );
  } else if (requirement.guestsAsTyped) {
    lines.push(th ? `- ผู้เข้าพัก: ${requirement.guestsAsTyped} คน` : `- Guests: ${requirement.guestsAsTyped}`);
  }

  // Bedrooms.
  if (requirement.bedroomsMinimum) {
    const plus = requirement.bedroomsMinimum.endsWith("+");
    const n = requirement.bedroomsMinimum.replace("+", "");
    lines.push(
      th
        ? plus
          ? `- ห้องนอน: ${n} ห้องขึ้นไป`
          : `- ห้องนอน: อย่างน้อย ${n} ห้อง`
        : `- Bedrooms: ${n} or more`,
    );
  }

  // Pets, only when they answered.
  if (requirement.pets && requirement.pets !== "none") {
    const kind =
      requirement.pets === "other"
        ? requirement.petsSpecies || labels.pets.other
        : labels.pets[requirement.pets as keyof typeof labels.pets];
    const count = requirement.petsCount ?? 1;
    lines.push(th ? `- สัตว์เลี้ยง: ${kind} ${count} ตัว` : `- Pets: ${count} ${inline(kind)}`);
  } else if (requirement.pets === "none") {
    lines.push(th ? `- สัตว์เลี้ยง: ${labels.pets.none}` : `- Pets: ${labels.pets.none}`);
  }

  if (requirement.smoking) {
    const smoking = labels.smoking[requirement.smoking as keyof typeof labels.smoking];
    lines.push(th ? `- การสูบบุหรี่: ${smoking}` : `- Smoking: ${smoking}`);
  }

  if (requirement.mustHaves.length > 0) {
    const wants = requirement.mustHaves.map(
      (want) => inline(labels.mustHaves[want as keyof typeof labels.mustHaves] ?? want),
    );
    lines.push(th ? `- สิ่งที่ต้องมี: ${wants.join(", ")}` : `- Must have: ${wants.join(", ")}`);
  }

  lines.push("");
  lines.push(
    th
      ? `${propertyName} ว่างในช่วงวันดังกล่าวหรือไม่ และราคารวมตลอดการเข้าพักเป็นเท่าไร`
      : `Is ${propertyName} free for those dates, and what would the total price be for the whole stay?`,
  );

  if (termsAgreed) {
    lines.push(
      th
        ? "เมื่อท่านยืนยันว่าว่าง เราจะส่งชื่อและช่องทางติดต่อของผู้เช่าให้ท่าน"
        : "Once you confirm it is free, we will pass you the renter's name and how to reach them.",
    );
  } else if (fee) {
    const cap = th ? (CAP_IN_THAI[fee.cap] ?? fee.cap) : fee.cap;
    lines.push(
      th
        ? `หากท่านสนใจ ค่าแนะนำผู้เช่าของเราคือ ${fee.ratePct}% ของค่าเช่าในการเช่าครั้งนั้น ไม่เกิน${cap} เจ้าของเป็นผู้ชำระเมื่อมีการเช่าเกิดขึ้นจริงเท่านั้น และผู้เช่าไม่ต้องเสียค่าใช้จ่ายใดๆ ให้เรา เมื่อท่านยอมรับเงื่อนไขนี้แล้ว เราจะส่งชื่อและช่องทางติดต่อของผู้เช่าให้ท่าน`
        : `If it suits you, our introduction fee is ${fee.ratePct}% of the rent of that let, never more than ${cap}, paid by you only when the let goes ahead; the renter pays us nothing. Once you accept that, we will pass you the renter's name and how to reach them.`,
    );
  }

  lines.push("");
  lines.push(SIGN_OFF);
  return lines.join("\n");
}

/** The language name for the second message, so the owner knows how to write to them. */
const LANGUAGE_NAMES: Record<OwnerLanguage, Record<string, string>> = {
  en: { en: "English", th: "Thai", zh: "Chinese" },
  th: { en: "ภาษาอังกฤษ", th: "ภาษาไทย", zh: "ภาษาจีน" },
};

/**
 * The second message: who the renter is and how to reach them. Only offered once the owner
 * has accepted the terms and the renter consented. The contact is pasted in by the person
 * sending it, from the request email in hi@agentsiam.com, because the site does not hold it.
 */
export function renterDetailsMessage(
  requirement: Requirement,
  renterName: string,
  contact: string,
  language: OwnerLanguage,
): string {
  const th = language === "th";
  const dates =
    requirement.checkIn && requirement.checkOut
      ? `${dmy(requirement.checkIn)} ${th ? "ถึง" : "to"} ${dmy(requirement.checkOut)}`
      : requirement.datesAsTyped;
  const lines = [
    th ? `ขอบคุณ ข้อมูลผู้เช่าสำหรับวันที่ ${dates}:` : `Thank you. The renter for ${dates}:`,
    th ? `ชื่อ: ${renterName}` : `Name: ${renterName}`,
    th ? `ติดต่อ: ${contact}` : `Contact: ${contact}`,
  ];
  const reply = LANGUAGE_NAMES[language][requirement.replyLanguage];
  if (reply) {
    lines.push(th ? `ผู้เช่าต้องการให้ติดต่อเป็น${reply}` : `They would like to be answered in ${reply}.`);
  }
  lines.push("", SIGN_OFF);
  return lines.join("\n");
}

/* ---------------------------------------------------------------------------------------
 * A pool row as a shortlist candidate.
 * ------------------------------------------------------------------------------------- */

const ALLOWED = {
  channel: ["LINE", "phone", "WhatsApp", "Facebook", "email", "Airbnb"],
  pool: ["private", "shared", "none"],
  walkable: ["yes", "no"],
  licence: ["hotel licence", "non-hotel exemption certificate", "none", "unknown"],
};

/** The first value the admin recognises, case-insensitively, or the fallback. Pool rows are
 * typed by hand, so "phone; Facebook" has to become "phone" rather than fail a save. */
function recognised(value: string, allowed: string[], fallback: string): string {
  for (const part of value.split(/[;,/]/)) {
    const hit = allowed.find((item) => item.toLowerCase() === part.trim().toLowerCase());
    if (hit) return hit;
  }
  return fallback;
}

export function candidateFromPool(property: PoolProperty): Partial<Candidate> {
  return {
    property_id: property.property_id,
    property_name: property.name,
    source_link: /^https?:\/\//.test(property.source.trim()) ? property.source.trim() : "",
    contact_channel: recognised(property.contact_channel, ALLOWED.channel, ""),
    contact_handle: property.contact_handle,
    area: property.area,
    map_link: property.map_link,
    bedrooms: property.bedrooms,
    bed_set_up: property.bed_setup,
    pool: recognised(property.pool, ALLOWED.pool, ""),
    walkable: recognised(property.walkable, ALLOWED.walkable, ""),
    licence: recognised(property.short_stay_licence, ALLOWED.licence, "unknown"),
    notes: `Added from the property pool, ${property.property_id}.`,
  };
}
