import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { listConversations, readMessages, saveMessage, STORE_READY } from "@/lib/whatsapp-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The guest-chat bridge's read and record endpoint. Never called by a browser.
 *
 * Every request carries `Authorization: Bearer <WA_BRIDGE_SECRET>`. Without it the answer is
 * 401 whatever was asked, because these are guests' messages.
 *
 * GET                 conversations, most recent first
 * GET ?waId=<number>  one conversation, oldest first
 * POST                record a message the bridge has just sent through Meta
 */

function authorised(request: Request): boolean {
  const secret = process.env.WA_BRIDGE_SECRET;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return Boolean(secret) && given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!STORE_READY) return NextResponse.json({ error: "Not configured." }, { status: 503 });

  const params = new URL(request.url).searchParams;
  const limit = Math.min(Number(params.get("limit")) || 30, 200);
  const waId = params.get("waId")?.replace(/^\+/, "");

  if (waId) return NextResponse.json({ messages: await readMessages(waId, limit) });
  return NextResponse.json({ conversations: await listConversations(limit) });
}

export async function POST(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  if (!STORE_READY) return NextResponse.json({ error: "Not configured." }, { status: 503 });

  const m = (await request.json()) as { id?: string; waId?: string; type?: string; body?: string; sentBy?: string };
  if (!m.id || !m.waId || typeof m.body !== "string") {
    return NextResponse.json({ error: "id, waId and body are required." }, { status: 400 });
  }

  await saveMessage({
    id: m.id,
    waId: m.waId.replace(/^\+/, ""),
    direction: "out",
    type: m.type ?? "text",
    body: m.body,
    ts: Math.floor(Date.now() / 1000),
    sentBy: m.sentBy,
  });
  return NextResponse.json({ ok: true });
}
