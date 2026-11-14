import { NextResponse } from "next/server";
import { getDictionary } from "@/i18n";
import { isLocale, LOCALES } from "@/i18n/config";
import { addLeadFromRequestForm, writeInquiry } from "@/lib/admin/store";
import type { Inquiry } from "@/lib/admin/types";
import { today } from "@/lib/admin/types";
import { AREAS } from "@/lib/areas";
import { MAIL_CONFIGURED, notificationBody, sendMail } from "@/lib/mailer";
import { PROPERTIES } from "@/lib/property";
import { callerIp, rateLimit } from "@/lib/rate-limit";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";
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
  YES_NO,
  nightsBetween,
  type RoutingCase,
} from "@/lib/stay-request";
import { leadRowFrom, notificationRows, type Reachable } from "@/lib/stay-request-record";

// Node runtime for two reasons now: the SMTP transport is Node-only, and the document
// store reads and writes the filesystem when it is pointed at a local checkout.
export const runtime = "nodejs";

/**
 * Renter inquiries from the request form: the monthly-stay page, and every property page
 * that is listed for enquiry rather than bookable.
 *
 * Separate from /api/contact because the two leads are counted separately: an owner enquiry
 * and a renter request land in the same mailbox, and the subject line is what tells them
 * apart at a glance.
 *
 * THE ORDER IS THE DESIGN. The inquiry is recorded in the document store first, as a row in
 * guest-leads.csv and a structured record beside it, and only then is anything emailed. For
 * months this endpoint sent one email and persisted nothing, so there was no record an
 * inquiry had ever arrived except a message in a mailbox. A submission that cannot be
 * recorded is still emailed, because a renter who waited for a reply should get one, but it
 * is never emailed quietly: the subject says NOT RECORDED and the first row of the body says
 * what went wrong.
 *
 * What it does not do, and the reason each is out: nothing is delivered to a property
 * owner, because AgentSiam's LINE Official Account does not exist and the published privacy
 * policy does not yet name property owners among the recipients of a renter's data, and that
 * policy line ships in the same change as the delivery itself. The fan-out query that finds
 * the matching properties for an open requirement is not here either. All three routing
 * cases therefore land with AgentSiam, and the case is recorded so the leg that delivers
 * knows which one it is reading.
 *
 * "How did you find us?" stays required. It is the one question that tells us which page,
 * search or AI answer produced the lead, and it costs the renter one line.
 *
 * Nationality, passport, identity document and payment details are not collected, here or
 * on the form. None is needed to match a property, and the renter is charged nothing for an
 * introduction.
 */

const MAX = {
  name: 80,
  email: 160,
  phone: 60,
  whatsapp: 60,
  line: 60,
  area: 60,
  checkIn: 10,
  checkOut: 10,
  childrenAges: 60,
  petsSpecies: 40,
  foundVia: 200,
  page: 120,
  property: 60,
  locale: 8,
  message: 4000,
};

type Field = keyof typeof MAX;

function clean(value: unknown, field: Field): string {
  return typeof value === "string" ? value.trim().slice(0, MAX[field]) : "";
}

/** A fixed choice, or the fallback. Never the renter's own string: these words are written
 * into the document store and are matched against the property pool. */
function choice<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return (allowed as readonly string[]).includes(trimmed) ? (trimmed as T) : fallback;
}

/**
 * A fixed choice that is allowed to be unanswered, and is unanswered by default.
 *
 * The four questions behind the form's disclosure, who is coming, a vehicle, pets and
 * smoking, are selected rather than typed, and most renters never open that block. A
 * fallback of "a couple" or "no pets" would write an answer nobody gave into a lead row
 * somebody then sources a property against, so blank stays blank.
 */
function optionalChoice(value: unknown, allowed: readonly string[]): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return allowed.includes(trimmed) ? trimmed : "";
}

/** A whole number inside a range, or the fallback. A form that posts "many" adults is a
 * hand-rolled POST, not a family. */
function count(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isFinite(parsed)) return fallback;
  const whole = Math.round(parsed);
  if (whole < min || whole > max) return fallback;
  return whole;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Which of the three cases this is, from the property the form was sitting on.
 *
 * `beds24` is the field that decides it, and it is the only field in the code that says who
 * holds the calendar: a property with a Beds24 room is one AgentSiam manages and can answer
 * out of the reservation system, and a property without one is listed on agentsiam.com and
 * on no channel, so its owner has to be asked. A slug nothing matches is treated as an open
 * requirement rather than refused, because the lead matters more than the hidden field: a
 * renamed route must not lose an inquiry.
 */
function routeInquiry(slug: string): { routing: RoutingCase; name: string; slug: string } {
  if (!slug) return { routing: "open requirement", name: "", slug: "" };
  const property = PROPERTIES.find((item) => item.slug === slug);
  if (!property) return { routing: "open requirement", name: "", slug: "" };
  return {
    routing: property.beds24 ? "managed property" : "listed with AgentSiam",
    name: property.title,
    slug: property.slug,
  };
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  // Honeypot. Answer 200 so a bot does not learn to retry with the field cleared.
  if (clean(body.company, "name")) {
    return NextResponse.json({ ok: true });
  }

  if (rateLimit("stay-request", callerIp(request), { max: 6, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json(
      { error: `Too many messages. Please email us at ${CONTACT_EMAIL}.` },
      { status: 429 },
    );
  }

  const name = clean(body.name, "name");
  const reachable: Reachable = {
    name,
    email: clean(body.email, "email"),
    phone: clean(body.phone, "phone"),
    whatsapp: clean(body.whatsapp, "whatsapp"),
    line: clean(body.line, "line"),
  };

  const checkIn = clean(body.checkIn, "checkIn");
  const checkOut = clean(body.checkOut, "checkOut");
  const foundVia = clean(body.foundVia, "foundVia");
  const page = clean(body.page, "page");
  const message = clean(body.message, "message");

  const locale = clean(body.locale, "locale");
  const wroteIn = isLocale(locale) ? locale : "en";
  const replyLanguage = choice(body.replyLanguage, LOCALES, wroteIn);

  // At least one channel, and the kind is named by which field it came in. Email-only
  // excluded Thai and Chinese renters who use LINE and nothing else.
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reachable.email);
  const channelKinds = [
    emailOk ? "email" : "",
    reachable.phone ? "phone" : "",
    reachable.whatsapp ? "WhatsApp" : "",
    reachable.line ? "LINE" : "",
  ].filter(Boolean);

  const datesOk = ISO_DATE.test(checkIn) && ISO_DATE.test(checkOut) && checkOut > checkIn;

  if (!name || !foundVia || !datesOk || channelKinds.length === 0) {
    return NextResponse.json(
      {
        error:
          "Please check the name, the dates, how you found us, and that there is at least " +
          "one way to reach you.",
      },
      { status: 400 },
    );
  }

  if (reachable.email && !emailOk) {
    return NextResponse.json({ error: "That email address does not look right." }, { status: 400 });
  }

  const route = routeInquiry(clean(body.property, "property"));
  const area = clean(body.area, "area");
  const children = count(body.children, 0, MAX_CHILDREN, 0);
  const pets = optionalChoice(body.pets, PETS);
  const budgetAmount = count(body.budgetAmount, 1, 100_000_000, 0);

  const mustHaves = Array.isArray(body.mustHaves)
    ? MUST_HAVES.filter((want) => (body.mustHaves as unknown[]).includes(want))
    : [];

  const inquiry: Inquiry = {
    // Assigned by the store when the row is appended, inside its own retry.
    lead_id: "",
    received_on: today(),
    received_at: new Date().toISOString(),
    routing: route.routing,
    property_ref: route.slug,
    property_name: route.name,
    reply_language: replyLanguage,
    wrote_in: wroteIn,
    from_page: page || "unknown",
    contact_channels: channelKinds,
    check_in: checkIn,
    check_out: checkOut,
    nights: nightsBetween(checkIn, checkOut),
    date_flexibility: choice(body.flexibility, DATE_FLEXIBILITY, "exact"),
    adults: count(body.adults, 1, MAX_ADULTS, 1),
    children,
    children_ages: children > 0 ? clean(body.childrenAges, "childrenAges") : "",
    budget_amount: budgetAmount === 0 ? null : budgetAmount,
    budget_unit: choice(body.budgetUnit, BUDGET_UNITS, "per month"),
    budget_currency: choice(body.budgetCurrency, CURRENCIES, "THB"),
    // The area list is the site's own, and the blank is the flexible answer rather than a
    // missing one, which is why it is written as a word rather than left empty. "Any" is
    // the word the lead file already uses for it.
    area_wanted: AREAS.some((item) => item.name === area) ? area : "Any",
    bedrooms_minimum: choice(body.bedrooms, BEDROOM_MINIMUMS, "2"),
    must_haves: [...mustHaves],
    party: optionalChoice(body.party, PARTY),
    vehicle: optionalChoice(body.vehicle, YES_NO),
    pets,
    pets_count: pets === "" || pets === "none" ? null : count(body.petsCount, 1, MAX_PETS, 1),
    pets_species: pets === "other" ? clean(body.petsSpecies, "petsSpecies") : "",
    smoking: optionalChoice(body.smoking, SMOKING),
    notes: message,
    found_via: foundVia,
    consent_to_pass_to_owner: body.consentOwner === true || body.consentOwner === "yes" ? "yes" : "no",
    // The words they actually read, taken from the dictionary of the page they read them on
    // rather than from the request, so the consent record cannot be rewritten by whoever
    // posts the form.
    consent_text: getDictionary(wroteIn).srConsentOwner,
  };

  /* The record first, and the whole record: the row a person reads, then the structured
   * file a filter can read. A failure in either is carried into the email rather than
   * swallowed. */
  let recordProblem: string | null = null;
  try {
    inquiry.lead_id = await addLeadFromRequestForm(
      leadRowFrom(inquiry, reachable, channelKinds),
      inquiry.from_page,
    );
  } catch (error) {
    recordProblem = `The lead row could not be written: ${
      error instanceof Error ? error.message : "unknown error"
    }`;
    console.error("[stay-request] lead row not written", error);
  }

  if (!recordProblem) {
    try {
      await writeInquiry(inquiry);
    } catch (error) {
      recordProblem = `Lead row ${inquiry.lead_id} was written, but its structured record was not: ${
        error instanceof Error ? error.message : "unknown error"
      }`;
      console.error("[stay-request] inquiry record not written", error);
    }
  }

  const dates = `${checkIn} to ${checkOut}`;
  const subject = recordProblem
    ? `NOT RECORDED, stay request: ${name}, ${dates}`
    : `Stay request ${inquiry.lead_id}: ${name}, ${dates}, ${route.routing}`;

  let sent = false;
  if (MAIL_CONFIGURED) {
    const { html, text } = notificationBody(
      `New stay request from ${SITE_NAME}.com`,
      notificationRows(inquiry, reachable, recordProblem),
      message,
    );
    sent = await sendMail({
      subject,
      html,
      text,
      replyTo: emailOk ? reachable.email : undefined,
    });
  } else {
    console.error("[stay-request] no mail transport configured, nobody was notified");
  }

  // Nothing kept it and nobody was told: the only honest answer is that it did not go.
  if (recordProblem && !sent) {
    return NextResponse.json(
      { error: `Sending failed. Please email us at ${CONTACT_EMAIL}.` },
      { status: 502 },
    );
  }

  if (!sent) {
    console.error(
      `[stay-request] ${inquiry.lead_id} is recorded but no notification was sent`,
    );
  }

  return NextResponse.json({ ok: true });
}
