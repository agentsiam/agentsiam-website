import { NextResponse } from "next/server";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

// Node runtime, not edge: the Resend call is a plain fetch either way, but keeping
// this on Node avoids surprises if a future version reads a Node-only API.
export const runtime = "nodejs";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// Who the notification is delivered to, and what it is sent from. FROM must be on a
// domain verified in Resend, so it is deliberately not the same value as the mailbox
// that receives it. Set both in the Vercel project's environment variables.
const TO = process.env.CONTACT_TO_EMAIL ?? CONTACT_EMAIL;
const FROM = process.env.CONTACT_FROM_EMAIL ?? `${SITE_NAME} <noreply@agentsiam.com>`;

const MAX = { name: 80, email: 160, phone: 40, service: 120, message: 4000 };

type Field = keyof typeof MAX;

function clean(value: unknown, field: Field): string {
  return typeof value === "string" ? value.trim().slice(0, MAX[field]) : "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

  const firstName = clean(body.firstName, "name");
  const lastName = clean(body.lastName, "name");
  const email = clean(body.email, "email");
  const phone = clean(body.phone, "phone");
  const service = clean(body.service, "service");
  const message = clean(body.message, "message");

  if (!firstName || !lastName || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please check the name, email and message fields." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Missing configuration is our fault, not the visitor's. Log it and return a
    // message that points them at the mailbox directly rather than losing the lead.
    console.error("[contact] RESEND_API_KEY is not set, enquiry was not delivered");
    return NextResponse.json(
      { error: `Sending failed. Please email us at ${CONTACT_EMAIL}.` },
      { status: 500 },
    );
  }

  const rows: [string, string][] = [
    ["Name", `${firstName} ${lastName}`],
    ["Email", email],
    ["Phone", phone || "not given"],
    ["Service", service || "not selected"],
  ];

  const html = [
    `<h2>New enquiry from ${escapeHtml(SITE_NAME)}.com</h2>`,
    "<table cellpadding='6' style='border-collapse:collapse'>",
    ...rows.map(
      ([label, value]) =>
        `<tr><td style='color:#666'>${label}</td><td><strong>${escapeHtml(value)}</strong></td></tr>`,
    ),
    "</table>",
    `<p style='white-space:pre-wrap'>${escapeHtml(message)}</p>`,
  ].join("");

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        // Replying to the notification replies to the enquirer, not to the robot.
        reply_to: email,
        subject: `Website enquiry: ${firstName} ${lastName}${service ? ` (${service})` : ""}`,
        html,
        text: [
          ...rows.map(([label, value]) => `${label}: ${value}`),
          "",
          message,
        ].join("\n"),
      }),
    });

    if (!response.ok) {
      console.error("[contact] Resend rejected the send", response.status, await response.text());
      return NextResponse.json(
        { error: `Sending failed. Please email us at ${CONTACT_EMAIL}.` },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("[contact] Resend request threw", error);
    return NextResponse.json(
      { error: `Sending failed. Please email us at ${CONTACT_EMAIL}.` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
