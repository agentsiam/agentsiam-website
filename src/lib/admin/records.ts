/**
 * What the three CRM tables hold, described once.
 *
 * The admin edits rows in guest-leads.csv, leads.csv and property-pool.csv. The screens
 * need labels, hints and the choices to offer; the route needs to know which columns may be
 * written and which values are allowed. Those are the same facts, so they are written once
 * here and read by both. A field added to a form is a field the server accepts, and a field
 * left out of this file cannot be written at all, however the request is shaped.
 *
 * Column names are the CSV's own, exactly. No mapping layer, the same rule the shortlist
 * JSON follows: a file edited by hand in the document store and a row saved here cannot
 * drift apart.
 */

import {
  CLIENT_STATUSES,
  CONTACT_CHANNELS,
  LEAD_SOURCES,
  LICENCES,
  OWNER_SEGMENTS,
  OWNER_STAGES,
  OWNER_TYPES,
  POOL_KINDS,
  QUALIFICATIONS,
  TIERS,
  WALKABLE,
  YES_NO_UNKNOWN,
} from "./types";

export type FieldKind = "text" | "textarea" | "select" | "date" | "number";

export type FieldSpec = {
  /** The CSV column, exactly as the header writes it. */
  key: string;
  label: string;
  hint?: string;
  kind: FieldKind;
  /** For `select`. Blank is always offered as well: an unanswered question is a real state
   * in these files and not a missing value. */
  options?: readonly string[];
  required?: boolean;
  /** Spans both columns of the form grid. For anything long enough to need the width. */
  wide?: boolean;
  /** Shown, never written. The id, which is assigned once and never changed. */
  readOnly?: boolean;
};

export type RecordKind = "renter" | "owner" | "property" | "client";

export type RecordSpec = {
  kind: RecordKind;
  /** Singular and plural, for headings and sentences. */
  one: string;
  many: string;
  /** The id column and the prefix a new row's id takes. */
  idColumn: string;
  idPrefix: string;
  /** The column to show as the record's name in a list. */
  nameColumn: string;
  file: string;
  fields: FieldSpec[];
  /** What a list of these shows, and in what order. Separate from `fields` because a list
   * shows columns nobody edits here, `offered_to` among them. */
  listColumns: { key: string; label: string }[];
};

/** Who owns a lead. Two people, named rather than free text, so the column stays sortable. */
const PEOPLE = ["Paul", "Nils"] as const;

const CRM = "as-salesmarketing/01-crm";

/**
 * Renter leads, guest-leads.csv.
 *
 * `contact_channel` and `source` are free text here although the shortlist uses a fixed list
 * for the same words, because these cells carry things like "website stay-request form (hi@)"
 * and narrowing them now would mean rewriting rows to fit the admin. The file came first.
 */
export const RENTER: RecordSpec = {
  kind: "renter",
  one: "renter lead",
  many: "renter leads",
  idColumn: "lead_id",
  idPrefix: "G",
  nameColumn: "name",
  file: `${CRM}/guest-leads.csv`,
  listColumns: [
    { key: "name", label: "Name" },
    { key: "dates_requested", label: "Dates" },
    { key: "stage", label: "Stage" },
    { key: "owner", label: "Owned by" },
    { key: "next_action_date", label: "Next action" },
  ],
  fields: [
    { key: "lead_id", label: "Lead ID", kind: "text", readOnly: true },
    { key: "name", label: "Name", kind: "text", required: true },
    { key: "stage", label: "Stage", kind: "select", options: OWNER_STAGES },
    { key: "owner", label: "Owned by", kind: "select", options: PEOPLE },
    { key: "contact_channel", label: "Contact channel", kind: "text", hint: "How they reached us" },
    { key: "source", label: "Source", kind: "text" },
    { key: "received_date", label: "Received", kind: "date" },
    { key: "dates_requested", label: "Dates requested", kind: "text", wide: true },
    { key: "nights", label: "Nights", kind: "number" },
    { key: "guests", label: "Guests", kind: "number" },
    { key: "area_wanted", label: "Area wanted", kind: "text" },
    { key: "budget_thb", label: "Budget, THB", kind: "text", hint: "As they put it" },
    {
      key: "requirements",
      label: "Requirements",
      kind: "textarea",
      hint: "In their words",
      wide: true,
    },
    { key: "next_action", label: "Next action", kind: "text", wide: true },
    { key: "next_action_date", label: "Next action date", kind: "date" },
    { key: "lost_reason", label: "Lost reason", kind: "text", hint: "Only when the stage is lost" },
  ],
};

/** Owner leads, leads.csv. The pipeline. */
export const OWNER: RecordSpec = {
  kind: "owner",
  one: "owner lead",
  many: "owner leads",
  idColumn: "lead_id",
  idPrefix: "L",
  nameColumn: "name",
  file: `${CRM}/leads.csv`,
  listColumns: [
    { key: "name", label: "Name" },
    { key: "stage", label: "Stage" },
    { key: "qualification", label: "Grade" },
    { key: "property_type", label: "Property" },
    { key: "area", label: "Area" },
    { key: "next_action", label: "Next action" },
    { key: "next_action_date", label: "When" },
  ],
  fields: [
    { key: "lead_id", label: "Lead ID", kind: "text", readOnly: true },
    { key: "name", label: "Name", kind: "text", required: true },
    { key: "stage", label: "Stage", kind: "select", options: OWNER_STAGES },
    {
      key: "qualification",
      label: "Grade",
      kind: "select",
      options: QUALIFICATIONS,
      hint: "A pursue hard, B worth working, C deprioritise",
    },
    { key: "segment", label: "Segment", kind: "select", options: OWNER_SEGMENTS },
    { key: "property_type", label: "Property type", kind: "text" },
    { key: "area", label: "Area", kind: "text" },
    { key: "units", label: "Units", kind: "number" },
    { key: "contact_channel", label: "Contact channel", kind: "select", options: CONTACT_CHANNELS },
    { key: "contact_info", label: "Contact", kind: "text" },
    { key: "source", label: "Source", kind: "select", options: LEAD_SOURCES },
    { key: "referred_by", label: "Referred by", kind: "text" },
    { key: "tier_target", label: "Tier target", kind: "select", options: TIERS },
    { key: "est_monthly_revenue_thb", label: "Est. monthly revenue, THB", kind: "number" },
    { key: "next_action", label: "Next action", kind: "text", wide: true },
    { key: "next_action_date", label: "Next action date", kind: "date" },
    { key: "last_contact_date", label: "Last contact", kind: "date" },
    {
      key: "lost_reason",
      label: "Lost reason",
      kind: "text",
      wide: true,
      hint: "Required once the stage is lost",
    },
    {
      key: "notes",
      label: "Notes",
      kind: "textarea",
      hint: "Property, situation and objections, in their words",
      wide: true,
    },
  ],
};

/**
 * The property pool, property-pool.csv. Properties AgentSiam does not manage, found while
 * sourcing for renter leads.
 *
 * `offered_to` and `property_id` are not editable here. The first is written when a property
 * is put to a lead, which happens on the shortlist rather than on this form, and typing a
 * lead ID into it by hand would let the two disagree.
 */
export const PROPERTY: RecordSpec = {
  kind: "property",
  one: "property",
  many: "properties",
  idColumn: "property_id",
  idPrefix: "P",
  nameColumn: "name",
  file: `${CRM}/property-pool.csv`,
  listColumns: [
    { key: "name", label: "Name" },
    { key: "area", label: "Area" },
    { key: "property_type", label: "Type" },
    { key: "bedrooms", label: "Beds" },
    { key: "short_stay_licence", label: "Licence" },
    { key: "status", label: "Status" },
    { key: "offered_to", label: "Offered to" },
  ],
  fields: [
    { key: "property_id", label: "Property ID", kind: "text", readOnly: true },
    { key: "name", label: "Name", kind: "text", required: true },
    { key: "status", label: "Status", kind: "text", hint: "The latest answer, in words", wide: true },
    { key: "run_by", label: "Run by", kind: "text", hint: "Owner, or a manager, or not yet known" },
    { key: "contact_channel", label: "Contact channel", kind: "select", options: CONTACT_CHANNELS },
    { key: "contact_handle", label: "Contact handle", kind: "text" },
    { key: "area", label: "Area", kind: "text" },
    { key: "map_link", label: "Map link", kind: "text", wide: true },
    { key: "property_type", label: "Property type", kind: "text" },
    { key: "bedrooms", label: "Bedrooms", kind: "text" },
    { key: "bathrooms", label: "Bathrooms", kind: "text" },
    { key: "bed_setup", label: "Bed set-up", kind: "text", hint: "Plain words: king, two singles" },
    { key: "pool", label: "Pool", kind: "select", options: POOL_KINDS },
    { key: "walkable", label: "Walkable", kind: "select", options: WALKABLE },
    { key: "short_stay_licence", label: "Short-stay licence", kind: "select", options: LICENCES },
    { key: "nightly_rate_thb", label: "Nightly rate, THB", kind: "number" },
    { key: "monthly_rate_thb", label: "Monthly rate, THB", kind: "number" },
    { key: "g2_terms_agreed", label: "G2 terms agreed", kind: "select", options: YES_NO_UNKNOWN },
    { key: "source", label: "Source", kind: "text", hint: "Where it was found", wide: true },
    { key: "first_contact_date", label: "First contact", kind: "date" },
    { key: "last_contact_date", label: "Last contact", kind: "date" },
    { key: "notes", label: "Notes", kind: "textarea", wide: true },
  ],
};

/**
 * Signed owners, clients/*.md. One markdown file each rather than a row, so `file` names the
 * folder and the fields are frontmatter keys. Everything else about a client, the contract
 * terms, how they take bad news, the dated history, is prose below the frontmatter and is
 * edited as prose.
 *
 * Dates here are DD/MM/YYYY rather than ISO, because that is what the template asks for and
 * what the signed contracts use. Written as text for that reason: a date input would hand
 * back an ISO string and quietly change the convention of every record it touched.
 */
export const CLIENT: RecordSpec = {
  kind: "client",
  one: "client",
  many: "clients",
  idColumn: "client_id",
  idPrefix: "C",
  nameColumn: "name",
  file: `${CRM}/clients/`,
  listColumns: [
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
    { key: "area", label: "Area" },
    { key: "tier", label: "Tier" },
    { key: "fee_pct", label: "Fee %" },
    { key: "contract_renewal_date", label: "Renewal" },
  ],
  fields: [
    { key: "client_id", label: "Client ID", kind: "text", readOnly: true },
    { key: "name", label: "Name", kind: "text", required: true },
    { key: "status", label: "Status", kind: "select", options: CLIENT_STATUSES },
    { key: "segment", label: "Segment", kind: "select", options: OWNER_SEGMENTS },
    { key: "area", label: "Area", kind: "text" },
    {
      key: "nationality",
      label: "Nationality",
      kind: "text",
      hint: "Affects structure and who can hold a compliance registration",
    },
    { key: "owner_type", label: "Owner type", kind: "select", options: OWNER_TYPES },
    { key: "contact_channel", label: "Contact channel", kind: "select", options: CONTACT_CHANNELS },
    { key: "contact_info", label: "Contact", kind: "text" },
    { key: "preferred_language", label: "Preferred language", kind: "text" },
    { key: "source_lead_id", label: "Source lead", kind: "text", hint: "The L-number they came from" },
    { key: "source", label: "Source", kind: "select", options: LEAD_SOURCES },
    { key: "referred_by", label: "Referred by", kind: "text" },
    { key: "tier", label: "Tier", kind: "select", options: TIERS },
    { key: "fee_pct", label: "Fee %", kind: "number" },
    { key: "onboarding_fee_thb", label: "Onboarding fee, THB", kind: "number" },
    { key: "contract_signed_date", label: "Signed", kind: "text", hint: "DD/MM/YYYY" },
    { key: "contract_start_date", label: "Starts", kind: "text", hint: "DD/MM/YYYY" },
    { key: "contract_renewal_date", label: "Renews", kind: "text", hint: "DD/MM/YYYY" },
    { key: "notice_period_days", label: "Notice period, days", kind: "number" },
    { key: "owner_blocked_nights_cap", label: "Owner blocked nights cap", kind: "number" },
    {
      key: "properties",
      label: "Properties",
      kind: "text",
      hint: "Beds24 property IDs, as a list: [275645]",
      wide: true,
    },
  ],
};

export const RECORDS: Record<RecordKind, RecordSpec> = {
  renter: RENTER,
  owner: OWNER,
  property: PROPERTY,
  client: CLIENT,
};

export function recordSpec(kind: string): RecordSpec | null {
  return (RECORDS as Record<string, RecordSpec>)[kind] ?? null;
}

/** The columns a form may write: everything in the spec that is not the id. */
export function writableFields(spec: RecordSpec): FieldSpec[] {
  return spec.fields.filter((field) => !field.readOnly);
}

/**
 * Keep only what this record may be sent, and refuse a value outside a fixed list.
 *
 * Returns the changes to write, or the reason it will not be written. Unknown keys are
 * dropped rather than refused, because a browser that posts a stale field after a column is
 * renamed should not block the rest of the save; a value outside a fixed list is refused,
 * because that one would put a word into the file that nothing downstream understands.
 */
export function cleanChanges(
  spec: RecordSpec,
  input: Record<string, unknown>,
): { changes: Record<string, string> } | { error: string } {
  const changes: Record<string, string> = {};
  for (const field of writableFields(spec)) {
    if (!(field.key in input)) continue;
    const raw = input[field.key];
    const value = typeof raw === "string" ? raw.trim() : raw === undefined || raw === null ? "" : String(raw);
    if (field.options && value !== "" && !field.options.includes(value)) {
      return {
        error: `${field.label} cannot be "${value}". It is one of: ${field.options.join(", ")}, or left blank.`,
      };
    }
    if (field.required && value === "") {
      return { error: `${field.label} cannot be empty.` };
    }
    changes[field.key] = value;
  }
  return { changes };
}
