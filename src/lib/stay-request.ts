/**
 * What a renter inquiry carries, and what the words in it are allowed to be.
 *
 * One vocabulary, read by the form in the browser and by /api/stay-request on the server,
 * so a choice offered on screen and a choice the endpoint accepts cannot drift apart. The
 * values are the words that get written into the document store, in English, because that
 * is the language the CRM files are kept in: a Thai renter picking "ไม่กำหนด" writes
 * "month only" into the record, and the CRM stays readable to whoever works it.
 *
 * The renter's contact handles are deliberately not part of the stored record. The CRM's
 * own rule, stated in as-salesmarketing/01-crm/README.md and again in
 * shortlists/README.md in agentsiam-consulting, is that no guest email address and no
 * guest phone number goes in those files: they stay in the mailbox the enquiry arrived in.
 * Decision 92 points the same way, because the record is what an owner is shown and the
 * renter's details cross only once that owner has accepted the introduction terms. So the
 * record names the channels the renter offered and the notification email carries the
 * handles themselves.
 */

/** How fixed the dates are. Free text already arrives as "about 2026-12-21 (start
 * flexible)", which no filter can use. */
export const DATE_FLEXIBILITY = ["exact", "a few days either way", "month only"] as const;
export type DateFlexibility = (typeof DATE_FLEXIBILITY)[number];

/** A budget with no unit is the most common unusable answer, so the unit is asked. */
export const BUDGET_UNITS = ["per night", "per month", "whole stay"] as const;
export type BudgetUnit = (typeof BUDGET_UNITS)[number];

/** THB first: it is what a property is priced in. The other three are what renters write
 * their budget in today, on the evidence of the lead file. */
export const CURRENCIES = ["THB", "USD", "EUR", "GBP"] as const;

/**
 * The channels a renter can be answered on.
 *
 * Not the same list as CONTACT_CHANNELS in src/lib/admin/types.ts, which is how an owner
 * or a manager is reached and includes Facebook and Airbnb. A renter writing in is reached
 * on one of these four, and LINE is on the list because Thai and Chinese renters often use
 * it and nothing else.
 */
export const CONTACT_KINDS = ["email", "phone", "WhatsApp", "LINE"] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];

export const PETS = ["none", "dog", "cat", "other"] as const;
export type Pets = (typeof PETS)[number];

export const SMOKING = ["no one smokes", "outdoors only", "indoors"] as const;
export type Smoking = (typeof SMOKING)[number];

export const PARTY = ["solo", "couple", "family", "group", "remote worker"] as const;
export type Party = (typeof PARTY)[number];

/**
 * The must-haves, as fixed choices.
 *
 * Every one of these is already arriving inside a free-text paragraph in guest-leads.csv,
 * which is why they are offered rather than asked for in prose: the information is being
 * given, and the shape is what makes it unmatchable against the property pool.
 */
export const MUST_HAVES = [
  "fast wifi",
  "a desk",
  "a pool",
  "parking",
  "a kitchen",
  "air conditioning in every room",
  "a washing machine",
  "walkable to shops",
] as const;
export type MustHave = (typeof MUST_HAVES)[number];

export const YES_NO = ["yes", "no"] as const;

/**
 * The three cases an inquiry can be, and the only three there are.
 *
 * All three land with AgentSiam today. The case is recorded because what happens next
 * differs: a managed property is answered out of Beds24, a property listed with AgentSiam
 * and on no channel has to be asked of its owner, and an open requirement is put to every
 * matching property at once (decision 94). The owner delivery leg itself is not built.
 */
export const ROUTING_CASES = [
  "managed property",
  "listed with AgentSiam",
  "open requirement",
] as const;
export type RoutingCase = (typeof ROUTING_CASES)[number];

/** Nights between two ISO dates. Derived, never asked. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / (24 * 60 * 60 * 1000));
}

export const MAX_ADULTS = 20;
export const MAX_CHILDREN = 15;
export const MAX_PETS = 10;

/** Bedrooms as a minimum. The last value carries its own "or more". */
export const BEDROOM_MINIMUMS = ["1", "2", "3", "4", "5+"] as const;

/**
 * The three languages named in English, for the CRM row and the notification.
 *
 * Not the same thing as the srLang keys in the dictionaries, which are what a renter reads
 * while choosing. These are what Paul or Nils reads afterwards, and the CRM files are kept
 * in English, so a lead row saying "Answer in th" would be a code where a word belongs.
 */
export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  th: "Thai",
  zh: "Chinese",
};

export function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code;
}
