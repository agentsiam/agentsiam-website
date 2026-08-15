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
};

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
  // Which language the enquiry was written in, so the reply goes back in that language.
  const locale = clean(body.locale, "locale");

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please check the name, email and message fields." },
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
    ["Email", email],
    ["Phone / LINE", phone || "not given"],
    ["Property type", propertyType || "not selected"],
    ["Neighbourhood", area || "not selected"],
    ["Wrote in", locale || "en"],
  ];

  const { html, text } = notificationBody(
    `New enquiry from ${SITE_NAME}.com`,
    rows,
    message,
  );

  const sent = await sendMail({
    subject: `Website enquiry: ${name}${propertyType ? ` (${propertyType})` : ""}`,
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
