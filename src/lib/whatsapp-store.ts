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

/**
 * How long a conversation is kept: twelve months from its most recent message. This is
 * published in the privacy policy, under "How long we keep it", so the period here and the
 * period there move together or the policy is false.
 *
 * Two mechanisms, because neither covers the other. The message list carries a Redis TTL
 * refreshed on every write, so the messages themselves go twelve months after the last one
 * whether or not anything reads this store again. The conversation index is a single hash
 * and Redis cannot expire one field of it, so entries past the cutoff are pruned when the
 * conversations are listed. That index is not a bare pointer: it holds the guest's name,
 * their number and the text of their last message, so leaving it behind would keep exactly
 * the data the TTL was there to remove.
 *
 * Pruning is on the read path and not on the webhook, which would pay an HGETALL on every
 * inbound message to delete something a year old. The cost is that a conversation nothing
 * has listed since its cutoff keeps its index entry until something does. Its messages are
 * already gone by then. A cron is what would close that last gap.
 */
const RETENTION_SECONDS = 60 * 60 * 24 * 365;

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
  await redis(["EXPIRE", messagesKey(m.waId), RETENTION_SECONDS]);

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

/**
 * Drop every conversation whose last message is older than the retention window, with the
 * delivery statuses of whatever messages are still listed under it.
 *
 * A list that has already reached its own TTL leaves its statuses behind, because the ids
 * needed to delete them went with it. What is left is a message id and a word like
 * "delivered": no number, no name, no content.
 */
async function pruneExpired(entries: Conversation[]): Promise<Conversation[]> {
  const cutoff = Math.floor(Date.now() / 1000) - RETENTION_SECONDS;
  const expired = entries.filter((c) => c.lastTs < cutoff);
  if (expired.length === 0) return entries;

  for (const c of expired) {
    const raw = await redis<string[]>(["LRANGE", messagesKey(c.waId), 0, -1]);
    const ids = raw.map((r) => (JSON.parse(r) as StoredMessage).id);
    if (ids.length > 0) await redis(["HDEL", STATUSES, ...ids]);
    await redis(["DEL", messagesKey(c.waId)]);
  }
  await redis(["HDEL", CONVERSATIONS, ...expired.map((c) => c.waId)]);

  return entries.filter((c) => c.lastTs >= cutoff);
}

export async function listConversations(limit: number): Promise<Conversation[]> {
  const flat = await redis<string[]>(["HGETALL", CONVERSATIONS]);
  const all: Conversation[] = [];
  for (let i = 1; i < flat.length; i += 2) all.push(JSON.parse(flat[i]) as Conversation);
  const live = await pruneExpired(all);
  return live.sort((a, b) => b.lastTs - a.lastTs).slice(0, limit);
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
