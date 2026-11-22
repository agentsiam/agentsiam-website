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
export const CONTACT_CHANNELS = [
  "LINE",
  "phone",
  "WhatsApp",
  "Facebook",
  "email",
  "Airbnb",
] as const;

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
  /** The `P-####` row in property-pool.csv this candidate is, or "" for a candidate saved
   * before the two were linked. The admin fills it on the next save. */
  property_id: string;
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
  /** The day the owner or manager was asked about this lead's dates. Blank until somebody
   * asks. It is what a timeout reads: `availability_confirmed_on` says when an answer came
   * back, and nothing else said when the question went out. */
  asked_on: string;
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
 * A renter lead, exactly the sixteen columns of renter-leads.csv.
 *
 * Editable in the admin since 12/11/2026. The file is still worked by hand and by Claude,
 * so a save writes only the cells the form changed and leaves the rest of the row as it
 * found it; `updateCsvRow` in ./csv.ts is what guarantees that.
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
 * One renter inquiry as it arrived, one file per lead, beside the shortlist:
 * as-salesmarketing/01-crm/inquiries/G-####.json in agentsiam-consulting.
 *
 * Written by /api/stay-request when the form is submitted, not by the admin. It exists
 * because renter-leads.csv holds sixteen free-text columns and a renter's requirement is
 * structured: a budget with a unit, a date flexibility, a guest split, fixed must-haves.
 * Those cannot be matched against property-pool.csv while they sit inside a paragraph, and
 * the CSV row is where a person reads the lead rather than where a filter does.
 *
 * It carries no email address, no phone number and no messaging handle, by the rule
 * renter-leads.csv and shortlists/README.md both state: those stay in the mailbox the
 * enquiry arrived in. `contact_channels` says which channels the renter offered, and the
 * notification email to hi@agentsiam.com carries the handles. It is also the right shape
 * for decision 92, where an owner is shown the requirement and the renter's details cross
 * only after that owner has accepted the introduction terms for the lead.
 *
 * snake_case for the same reason as a candidate: this is the JSON on disk in the document
 * store, and that repository writes its data in snake_case.
 */
export type Inquiry = {
  lead_id: string;
  /** ISO date, and the full timestamp beside it, because two inquiries in one day are
   * ordinary and the CSV's received_date cannot tell them apart. */
  received_on: string;
  received_at: string;
  /** One of ROUTING_CASES in src/lib/stay-request.ts. */
  routing: string;
  /** The house the form sat on, as its `unitKey()` in src/lib/property.ts: the Beds24
   * property ID, or the URL slug of a house not yet in Beds24. "" for an open requirement. */
  property_ref: string;
  property_name: string;
  /** The language the renter asked to be answered in, and the language of the page they
   * wrote from. They are not always the same. */
  reply_language: string;
  wrote_in: string;
  from_page: string;
  /** Channel kinds only, never a handle. */
  contact_channels: string[];
  check_in: string;
  check_out: string;
  nights: number;
  date_flexibility: string;
  adults: number;
  children: number;
  children_ages: string;
  budget_amount: number | null;
  budget_unit: string;
  budget_currency: string;
  area_wanted: string;
  bedrooms_minimum: string;
  must_haves: string[];
  party: string;
  vehicle: string;
  pets: string;
  pets_count: number | null;
  pets_species: string;
  smoking: string;
  notes: string;
  found_via: string;
  /** `yes` or `no`, and the exact words the renter was shown when they answered, in the
   * language they were shown them in. A consent record that does not say what was consented
   * to is not a consent record. */
  consent_to_pass_to_owner: string;
  consent_text: string;
  /** Keyed fingerprints of the handles, `kind:hex`, never the handles themselves. See
   * src/lib/lead-match.ts. Absent on records written before 22/11/2026 and on any written
   * while LEAD_MATCH_KEY was unset, so those can never be matched. Never passed to a
   * property owner: whatever delivers this record to an owner drops this field first. */
  contact_keys?: string[];
  /** Earlier leads sharing a handle with this one, as "G-0007 (same email)". Empty when
   * none matched; absent when the check did not run. */
  repeat_of?: string;
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
    property_id: "",
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
    asked_on: "",
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

/* ---------------------------------------------------------------------------------------
 * The owner pipeline, leads.csv.
 * ------------------------------------------------------------------------------------- */

/** The eight stages in the CRM README's stage table, in its order. `nurture` is last there
 * and last here: it is the one people skip and then regret. */
export const OWNER_STAGES = [
  "new",
  "contacted",
  "engaged",
  "qualified",
  "proposal",
  "won",
  "lost",
  "nurture",
] as const;

/** A, B or C, graded by judgement against the CRM README's qualification section. Blank
 * until there is enough to grade, which is a real state and not a missing value. */
export const QUALIFICATIONS = ["A", "B", "C"] as const;

export const OWNER_SEGMENTS = [
  "condo_investor",
  "pool_villa_owner",
  "townhouse_owner",
  "new_buyer",
] as const;

export const TIERS = ["essential", "full", "landed"] as const;

export const LEAD_SOURCES = [
  "personal-network",
  "referral",
  "facebook-group",
  "line",
  "seo",
  "agent-partner",
  "inbound",
  "website-form",
] as const;

/** The five owner ICPs in service-model.md, by the three answers that decide one. The form
 * only suggests, in `icp_suggested`; `icp` is the confirmed value and blank until a person
 * sets it. A lead carries one ICP: a pair such as "ICP3 or ICP1" is the form not knowing
 * occupancy yet, never two ICPs. */
export const ICPS = ["ICP1", "ICP2", "ICP3", "ICP4", "ICP5"] as const;

/** What the owner asked for when they arrived, beside the ICP that says where the lead is
 * going. The list is the owner lead nurture playbook's, in the document store at
 * as-context/02-playbooks/owner-lead-nurture/: if it changes there, this constant changes. */
export const ENTRY_ASKS = [
  "management",
  "cleaning only",
  "co-host",
  "study",
  "permission",
  "price only",
  "other",
] as const;

/** An owner lead, exactly the twenty-eight columns of leads.csv. The last eight came with the
 * owner form writing its own leads: when it arrived, the confirmed and suggested ICP, what the
 * owner asked for, and the three attribution fields a person filters on. The full attribution
 * is in the owner inquiry record, `owner-inquiries/L-####.json`. */
export type OwnerLead = {
  lead_id: string;
  name: string;
  segment: string;
  property_type: string;
  area: string;
  units: string;
  contact_channel: string;
  contact_info: string;
  source: string;
  referred_by: string;
  qualification: string;
  stage: string;
  tier_target: string;
  est_monthly_revenue_thb: string;
  next_action: string;
  next_action_date: string;
  last_contact_date: string;
  lost_reason: string;
  notes: string;
  history: string;
  received_date: string;
  icp: string;
  icp_suggested: string;
  entry_ask: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  referrer: string;
};

/**
 * What brought a visitor to the site, as the browser saw it. Every field is optional because
 * most visitors arrive with none of it. `referrer` is an external site only: a referrer on
 * agentsiam.com says which page they clicked from, which `landing_path` and `form_page`
 * already say better.
 */
export type Attribution = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  gclid: string;
  fbclid: string;
  referrer: string;
  landing_path: string;
  /** Where the attribution was read: `landing` when it was kept from the first page of the
   * visit, `form page` when it was read off the page the form sat on. */
  captured: string;
};

/**
 * One owner enquiry as it arrived, beside leads.csv:
 * as-salesmarketing/01-crm/owner-inquiries/L-####.json in agentsiam-consulting.
 *
 * Written by /api/contact, never by the admin. The row is what a person reads; this is the
 * enquiry exactly as submitted, kept so a later reader can see what the form was told
 * rather than what somebody summarised. Unlike a renter inquiry it may hold the owner's
 * contact details, because the owner row in leads.csv does too: the no-handles rule in the
 * CRM README is renter-leads.csv's.
 */
export type OwnerInquiry = {
  lead_id: string;
  received_on: string;
  received_at: string;
  name: string;
  email: string;
  phone: string;
  wrote_in: string;
  form_page: string;
  listed: string;
  agency: string;
  listing_url: string;
  bedrooms: string;
  property_type: string;
  area: string;
  message: string;
  icp_suggested: string;
  attribution: Attribution;
};

/** Dated contacts inside a `history` cell, newest last, separated by ` || `. The CRM README
 * defines the separator; this is the only place that knows it. */
export const HISTORY_SEPARATOR = " || ";

export function historyEntries(history: string): string[] {
  return history
    .split(HISTORY_SEPARATOR)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/** A dated line added to the end, because the CRM keeps history newest last. */
export function appendHistory(history: string, entry: string): string {
  const trimmed = entry.trim();
  if (!trimmed) return history;
  const line = `${today()}: ${trimmed}`;
  return historyEntries(history).concat(line).join(HISTORY_SEPARATOR);
}

/* ---------------------------------------------------------------------------------------
 * The property pool, property-pool.csv.
 * ------------------------------------------------------------------------------------- */

/** A property AgentSiam does not manage, found while sourcing for a renter lead, kept after
 * the lead closes so the next renter starts from what is already known. Exactly the
 * twenty-three columns of property-pool.csv. */
export type PoolProperty = {
  property_id: string;
  name: string;
  run_by: string;
  contact_channel: string;
  contact_handle: string;
  area: string;
  map_link: string;
  property_type: string;
  bedrooms: string;
  bathrooms: string;
  bed_setup: string;
  pool: string;
  walkable: string;
  short_stay_licence: string;
  nightly_rate_thb: string;
  monthly_rate_thb: string;
  g2_terms_agreed: string;
  source: string;
  first_contact_date: string;
  last_contact_date: string;
  offered_to: string;
  status: string;
  notes: string;
};

/** `offered_to` lists the `G-####` leads a property was put to, comma separated. */
export function offeredTo(value: string): string[] {
  return value
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

export function addOfferedTo(value: string, leadId: string): string {
  const current = offeredTo(value);
  if (current.includes(leadId)) return value;
  return current.concat(leadId).join(", ");
}

export function emptyPoolProperty(): PoolProperty {
  return {
    property_id: "",
    name: "",
    run_by: "",
    contact_channel: "",
    contact_handle: "",
    area: "",
    map_link: "",
    property_type: "",
    bedrooms: "",
    bathrooms: "",
    bed_setup: "",
    pool: "",
    walkable: "",
    short_stay_licence: "unknown",
    nightly_rate_thb: "",
    monthly_rate_thb: "",
    g2_terms_agreed: "no",
    source: "",
    first_contact_date: "",
    last_contact_date: "",
    offered_to: "",
    status: "",
    notes: "",
  };
}

export function emptyOwnerLead(): OwnerLead {
  return {
    lead_id: "",
    name: "",
    segment: "",
    property_type: "",
    area: "",
    units: "",
    contact_channel: "",
    contact_info: "",
    source: "",
    referred_by: "",
    qualification: "",
    stage: "new",
    tier_target: "",
    est_monthly_revenue_thb: "",
    next_action: "",
    next_action_date: "",
    last_contact_date: "",
    lost_reason: "",
    notes: "",
    history: "",
    received_date: "",
    icp: "",
    icp_suggested: "",
    entry_ask: "",
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    referrer: "",
  };
}

/* ---------------------------------------------------------------------------------------
 * A shortlist candidate and a pool property are the same building.
 * ------------------------------------------------------------------------------------- */

/**
 * A property name reduced to what is left when punctuation and case stop mattering, so
 * "Livin' H" and "Livin H" are one building rather than two rows.
 *
 * Deliberately crude. It is used to notice that a property is already in the pool, and the
 * cost of missing a match is a duplicate row somebody merges by hand, while the cost of a
 * clever match that is wrong is two different houses sharing a record.
 */
export function normalisedName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * What a candidate knows that belongs in the pool row.
 *
 * Only non-empty values. The pool row outlives the shortlist it was sourced for, so a
 * candidate with a blank area must not wipe an area somebody filled in from a later
 * conversation. The candidate's own per-lead facts, price for these dates, availability for
 * these dates, status on this shortlist, are not here at all: they belong to the lead, not
 * to the building.
 */
export function poolFactsFromCandidate(candidate: Candidate): Partial<PoolProperty> {
  const mapping: Array<[keyof PoolProperty, string]> = [
    ["name", candidate.property_name],
    ["source", candidate.source_link],
    ["contact_channel", candidate.contact_channel],
    ["contact_handle", candidate.contact_handle],
    ["area", candidate.area],
    ["map_link", candidate.map_link],
    ["bedrooms", candidate.bedrooms],
    ["bed_setup", candidate.bed_set_up],
    ["pool", candidate.pool],
    ["walkable", candidate.walkable],
    ["short_stay_licence", candidate.licence],
  ];
  const facts: Partial<PoolProperty> = {};
  for (const [column, value] of mapping) {
    if (value && value.trim()) facts[column] = value.trim();
  }
  return facts;
}

/* ---------------------------------------------------------------------------------------
 * The client registry, clients/*.md. Signed owners.
 * ------------------------------------------------------------------------------------- */

/** From the client template's own comments, which are the registry's vocabulary. */
export const CLIENT_STATUSES = ["active", "paused", "churned"] as const;
export const OWNER_TYPES = ["resident", "absentee_thailand", "absentee_overseas"] as const;
