/**
 * One inquiry turned into the two things the document store keeps: a row in
 * guest-leads.csv, and the lines a person reads in the notification email.
 *
 * Here rather than in the route because the route's job is to validate and to write in the
 * right order, and because the CSV row is a mapping worth reading on its own: sixteen
 * free-text columns worked by hand for months, which a form now has to write into without
 * changing what any of them means.
 *
 * Two rules shape it. The structured answers go into `requirements` as plain sentences,
 * because that column is where a person reads the lead and the file has nowhere else to put
 * them; the same answers go into the inquiry record as fields, because that is what can be
 * matched against property-pool.csv. And no contact handle is written to either file, by the
 * rule stated in the CRM's own README: those stay in the mailbox the enquiry arrived in.
 */

import type { Inquiry, Lead } from "@/lib/admin/types";
import { CONTACT_EMAIL } from "@/lib/site";
import { languageName } from "@/lib/stay-request";

/**
 * The renter's name and handles, carried to the mailbox and, in the name's case, to the lead
 * row. Kept apart from the Inquiry type on purpose: the inquiry record holds no name and no
 * handle, so the whole of it can be shown to a property owner without anything crossing that
 * decision 92 says must not cross until that owner has accepted the introduction terms.
 */
export type Reachable = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  line: string;
};

function guestCount(inquiry: Inquiry): string {
  const parts = [`${inquiry.adults} ${inquiry.adults === 1 ? "adult" : "adults"}`];
  if (inquiry.children > 0) {
    const children = `${inquiry.children} ${inquiry.children === 1 ? "child" : "children"}`;
    parts.push(inquiry.children_ages ? `${children} (${inquiry.children_ages})` : children);
  }
  return parts.join(", ");
}

/** Blank when they gave no amount, because a budget with no number is not a budget. */
export function budgetAsWritten(inquiry: Inquiry): string {
  if (inquiry.budget_amount === null) return "";
  return `${inquiry.budget_amount.toLocaleString("en-GB")} ${inquiry.budget_currency} ${inquiry.budget_unit}`;
}

export function datesAsWritten(inquiry: Inquiry): string {
  const dates = `${inquiry.check_in} to ${inquiry.check_out}`;
  return inquiry.date_flexibility === "exact"
    ? dates
    : `${dates} (${inquiry.date_flexibility})`;
}

/** Blank when they did not answer, which is not the same as no pets. */
function pets(inquiry: Inquiry): string {
  if (inquiry.pets === "") return "";
  if (inquiry.pets === "none") return "No pets";
  const species = inquiry.pets === "other" ? inquiry.pets_species || "an animal" : inquiry.pets;
  const count = inquiry.pets_count ?? 1;
  return `Pets: ${count} ${species}`;
}

/**
 * The `requirements` cell: every structured answer as a sentence, then their own words last.
 *
 * Their words go at the end rather than the start so that the part nobody typed is read
 * first, which is the opposite of how the hand-written rows read today and is the point of
 * asking the questions.
 */
export function requirementsCell(inquiry: Inquiry): string {
  const clauses: string[] = [guestCount(inquiry)];

  if (inquiry.bedrooms_minimum) clauses.push(`${inquiry.bedrooms_minimum} bedrooms or more`);
  if (inquiry.must_haves.length > 0) {
    clauses.push(`Must-haves: ${inquiry.must_haves.join(", ")}`);
  }
  if (inquiry.party) clauses.push(`Coming as a ${inquiry.party}`);
  if (inquiry.vehicle) {
    clauses.push(inquiry.vehicle === "yes" ? "Will have a vehicle" : "No vehicle");
  }
  const petLine = pets(inquiry);
  if (petLine) clauses.push(petLine);
  if (inquiry.smoking) clauses.push(`Smoking: ${inquiry.smoking}`);
  clauses.push(`Answer in ${languageName(inquiry.reply_language)}`);
  clauses.push(
    `Consent to pass this to a property owner or their co-host: ${inquiry.consent_to_pass_to_owner}`,
  );
  clauses.push(`Routed as: ${inquiry.routing}`);
  if (inquiry.property_name) clauses.push(`Asked about ${inquiry.property_name}`);
  clauses.push(
    "Full record: the file named for this lead in as-salesmarketing/01-crm/inquiries/",
  );
  if (inquiry.notes) clauses.push(`In their words: ${inquiry.notes}`);

  return clauses.join(". ");
}

/**
 * The lead row.
 *
 * `lead_id` is left out on purpose: the store assigns it inside its own retry, so a second
 * submission in the same second cannot take the same number.
 *
 * `next_action` is the CRM's own exit criterion for the `new` stage rather than an
 * instruction invented here, and the date is today, because the CRM's cadence says a lead
 * with no next action and no date is a lead that has been dropped. `owner` is left blank,
 * which reads as unassigned and is unassigned: nothing here knows whose lead it is.
 */
export function leadRowFrom(
  inquiry: Inquiry,
  reachable: Reachable,
  channelKinds: string[],
): Partial<Lead> {
  return {
    name: reachable.name,
    // The wording the two rows logged by hand already use, with the channels the renter
    // offered added to it. "website stay-request form (hi@)" and
    // "inbound (Google, /house-for-rent-chiang-mai)" are Nils's, from G-0005, and a form
    // writing rows beside his should not invent a second vocabulary for the same facts.
    contact_channel:
      channelKinds.length > 0
        ? `website stay-request form: ${channelKinds.join(", ")} (handles in ${CONTACT_EMAIL})`
        : `website stay-request form (${CONTACT_EMAIL})`,
    source: `inbound (${inquiry.found_via}, ${inquiry.from_page})`,
    received_date: inquiry.received_on,
    dates_requested: datesAsWritten(inquiry),
    nights: String(inquiry.nights),
    guests: String(inquiry.adults + inquiry.children),
    area_wanted: inquiry.area_wanted,
    budget_thb: budgetAsWritten(inquiry),
    requirements: requirementsCell(inquiry),
    stage: "new",
    next_action: "Make first contact",
    owner: "",
    next_action_date: inquiry.received_on,
    lost_reason: "",
  };
}

/**
 * The notification's rows, which are the one place the handles appear.
 *
 * The lead ID and the routing case lead, because the first question on reading one of these
 * is what has to happen next and where the record is.
 */
export function notificationRows(
  inquiry: Inquiry,
  reachable: Reachable,
  recordProblem: string | null,
): [string, string][] {
  const rows: [string, string][] = [];

  if (recordProblem) {
    rows.push(["NOT RECORDED", recordProblem]);
  } else {
    rows.push(["Lead", inquiry.lead_id]);
  }

  rows.push(["Routed as", inquiry.routing]);
  if (inquiry.property_name) rows.push(["Property asked about", inquiry.property_name]);
  rows.push(["Name", reachable.name]);
  rows.push(["Email", reachable.email || "not given"]);
  rows.push(["Phone", reachable.phone || "not given"]);
  rows.push(["WhatsApp", reachable.whatsapp || "not given"]);
  rows.push(["LINE", reachable.line || "not given"]);
  rows.push(["Answer in", languageName(inquiry.reply_language)]);
  rows.push(["Dates", `${inquiry.check_in} to ${inquiry.check_out} (${inquiry.nights} nights)`]);
  rows.push(["How fixed", inquiry.date_flexibility]);
  rows.push(["Guests", guestCount(inquiry)]);
  rows.push(["Area", inquiry.area_wanted]);
  rows.push(["Bedrooms, at least", inquiry.bedrooms_minimum || "not given"]);
  rows.push(["Budget", budgetAsWritten(inquiry) || "not given"]);
  rows.push([
    "Must-haves",
    inquiry.must_haves.length > 0 ? inquiry.must_haves.join(", ") : "none chosen",
  ]);
  rows.push(["Who is coming", inquiry.party || "not given"]);
  rows.push(["Vehicle", inquiry.vehicle || "not given"]);
  rows.push(["Pets", pets(inquiry) || "not given"]);
  rows.push(["Smoking", inquiry.smoking || "not given"]);
  rows.push(["How they found us", inquiry.found_via]);
  rows.push(["Sent from page", inquiry.from_page]);
  rows.push(["Wrote in", inquiry.wrote_in]);
  rows.push([
    "Consent to pass to an owner",
    `${inquiry.consent_to_pass_to_owner}: ${inquiry.consent_text}`,
  ]);

  return rows;
}
