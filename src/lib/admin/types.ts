/**
 * The shapes the renter shortlist admin reads and writes.
 *
 * Field names are snake_case because these objects are the JSON on disk in the document
 * store, under as-salesmarketing/01-crm/shortlists/ in agentsiam-consulting, and that
 * repository writes its data in snake_case. One shape end to end, no mapping layer, so a
 * file edited by hand there and a candidate saved here cannot drift apart.
 */

export const CANDIDATE_STATUSES = [
  "to contact",
  "contacted",
  "quoted",
  "ready to send",
  "sent to guest",
  "booked",
  "rejected",
] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

/** The channels an owner or manager is actually reached on. Blank is allowed: the lead row
 * sometimes records a handle without saying which channel it belongs to. */
export const CONTACT_CHANNELS = ["LINE", "phone", "WhatsApp", "Facebook", "email"] as const;

export const POOL_KINDS = ["private", "shared", "none"] as const;

/** The compliance routes a short stay can sit on, plus the honest fourth value. The wording
 * is the document store's, from str-legal-overview.md in agentsiam-consulting. */
export const LICENCES = [
  "hotel licence",
  "non-hotel exemption certificate",
  "none",
  "unknown",
] as const;

export const YES_NO_UNKNOWN = ["yes", "no", "unknown"] as const;

export const WALKABLE = ["yes", "no"] as const;

export type Candidate = {
  id: string;
  property_name: string;
  source_link: string;
  contact_channel: string;
  contact_handle: string;
  area: string;
  map_link: string;
  bedrooms: string;
  bed_set_up: string;
  pool: string;
  walkable: string;
  transport_if_not_walkable: string;
  licence: string;
  available: string;
  availability_confirmed_on: string;
  total_price_thb: number | null;
  price_includes_everything: string;
  photo_links: string[];
  status: CandidateStatus;
  rejected_reason: string;
  notes: string;
  added_by: string;
  added_on: string;
  updated_by: string;
  updated_on: string;
};

export type Shortlist = {
  lead_id: string;
  updated_on: string;
  candidates: Candidate[];
};

/**
 * A renter lead, exactly the sixteen columns of guest-leads.csv. The admin reads this file
 * and never writes it: the CSV stays the source of truth for the lead, worked there and
 * through Claude as it is today.
 *
 * There is no notes column and no history column, although the CRM README says every lead
 * row carries both and the owner file leads.csv does. That gap is recorded in the README's
 * own section rather than papered over here.
 */
export type Lead = {
  lead_id: string;
  name: string;
  contact_channel: string;
  source: string;
  received_date: string;
  dates_requested: string;
  nights: string;
  guests: string;
  area_wanted: string;
  budget_thb: string;
  requirements: string;
  stage: string;
  next_action: string;
  owner: string;
  next_action_date: string;
  lost_reason: string;
};

/**
 * What "ready to send" needs, as four named checks.
 *
 * The brief says availability, total price, licence status and photos must all be filled
 * in. Availability is read as `yes` rather than merely answered, because a property the
 * owner has said is not free cannot be sent to a guest, and `unknown` is an answer that
 * says nobody knows yet. A licence of `unknown` does count as filled in: it is one of the
 * four values the document store recognises, and whether an unknown licence is good enough
 * to send is a judgement for whoever presses send, not for this function.
 *
 * The list is returned rather than a boolean so the screen can say which one is missing.
 */
export function missingForReady(candidate: Candidate): string[] {
  const missing: string[] = [];
  if (candidate.available !== "yes") missing.push("available for the exact dates");
  if (candidate.total_price_thb === null) missing.push("total price");
  if (!candidate.licence) missing.push("short-stay licence");
  if (candidate.photo_links.length === 0) missing.push("photos");
  return missing;
}

export function isReadyToSend(candidate: Candidate): boolean {
  return missingForReady(candidate).length === 0;
}

/** The statuses that assert the candidate is complete enough to go to a guest. Setting one
 * while something is missing is refused, so the four checks cannot be talked past. */
export const STATUSES_NEEDING_READY: CandidateStatus[] = [
  "ready to send",
  "sent to guest",
  "booked",
];

/** A stable id from the property name, with a suffix when the slug is already taken. Ids
 * are never reused inside a file, the same rule the CRM applies to lead IDs. */
export function candidateId(propertyName: string, taken: string[]): string {
  const base =
    propertyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "candidate";
  if (!taken.includes(base)) return base;
  for (let n = 2; n < 100; n += 1) {
    const next = `${base}-${n}`;
    if (!taken.includes(next)) return next;
  }
  return `${base}-${Date.now()}`;
}

/** Today in ISO, the form every date in the document store takes. */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function emptyCandidate(): Candidate {
  return {
    id: "",
    property_name: "",
    source_link: "",
    contact_channel: "",
    contact_handle: "",
    area: "",
    map_link: "",
    bedrooms: "",
    bed_set_up: "",
    pool: "",
    walkable: "",
    transport_if_not_walkable: "",
    licence: "unknown",
    available: "unknown",
    availability_confirmed_on: "",
    total_price_thb: null,
    price_includes_everything: "unknown",
    photo_links: [],
    status: "to contact",
    rejected_reason: "",
    notes: "",
    added_by: "",
    added_on: "",
    updated_by: "",
    updated_on: "",
  };
}
