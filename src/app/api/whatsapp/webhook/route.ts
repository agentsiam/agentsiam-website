import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { saveMessage, saveStatus, STORE_READY } from "@/lib/whatsapp-store";

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
    let stored = 0;
    for (const change of changes) {
      const value = change.value ?? {};
      const names = new Map((value.contacts ?? []).map((c) => [c.wa_id, c.profile?.name]));
      for (const m of value.messages ?? []) {
        const saved = await saveMessage(
          {
            id: m.id,
            waId: m.from,
            direction: "in",
            type: m.type,
            body: messageBody(m),
            ts: Number(m.timestamp),
          },
          names.get(m.from),
        );
        if (saved) stored += 1;
      }
      for (const s of value.statuses ?? []) await saveStatus(s.id, s.status);
    }
    return NextResponse.json({ ok: true, stored });
  } catch (error) {
    console.error("[whatsapp/webhook] store failed", error);
    return NextResponse.json({ error: "Store unavailable." }, { status: 503 });
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
  from: string;
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
    contacts?: { wa_id: string; profile?: { name?: string } }[];
    messages?: InboundMessage[];
    statuses?: { id: string; status: string }[];
  };
};

type WebhookPayload = Change & { entry?: { changes?: Change[] }[] };
