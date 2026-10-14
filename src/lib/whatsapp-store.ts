/**
 * WhatsApp guest messages, kept in Upstash Redis over its REST API.
 *
 * This is the shared store the guest-chat bridge reads: Meta's webhook writes inbound
 * messages here, and every session that replies (Claude Code, the Buzz agent Ariya) records
 * what it sent, so the whole conversation is in one place whichever of them answered.
 *
 * Plain fetch rather than a client library, so the site carries no new dependency. The
 * Vercel Upstash integration names its variables KV_REST_API_*; a store created directly
 * at Upstash names them UPSTASH_REDIS_REST_*. Either works.
 */

const URL_ = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const STORE_READY = Boolean(URL_ && TOKEN);

/** Messages kept per conversation. Older ones drop off the end of the list. */
const MAX_PER_CONVERSATION = 500;

export type StoredMessage = {
  id: string;
  waId: string;
  direction: "in" | "out";
  type: string;
  body: string;
  ts: number; // unix seconds
  sentBy?: string;
};

export type Conversation = {
  waId: string;
  name?: string;
  lastInboundTs?: number;
  lastTs: number;
  lastBody: string;
};

type Command = (string | number)[];

async function redis<T = unknown>(command: Command): Promise<T> {
  const res = await fetch(URL_!, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const json = (await res.json()) as { result?: T; error?: string };
  if (!res.ok || json.error) throw new Error(`redis ${command[0]}: ${json.error ?? res.status}`);
  return json.result as T;
}

const messagesKey = (waId: string) => `wa:msg:${waId}`;
const CONVERSATIONS = "wa:conversations";
const STATUSES = "wa:status";

/**
 * Store one message, once. Meta retries a webhook it thinks failed, so the same message id
 * can arrive twice; the first write wins and the second is a no-op.
 */
export async function saveMessage(m: StoredMessage, name?: string): Promise<boolean> {
  const fresh = await redis<string | null>(["SET", `wa:seen:${m.id}`, "1", "NX", "EX", 60 * 60 * 24 * 30]);
  if (fresh !== "OK") return false;

  await redis(["LPUSH", messagesKey(m.waId), JSON.stringify(m)]);
  await redis(["LTRIM", messagesKey(m.waId), 0, MAX_PER_CONVERSATION - 1]);

  const previous = await getConversation(m.waId);
  const conversation: Conversation = {
    waId: m.waId,
    name: name ?? previous?.name,
    lastInboundTs: m.direction === "in" ? Math.max(m.ts, previous?.lastInboundTs ?? 0) : previous?.lastInboundTs,
    lastTs: Math.max(m.ts, previous?.lastTs ?? 0),
    lastBody: m.ts >= (previous?.lastTs ?? 0) ? m.body : (previous?.lastBody ?? m.body),
  };
  await redis(["HSET", CONVERSATIONS, m.waId, JSON.stringify(conversation)]);
  return true;
}

export async function saveStatus(messageId: string, status: string): Promise<void> {
  await redis(["HSET", STATUSES, messageId, status]);
}

async function getConversation(waId: string): Promise<Conversation | undefined> {
  const raw = await redis<string | null>(["HGET", CONVERSATIONS, waId]);
  return raw ? (JSON.parse(raw) as Conversation) : undefined;
}

export async function listConversations(limit: number): Promise<Conversation[]> {
  const flat = await redis<string[]>(["HGETALL", CONVERSATIONS]);
  const all: Conversation[] = [];
  for (let i = 1; i < flat.length; i += 2) all.push(JSON.parse(flat[i]) as Conversation);
  return all.sort((a, b) => b.lastTs - a.lastTs).slice(0, limit);
}

/** The latest messages in one conversation, oldest first, each with its delivery status. */
export async function readMessages(
  waId: string,
  limit: number,
): Promise<(StoredMessage & { status?: string })[]> {
  const raw = await redis<string[]>(["LRANGE", messagesKey(waId), 0, limit - 1]);
  const messages = raw.map((r) => JSON.parse(r) as StoredMessage).reverse();
  if (messages.length === 0) return [];
  const statuses = await redis<(string | null)[]>(["HMGET", STATUSES, ...messages.map((m) => m.id)]);
  return messages.map((m, i) => ({ ...m, status: statuses[i] ?? (m.direction === "in" ? "received" : "sent") }));
}
