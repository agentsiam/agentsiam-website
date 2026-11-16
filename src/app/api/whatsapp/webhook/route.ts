import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { notificationBody, sendMail } from "@/lib/mailer";
import { conversationKey, saveMessage, saveStatus, STORE_READY } from "@/lib/whatsapp-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Meta's WhatsApp Cloud API webhook: guest messages arrive here.
 *
 * GET is Meta's one-time subscription handshake, answered only with the verify token we
 * chose. POST carries messages and delivery statuses, signed with the app secret; anything
 * unsigned or wrongly signed is refused before it is parsed.
 *
 * Meta retries a non-2xx for days, so the only failure answered with one is the store being
 * down, which is worth retrying. A payload we cannot read is logged and acknowledged.
 *
 * Every new guest message is also emailed to the team, because a message nobody is told
 * about is a guest waiting. A retried delivery is not stored twice, so it is not emailed
 * twice either.
 *
 * A sender is not necessarily a phone number. A guest who has adopted a WhatsApp username
 * arrives with their number withheld and a business-scoped user ID in its place, so nothing
 * here may assume `from` is there: see `conversationKey` for which of the two a conversation
 * is filed under.
 */

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const token = process.env.WA_VERIFY_TOKEN;
  const given = params.get("hub.verify_token") ?? "";
  if (token && params.get("hub.mode") === "subscribe" && safeEqual(given, token)) {
    return new Response(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const secret = process.env.WA_APP_SECRET;
  if (!secret || !STORE_READY) {
    console.error("[whatsapp/webhook] WA_APP_SECRET or the Redis store is not configured");
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  // The raw body, not the parsed one: the signature is over the exact bytes Meta sent.
  const raw = await request.text();
  const expected = "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
  if (!safeEqual(request.headers.get("x-hub-signature-256") ?? "", expected)) {
    return NextResponse.json({ error: "Bad signature." }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(raw) as WebhookPayload;
  } catch {
    console.warn("[whatsapp/webhook] unreadable payload");
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Live deliveries wrap each change in entry[].changes[]; the dashboard's Test button sends
  // the change on its own.
  const changes = payload.entry?.flatMap((e) => e.changes ?? []) ?? (payload.field ? [payload] : []);

  try {
    const fresh: FreshMessage[] = [];
    for (const change of changes) {
      const value = change.value ?? {};
      // Indexed under both identifiers, because which one a contact entry carries is Meta's
      // choice and not ours.
      const contacts = value.contacts ?? [];
      const byPhone = new Map(contacts.flatMap((c) => (c.wa_id ? [[c.wa_id, c] as const] : [])));
      const byUserId = new Map(contacts.flatMap((c) => (c.user_id ? [[c.user_id, c] as const] : [])));
      for (const m of value.messages ?? []) {
        const waId = await conversationKey(m.from, m.from_user_id);
        if (!waId) {
          // Nothing to file it under. Acknowledged rather than retried, because a redelivery
          // of the same payload would be just as anonymous.
          console.warn("[whatsapp/webhook] message", m.id, "carries neither from nor from_user_id");
          continue;
        }
        const contact =
          (m.from ? byPhone.get(m.from) : undefined) ??
          (m.from_user_id ? byUserId.get(m.from_user_id) : undefined);
        const name = contact?.profile?.name;
        const username = contact?.profile?.username;
        const body = messageBody(m);
        const saved = await saveMessage(
          {
            id: m.id,
            waId,
            userId: m.from_user_id,
            direction: "in",
            type: m.type,
            body,
            ts: Number(m.timestamp),
          },
          { name, username },
        );
        if (saved) fresh.push({ waId, phone: m.from, name, username, body });
      }
      for (const s of value.statuses ?? []) await saveStatus(s.id, s.status);
    }
    if (fresh.length > 0) await notifyTeam(fresh);
    return NextResponse.json({ ok: true, stored: fresh.length });
  } catch (error) {
    console.error("[whatsapp/webhook] store failed", error);
    return NextResponse.json({ error: "Store unavailable." }, { status: 503 });
  }
}

type FreshMessage = { waId: string; phone?: string; name?: string; username?: string; body: string };

async function notifyTeam(messages: FreshMessage[]): Promise<void> {
  for (const m of messages) {
    // A guest writing under a username has no number for us to show, and printing their
    // business-scoped ID behind a plus sign would be a number nobody can ring back.
    const who = m.name ?? (m.username ? `@${m.username}` : undefined);
    const rows: [string, string][] = [["From", who ?? "?"]];
    rows.push(m.phone ? ["Number", `+${m.phone}`] : ["WhatsApp ID", m.waId]);
    if (m.name && m.username) rows.push(["Username", `@${m.username}`]);
    const { html, text } = notificationBody(
      "New guest message on WhatsApp",
      rows,
      m.body,
      "Reply within 24 hours of the guest's last message, or only a template can be sent.",
    );
    const subject = who ?? (m.phone ? `+${m.phone}` : m.waId);
    const sent = await sendMail({ subject: `WhatsApp: ${subject}`, html, text });
    if (!sent) console.error("[whatsapp/webhook] message from", m.waId, "stored but not emailed");
  }
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function messageBody(m: InboundMessage): string {
  switch (m.type) {
    case "text":
      return m.text?.body ?? "";
    case "button":
      return m.button?.text ?? "";
    case "interactive":
      return m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "[interactive]";
    default: {
      const media = (m as Record<string, unknown>)[m.type] as { caption?: string } | undefined;
      return `[${m.type}]${media?.caption ? ` ${media.caption}` : ""}`;
    }
  }
}

type InboundMessage = {
  /** Withheld by Meta for a guest using a username, outside its thirty-day contact window. */
  from?: string;
  /** The sender's business-scoped user ID. Present on every message since April 2026. */
  from_user_id?: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  button?: { text: string };
  interactive?: { button_reply?: { title: string }; list_reply?: { title: string } };
};

type Change = {
  field?: string;
  value?: {
    contacts?: {
      wa_id?: string;
      user_id?: string;
      profile?: { name?: string; username?: string };
    }[];
    messages?: InboundMessage[];
    statuses?: { id: string; status: string }[];
  };
};

type WebhookPayload = Change & { entry?: { changes?: Change[] }[] };
