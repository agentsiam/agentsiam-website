import { NextResponse } from "next/server";
import { MAIL_CONFIGURED, notificationBody, sendMail } from "@/lib/mailer";
import { callerIp, rateLimit } from "@/lib/rate-limit";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

// Node runtime, for the same reason /api/contact is: the transport is a plain fetch either
// way, and staying off edge avoids a surprise if a future version reads a Node-only API.
export const runtime = "nodejs";

/**
 * Email capture for the two editorial outlets.
 *
 * **The list is a mailbox.** A signup arrives as mail at the enquiry address and is kept by
 * hand from there. That is the whole of it, and it is written down here rather than implied,
 * because the page now makes a promise -- one email when something new is published -- that
 * nothing in this repository can keep on its own. Until a sending path exists, the promise
 * is kept by a person, and the README's "Known gaps" says so.
 *
 * Why a mailbox and not a provider. Resend cannot verify this domain while it stays at Wix
 * (see DNS-EMAIL-RUNBOOK.md), and an ESP account is a decision with a monthly cost and a
 * data-processor relationship behind it, which is Paul's to make rather than a side effect
 * of a form. The capture is the part that cannot wait: a reader who would have subscribed
 * today is not available to be asked again tomorrow.
 *
 * What this route deliberately does not do: no double opt-in, no unsubscribe link, no
 * suppression list. Unsubscribing is replying to an issue, which the consent line on the
 * form states, and which works because a person reads the mailbox. Those three are the
 * work that a real sending path brings with it, and building any one of them here would be
 * a half of it that looks like the whole.
 */

const MAX = { email: 160, outlet: 32, locale: 8 };

type Field = keyof typeof MAX;

function clean(value: unknown, field: Field): string {
  return typeof value === "string" ? value.trim().slice(0, MAX[field]) : "";
}

/** The two outlets, by slug. Anything else is a hand-rolled POST and is not labelled. */
const OUTLET_NAME: Record<string, string> = {
  journal: "Journal of Chiang Mai (guests)",
  "host-newsletter": "Chiang Mai Host Newsletter (owners)",
};

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  // Honeypot, as on /api/contact. A real person never sees the field, so anything in it is
  // a bot, and the answer is 200 so it does not learn to retry with the field cleared.
  if (clean(body.company, "email")) {
    return NextResponse.json({ ok: true });
  }

  // Tighter than the contact form's six. A signup is one address typed once; a person who
  // genuinely wants to add four has a mailbox to write to, and the limit is what stands
  // between the enquiry inbox and a script with a word list.
  if (rateLimit("subscribe", callerIp(request), { max: 4, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json(
      { error: `Too many sign-ups. Please email us at ${CONTACT_EMAIL}.` },
      { status: 429 },
    );
  }

  const email = clean(body.email, "email");
  const outlet = clean(body.outlet, "outlet");
  const locale = clean(body.locale, "locale");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please check the email address." }, { status: 400 });
  }

  if (!MAIL_CONFIGURED) {
    // Our fault, not the reader's. Log it and point them at the mailbox rather than losing
    // someone who was willing to hand over an address.
    console.error("[subscribe] no mail transport configured, sign-up was not delivered");
    return NextResponse.json(
      { error: `Sign-up failed. Please email us at ${CONTACT_EMAIL}.` },
      { status: 500 },
    );
  }

  const { html, text } = notificationBody(
    `New newsletter sign-up on ${SITE_NAME}.com`,
    [
      ["Email", email],
      ["Outlet", OUTLET_NAME[outlet] ?? (outlet || "not given")],
      ["Read in", locale || "en"],
    ],
    // The body of the notification is the instruction, because the list is a mailbox and
    // whoever opens this is the list.
    "Add this address to the outlet's list. There is no automated list and no sending path: this mail is the record.",
  );

  const sent = await sendMail({
    subject: `Newsletter sign-up: ${OUTLET_NAME[outlet] ?? "unknown outlet"}`,
    html,
    text,
    // Reply-to the subscriber, so a welcome or a question goes to them in one click.
    replyTo: email,
  });

  if (!sent) {
    return NextResponse.json(
      { error: `Sign-up failed. Please email us at ${CONTACT_EMAIL}.` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
