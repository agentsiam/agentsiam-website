import { NextResponse } from "next/server";
import { MAIL_CONFIGURED, notificationBody, sendMail } from "@/lib/mailer";
import { callerIp, rateLimit } from "@/lib/rate-limit";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

// Node runtime, not edge: the Resend call is a plain fetch either way, but keeping
// this on Node avoids surprises if a future version reads a Node-only API.
export const runtime = "nodejs";

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

  // Email or phone/LINE, at least one. A given email still has to look like one, because it
  // becomes the reply-to address.
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || (!emailOk && !phone) || (email && !emailOk) || !listed || !propertyType || !area || !bedrooms) {
    return NextResponse.json(
      { error: "Please check the name and contact fields." },
      { status: 400 },
    );
  }

  if (!MAIL_CONFIGURED) {
    // Missing configuration is our fault, not the visitor's. Log it and return a message
    // that points them at the mailbox directly rather than losing the lead.
    console.error("[contact] no mail transport configured, enquiry was not delivered");
    return NextResponse.json(
      { error: `Sending failed. Please email us at ${CONTACT_EMAIL}.` },
      { status: 500 },
    );
  }

  const rows: [string, string][] = [
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
    ["Wrote in", locale || "en"],
  ];

  const { html, text } = notificationBody(
    `New enquiry from ${SITE_NAME}.com`,
    rows,
    message || "(no message)",
  );

  const sent = await sendMail({
    subject: `Website enquiry: ${name} (${icp}${propertyType ? `, ${propertyType}` : ""})`,
    html,
    text,
    replyTo: emailOk ? email : undefined,
  });

  if (!sent) {
    return NextResponse.json(
      { error: `Sending failed. Please email us at ${CONTACT_EMAIL}.` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
