import nodemailer, { type Transporter } from "nodemailer";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

/**
 * One way out for every email the site sends, server side only.
 *
 * There are two transports because the domain forced it. `agentsiam.com` is registered at
 * Wix, Wix does not permit nameserver changes, and Resend needs an MX record on a `send`
 * subdomain that the Wix DNS editor cannot create -- so Resend cannot verify this domain
 * while it stays where it is. Zoho already holds the mailboxes and its SPF already
 * authorises it, so SMTP works today with no DNS change at all. See DNS-EMAIL-RUNBOOK.md.
 *
 * Both transports live here so that swapping is a config change rather than a code change:
 * set the SMTP variables and mail goes via Zoho, set RESEND_API_KEY instead and it goes via
 * Resend. If the domain is ever transferred and Resend verified, nothing in this file or
 * its callers needs editing -- drop the SMTP variables and Resend takes over.
 *
 * SMTP wins when both are set, on the grounds that whoever configured the more specific
 * thing meant it.
 */

const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? "465");
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD ?? "";
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";

/** Where notifications land. */
export const MAIL_TO = process.env.CONTACT_TO_EMAIL ?? CONTACT_EMAIL;

/**
 * The From address.
 *
 * On Zoho this is not free text: Zoho rejects a From that is not the authenticated mailbox
 * or one of its aliases. So it defaults to SMTP_USER rather than to a `noreply@` address
 * that may not exist. Setting CONTACT_FROM_EMAIL to something Zoho does not own is the
 * likeliest cause of a 553 from the relay.
 */
export const MAIL_FROM =
  process.env.CONTACT_FROM_EMAIL ??
  (SMTP_USER ? `${SITE_NAME} <${SMTP_USER}>` : `${SITE_NAME} <noreply@agentsiam.com>`);

export const MAIL_CONFIGURED = Boolean((SMTP_HOST && SMTP_USER && SMTP_PASSWORD) || RESEND_API_KEY);

type Mail = {
  subject: string;
  html: string;
  text: string;
  /** Replying to a notification should reach the person who wrote in, not the robot. */
  replyTo?: string;
  /** Defaults to MAIL_TO. */
  to?: string;
};

// Built once per warm instance. Nodemailer pools connections, and rebuilding the
// transporter per message would open a new TLS session for every enquiry.
let transporter: Transporter | null = null;

function smtp(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    // 465 is implicit TLS; 587 upgrades with STARTTLS. Getting this pair wrong is the
    // other classic cause of a silent hang against Zoho.
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  return transporter;
}

/**
 * Sends one message. Never throws.
 *
 * Returns false rather than raising, because the callers differ in what a failure means:
 * the contact form must tell the visitor it did not go, while a booking notification is
 * best-effort behind a booking that is already safely in Beds24. Both want the detail in
 * the logs, and neither wants an exception surfacing to a guest.
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  const to = mail.to ?? MAIL_TO;

  if (SMTP_HOST && SMTP_USER && SMTP_PASSWORD) {
    try {
      await smtp().sendMail({
        from: MAIL_FROM,
        to,
        replyTo: mail.replyTo,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
      return true;
    } catch (error) {
      console.error("[mailer] SMTP send failed", error);
      return false;
    }
  }

  if (RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: MAIL_FROM,
          to: [to],
          reply_to: mail.replyTo,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        }),
      });
      if (!response.ok) {
        console.error("[mailer] Resend rejected the send", response.status, await response.text());
        return false;
      }
      return true;
    } catch (error) {
      console.error("[mailer] Resend request threw", error);
      return false;
    }
  }

  console.error("[mailer] no transport configured, message not sent:", mail.subject);
  return false;
}

/** Escapes text going into an HTML email body. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Renders a label/value table plus optional free text, which is the shape all three
 * notifications share. Keeping it here means an enquiry and a booking read the same way.
 */
export function notificationBody(
  heading: string,
  rows: [string, string][],
  message?: string,
  intro?: string,
): { html: string; text: string } {
  const html = [
    `<h2>${escapeHtml(heading)}</h2>`,
    intro ? `<p>${escapeHtml(intro)}</p>` : "",
    "<table cellpadding='6' style='border-collapse:collapse'>",
    ...rows.map(
      ([label, value]) =>
        `<tr><td style='color:#666'>${escapeHtml(label)}</td><td><strong>${escapeHtml(value)}</strong></td></tr>`,
    ),
    "</table>",
    message ? `<p style='white-space:pre-wrap'>${escapeHtml(message)}</p>` : "",
  ].join("");

  const text = [
    heading,
    intro ?? "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    message ?? "",
  ].join("\n");

  return { html, text };
}
