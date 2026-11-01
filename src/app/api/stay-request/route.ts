import { NextResponse } from "next/server";
import { MAIL_CONFIGURED, notificationBody, sendMail } from "@/lib/mailer";
import { callerIp, rateLimit } from "@/lib/rate-limit";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

// Node runtime for the same reason as /api/contact: the SMTP transport is Node-only.
export const runtime = "nodejs";

/**
 * Guest stay requests from the "tell us what you need" form on the monthly-stay pages.
 *
 * Separate from /api/contact because the two leads are counted separately: an owner
 * enquiry and a guest request land in the same mailbox, and the subject line is what tells
 * them apart at a glance. Same mailer, same honeypot, same throttle.
 *
 * "How did you find us?" is required. It is the one question that tells us which page,
 * search or AI answer produced the lead, and it costs the guest one line.
 */

const MAX = {
  name: 80,
  email: 160,
  phone: 60,
  area: 60,
  checkIn: 10,
  checkOut: 10,
  bedrooms: 10,
  budget: 80,
  foundVia: 200,
  page: 120,
  locale: 8,
  message: 4000,
};

type Field = keyof typeof MAX;

function clean(value: unknown, field: Field): string {
  return typeof value === "string" ? value.trim().slice(0, MAX[field]) : "";
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

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
  const email = clean(body.email, "email");
  const phone = clean(body.phone, "phone");
  const area = clean(body.area, "area");
  const checkIn = clean(body.checkIn, "checkIn");
  const checkOut = clean(body.checkOut, "checkOut");
  const bedrooms = clean(body.bedrooms, "bedrooms");
  const budget = clean(body.budget, "budget");
  const foundVia = clean(body.foundVia, "foundVia");
  const page = clean(body.page, "page");
  const locale = clean(body.locale, "locale");
  const message = clean(body.message, "message");

  const datesOk =
    ISO_DATE.test(checkIn) && ISO_DATE.test(checkOut) && checkOut > checkIn;

  if (!name || !foundVia || !datesOk || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please check the name, email, dates and how-you-found-us fields." },
      { status: 400 },
    );
  }

  if (!MAIL_CONFIGURED) {
    console.error("[stay-request] no mail transport configured, request was not delivered");
    return NextResponse.json(
      { error: `Sending failed. Please email us at ${CONTACT_EMAIL}.` },
      { status: 500 },
    );
  }

  const nights = Math.round(
    (Date.parse(checkOut) - Date.parse(checkIn)) / (24 * 60 * 60 * 1000),
  );

  const rows: [string, string][] = [
    ["Name", name],
    ["Email", email],
    ["Phone / WhatsApp / LINE", phone || "not given"],
    ["Area", area || "any"],
    ["Dates", `${checkIn} to ${checkOut} (${nights} nights)`],
    ["Bedrooms", bedrooms || "not given"],
    ["Budget", budget || "not given"],
    ["How they found us", foundVia],
    ["Sent from page", page || "unknown"],
    ["Wrote in", locale || "en"],
  ];

  const { html, text } = notificationBody(
    `New stay request from ${SITE_NAME}.com`,
    rows,
    message,
  );

  const sent = await sendMail({
    subject: `Stay request: ${name}, ${checkIn} to ${checkOut}${area ? `, ${area}` : ""}`,
    html,
    text,
    replyTo: email,
  });

  if (!sent) {
    return NextResponse.json(
      { error: `Sending failed. Please email us at ${CONTACT_EMAIL}.` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
