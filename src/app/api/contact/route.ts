import { NextResponse } from "next/server";
import {
  addOwnerLeadFromForm,
  findOwnerByContact,
  readOwnerLeads,
  updateOwnerLead,
  writeOwnerInquiry,
} from "@/lib/admin/store";
import type { Attribution, OwnerInquiry, OwnerLead } from "@/lib/admin/types";
import { today } from "@/lib/admin/types";
import { ATTRIBUTION_MAX } from "@/lib/attribution";
import { MAIL_CONFIGURED, notificationBody, sendMail } from "@/lib/mailer";
import { callerIp, rateLimit } from "@/lib/rate-limit";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

// Node runtime, not edge: the Resend call is a plain fetch either way, but keeping
// this on Node avoids surprises if a future version reads a Node-only API.
export const runtime = "nodejs";

// THE ORDER IS THE DESIGN, as in /api/stay-request: the lead is written into leads.csv in
// the document store first, with the enquiry as it arrived beside it in
// owner-inquiries/L-####.json, and only then is anything emailed. Until this, an owner
// enquiry was an email and nothing else, and every lead was retyped into the CRM by hand. A
// submission that cannot be recorded is still emailed, with NOT RECORDED in the subject and
// the reason in the first row, because an owner who waited for a reply should get one.
//
// Delivery lives in src/lib/mailer.ts, which picks Zoho SMTP or Resend from the
// environment. See DNS-EMAIL-RUNBOOK.md for why this site sends over SMTP today.

// Field lengths. propertyType and area are picked from fixed chip lists in the UI, so the
// caps here are a backstop against a hand-rolled POST rather than a real constraint.
const MAX = {
  name: 80,
  email: 160,
  phone: 60,
  propertyType: 40,
  area: 40,
  locale: 8,
  message: 4000,
  listed: 4,
  agency: 4,
  bedrooms: 4,
  listingUrl: 400,
  page: 120,
};

/**
 * The ICP tag, Nils 06/11/2026: the form is the first ICP filter. Occupancy is not asked;
 * it is read off the listing for the next 60 days at the reply step, against the internal
 * 50% line, so a listed property can only be narrowed to two ICPs here and the rest stays
 * pending until someone reads the listing or speaks to the owner.
 */
function icpTag(listed: string, agency: string, listingUrl: string): string {
  if (listed === "No") return "ICP5";
  if (listed !== "Yes") return "ICP pending";
  const pair = agency === "Yes" ? "ICP4 or ICP2" : agency === "No" ? "ICP3 or ICP1" : "ICP pending";
  return listingUrl ? `${pair}, read occupancy` : `${pair}, follow up: no listing`;
}

type Field = keyof typeof MAX;

/** The form's chip values, in English whatever the page language, to the CRM's own words
 * for `property_type`. A value with no match is written as the form sent it. */
const PROPERTY_TYPES: Record<string, string> = {
  House: "house",
  Townhouse: "townhouse",
  "Pool villa": "villa",
  "Condo / apartment": "condo",
};

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "referrer",
  "landing_path",
  "captured",
] as const;

/** Whatever the browser sent, cut to strings of a sane length. Never trusted for anything
 * but the record: it is the visitor's own URL, and anyone can type a URL. */
function cleanAttribution(value: unknown): Attribution {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const out = {} as Attribution;
  for (const key of ATTRIBUTION_KEYS) {
    const raw = input[key];
    out[key] = typeof raw === "string" ? raw.trim().slice(0, ATTRIBUTION_MAX) : "";
  }
  return out;
}

/** Two working days out, the reply the site promises, as the ISO date the CRM writes. Thai
 * public holidays are not known here, so a reply due across Songkran reads a day or two
 * early, which is the safe side to be wrong on. */
function twoWorkingDaysFrom(day: Date): string {
  const next = new Date(day);
  let added = 0;
  while (added < 2) {
    next.setUTCDate(next.getUTCDate() + 1);
    const weekday = next.getUTCDay();
    if (weekday !== 0 && weekday !== 6) added += 1;
  }
  return next.toISOString().slice(0, 10);
}

function clean(value: unknown, field: Field): string {
  return typeof value === "string" ? value.trim().slice(0, MAX[field]) : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  // Honeypot. A real person never sees this field, so anything in it is a bot.
  // Answer 200 so the bot does not learn to retry with the field cleared.
  if (clean(body.company, "name")) {
    return NextResponse.json({ ok: true });
  }

  // Throttled like the booking routes. Every accepted request sends real mail through the
  // Zoho relay, so an open loop here floods the enquiry mailbox and burns a daily quota
  // that the booking notifications also depend on.
  if (rateLimit("contact", callerIp(request), { max: 6, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json(
      { error: `Too many messages. Please email us at ${CONTACT_EMAIL}.` },
      { status: 429 },
    );
  }

  const name = clean(body.name, "name");
  const email = clean(body.email, "email");
  const phone = clean(body.phone, "phone");
  const propertyType = clean(body.propertyType, "propertyType");
  const area = clean(body.area, "area");
  const message = clean(body.message, "message");
  const listed = clean(body.listed, "listed");
  const agency = clean(body.agency, "agency");
  const bedrooms = clean(body.bedrooms, "bedrooms");
  const listingUrl = clean(body.listingUrl, "listingUrl");
  const icp = icpTag(listed, agency, listingUrl);
  // Which language the enquiry was written in, so the reply goes back in that language.
  const locale = clean(body.locale, "locale");
  const page = clean(body.page, "page") || "/contact";
  const attribution = cleanAttribution(body.attribution);

  // Email or phone/LINE, at least one. A given email still has to look like one, because it
  // becomes the reply-to address.
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || (!emailOk && !phone) || (email && !emailOk) || !listed || !propertyType || !area || !bedrooms) {
    return NextResponse.json(
      { error: "Please check the name and contact fields." },
      { status: 400 },
    );
  }

  /* The record first. */
  const receivedOn = today();
  const wroteIn = locale || "en";
  let leadId = "";
  let repeatOf: OwnerLead | null = null;
  let recordProblem: string | null = null;

  try {
    repeatOf = findOwnerByContact(await readOwnerLeads(), emailOk ? email : "", phone);
    if (repeatOf) {
      leadId = repeatOf.lead_id;
      await updateOwnerLead(
        leadId,
        { last_contact_date: receivedOn },
        "the owner form",
        `Website form again from ${page}, ${listed === "Yes" ? "listed" : "not listed"}, ` +
          `${bedrooms} bed ${propertyType}, ${area}. In their words: ${message || "(no message)"}`,
      );
    } else {
      const contactInfo = [email ? `email: ${email}` : "", phone ? `phone / LINE: ${phone}` : ""]
        .filter(Boolean)
        .join("; ");
      const notes = [
        `Website form, wrote in ${wroteIn}, from ${page}.`,
        `Listed: ${listed}.`,
        listed === "Yes" ? `With an agency: ${agency || "not answered"}.` : "",
        `Bedrooms: ${bedrooms}.`,
        listingUrl ? `Listing: ${listingUrl}.` : "No listing link given.",
        "Full enquiry: owner-inquiries/ in the CRM folder, under this lead ID.",
        message ? `In their words: ${message}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      leadId = await addOwnerLeadFromForm(
        {
          name,
          property_type: PROPERTY_TYPES[propertyType] ?? propertyType,
          area,
          units: "1",
          contact_channel: emailOk ? "email" : "phone",
          contact_info: contactInfo,
          source: "website-form",
          stage: "new",
          next_action: "Reply within two working days, in the language they wrote in",
          next_action_date: twoWorkingDaysFrom(new Date()),
          notes,
          history: `${receivedOn}: Website form enquiry received from ${page} (the owner form)`,
          received_date: receivedOn,
          icp_suggested: icp,
          utm_source: attribution.utm_source,
          utm_medium: attribution.utm_medium,
          utm_campaign: attribution.utm_campaign,
          referrer: attribution.referrer,
        },
        page,
      );

      const inquiry: OwnerInquiry = {
        lead_id: leadId,
        received_on: receivedOn,
        received_at: new Date().toISOString(),
        name,
        email,
        phone,
        wrote_in: wroteIn,
        form_page: page,
        listed,
        agency: listed === "Yes" ? agency : "",
        listing_url: listingUrl,
        bedrooms,
        property_type: propertyType,
        area,
        message,
        icp_suggested: icp,
        attribution,
      };
      try {
        await writeOwnerInquiry(inquiry);
      } catch (error) {
        recordProblem = `Lead row ${leadId} was written, but its enquiry record was not: ${
          error instanceof Error ? error.message : "unknown error"
        }`;
        console.error("[contact] owner inquiry record not written", error);
      }
    }
  } catch (error) {
    recordProblem = `${leadId ? `Lead ${leadId}` : "The lead row"} could not be written: ${
      error instanceof Error ? error.message : "unknown error"
    }`;
    console.error("[contact] lead not recorded", error);
  }

  const source = [
    attribution.utm_source,
    attribution.utm_medium,
    attribution.utm_campaign,
  ]
    .filter(Boolean)
    .join(" / ");

  const rows: [string, string][] = [
    ...(recordProblem ? ([["NOT RECORDED", recordProblem]] as [string, string][]) : []),
    ["Lead", leadId ? (repeatOf ? `${leadId}, a repeat enquiry` : `${leadId}, new`) : "none"],
    ["Name", name],
    ["ICP", icp],
    ["Email", email || "not given"],
    ["Phone / LINE", phone || "not given"],
    ["Listed now", listed || "not answered"],
    ["With an agency", listed === "Yes" ? agency || "not answered" : "n/a"],
    ["Listing link", listingUrl || "not given"],
    ["Bedrooms", bedrooms || "not selected"],
    ["Property type", propertyType || "not selected"],
    ["Neighbourhood", area || "not selected"],
    ["Wrote in", wroteIn],
    ["Form page", page],
    ["Campaign", source || "none"],
    ["Referrer", attribution.referrer || "none or this site"],
  ];

  const { html, text } = notificationBody(
    `New enquiry from ${SITE_NAME}.com`,
    rows,
    message || "(no message)",
  );

  const subject = recordProblem
    ? `NOT RECORDED, website enquiry: ${name} (${icp}${propertyType ? `, ${propertyType}` : ""})`
    : `Website enquiry ${leadId}${repeatOf ? ", repeat" : ""}: ${name} (${icp}${
        propertyType ? `, ${propertyType}` : ""
      })`;

  let sent = false;
  if (MAIL_CONFIGURED) {
    sent = await sendMail({
      subject,
      html,
      text,
      replyTo: emailOk ? email : undefined,
    });
  } else {
    // Missing configuration is our fault, not the visitor's. A recorded lead is still in the
    // CRM; an unrecorded one falls through to the error below, which points them at the
    // mailbox directly.
    console.error("[contact] no mail transport configured, nobody was notified");
  }

  if (!sent) {
    // Recorded but nobody told is still a lead in the CRM; not recorded and nobody told is
    // the only case where the honest answer is that it did not go.
    if (recordProblem) {
      return NextResponse.json(
        { error: `Sending failed. Please email us at ${CONTACT_EMAIL}.` },
        { status: 502 },
      );
    }
    console.error(`[contact] ${leadId} is recorded but no notification was sent`);
  }

  return NextResponse.json({ ok: true });
}
