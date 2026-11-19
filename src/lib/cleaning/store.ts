/**
 * Where the cleaning app reads a schedule and keeps the little state it has.
 *
 * Upstash Redis over its REST API, plain `fetch` and no client library, which is the same
 * store and the same pattern as src/lib/whatsapp-store.ts. The Vercel Upstash integration
 * names its variables `KV_REST_API_*`; a store created directly at Upstash names them
 * `UPSTASH_REDIS_REST_*`. Either pair works, the same way the rest of the site accepts
 * either, and the `cleaning-schedule` skill's publish step reads the same two names.
 *
 * Two backends, picked from the environment and never mixed:
 *
 *   KV_REST_API_URL + TOKEN  -> the real store, which is how production works and the only
 *                               place a live door code ever sits.
 *   CLEANING_LOCAL_PATH      -> a documents JSON file on this disk, which is how this app is
 *                               developed. It is what `build_note.py --publish` wrote, built
 *                               from a payload with invented codes and invented phone
 *                               numbers. The state this app writes goes in a sibling file
 *                               beside it. Nothing local is ever committed.
 *
 * Credentials win when both are set, so a stray local path on a deployed instance can never
 * shadow the real store. That is the same precedence as the admin's document store.
 *
 * Neither set is not an empty schedule. The store says it is not configured and the screen
 * says so too: a lookup that reaches across a boundary and finds its source absent stops
 * rather than passing with partial data.
 *
 * Node only. The filesystem import would break the edge bundle, so nothing on the edge,
 * src/proxy.ts included, may import this file. The proxy checks a cookie signature and
 * never reaches the store, which is the whole reason the device check is made again inside
 * every page and route.
 */

import { readFile, writeFile, rename } from "node:fs/promises";
import { dirname, join, basename } from "node:path";

const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "";
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
const LOCAL = process.env.CLEANING_LOCAL_PATH ?? "";

export type StoreMode = "redis" | "local" | "none";

export function storeMode(): StoreMode {
  if (REDIS_URL && REDIS_TOKEN) return "redis";
  if (LOCAL) return "local";
  return "none";
}

/** What is missing, in words, for Paul's screen to print. Null when the store is usable.
 * Never shown to the team: their screens say to ask Paul in LINE and nothing else. */
export function storeProblem(): string | null {
  if (storeMode() !== "none") return null;
  return (
    "No store is configured, so there is no schedule to read. Set KV_REST_API_URL and " +
    "KV_REST_API_TOKEN to the Upstash store the schedule is published into, or " +
    "CLEANING_LOCAL_PATH to a documents JSON file on this machine for development."
  );
}

export function storeDescription(): string {
  const mode = storeMode();
  if (mode === "redis") return "the Upstash store";
  if (mode === "local") return `the local fixture at ${LOCAL}`;
  return "no store";
}

/* -------------------------------------------------------------------------- *
 * The keys. Written once, here.
 * -------------------------------------------------------------------------- */

/** One person's published document. Written by the skill, read by this app, never written
 * here: the app holds a projection and never the master. */
export const noteKey = (person: string) => `cleaning:note:${person}`;

/** When she last opened her schedule, and the visit lines she was shown. Reserved for this
 * app; the skill never writes it. */
export const seenKey = (person: string) => `cleaning:seen:${person}`;

/**
 * Which cleans she has said yes to, and the line each one read when she did.
 *
 * Reserved for this app like `seenKey`, and the skill never writes it. The two are not the
 * same answer: seen is what she was shown, this is what she took on. A clean she scrolled
 * past is seen and not accepted.
 */
export const acceptKey = (person: string) => `cleaning:accept:${person}`;

/**
 * Every clean Paul has moved from the person it was published to, in one key.
 *
 * One key rather than one per person, because a move is a fact about a clean and not about
 * either of them: both sides of it have to be read on every render, and two keys that
 * disagree would mean a clean on nobody's screen or on two. Reserved for this app, and the
 * skill never writes it; until the skill reads it, the LINE Note still names the person it
 * was published to.
 */
export const ASSIGN_KEY = "cleaning:assign";

/**
 * The cleans she has already done, which her published document no longer carries.
 *
 * Reserved for this app, and the skill never writes it. A published document starts at
 * today: the run builds from the bookings ahead, so the clean she did yesterday is not in
 * the document the app reads this morning. Paul, 19/11/2026: she has to be able to look back
 * at last month's cleans, because the payslip for them arrives as a photograph in the thread
 * on that clean, and the thread is reached through the clean.
 *
 * It is a ledger of what was published to her and never a schedule: nothing in it is ahead
 * of today, nothing in it decides anything, and losing it costs her the way back to a thread
 * rather than a day's work.
 */
export const historyKey = (person: string) => `cleaning:history:${person}`;

/** One enrolled phone. Deleting this is what revokes that phone, which is how Paul kills a
 * device without touching the lock. */
export const deviceKey = (device: string) => `cleaning:device:${device}`;

/** The device ids enrolled to one person, as a JSON array. A plain string rather than a
 * Redis set, so the local fixture backend can hold exactly the same value. */
export const deviceIndexKey = (person: string) => `cleaning:devices:${person}`;

/** A single-use enrolment token. Spending it is deleting it. */
export const enrolKey = (token: string) => `cleaning:enrol:${token}`;

/** Her PIN, salted and hashed. Never the PIN itself. */
export const pinKey = (person: string) => `cleaning:pin:${person}`;

/** Failed PIN tries for one person on one device. In the shared store on purpose: the
 * per-instance limiter in src/lib/rate-limit.ts is one bucket per warm instance by its own
 * admission, which is fine in front of a contact form and not fine in front of a door
 * code, where an attacker spread across cold starts gets as many tries as they like. */
export const pinFailKey = (person: string, device: string) =>
  `cleaning:pinfail:${person}:${device}`;

export const NOTE_PREFIX = "cleaning:note:";
export const DEVICE_INDEX_PREFIX = "cleaning:devices:";

export class CleaningStoreError extends Error {}

/* -------------------------------------------------------------------------- *
 * Redis over the REST API.
 * -------------------------------------------------------------------------- */

type Command = (string | number)[];

async function redis<T = unknown>(command: Command): Promise<T> {
  const response = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const json = (await response.json()) as { result?: T; error?: string };
  if (!response.ok || json.error) {
    // The command name only. An argument here can be a door code or a PIN hash.
    throw new CleaningStoreError(`redis ${command[0]}: ${json.error ?? response.status}`);
  }
  return json.result as T;
}

/* -------------------------------------------------------------------------- *
 * The local fixture.
 * -------------------------------------------------------------------------- */

type LocalEntry = { value: string; expires?: number };
type LocalState = Record<string, LocalEntry>;

/** The state file sits beside the documents file it belongs to, so one variable names
 * both and a fixture directory can be thrown away in one move. */
function localStatePath(): string {
  return join(dirname(LOCAL), `${basename(LOCAL, ".json")}.state.json`);
}

async function readLocalState(): Promise<LocalState> {
  try {
    const raw = await readFile(localStatePath(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    const now = Date.now();
    const live: LocalState = {};
    for (const [key, entry] of Object.entries(parsed as LocalState)) {
      if (!entry || typeof entry.value !== "string") continue;
      if (entry.expires && entry.expires <= now) continue;
      live[key] = entry;
    }
    return live;
  } catch {
    return {};
  }
}

async function writeLocalState(state: LocalState): Promise<void> {
  const path = localStatePath();
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  await rename(temporary, path);
}

/**
 * One person's document out of the fixture.
 *
 * The fixture is the whole file `build_note.py --publish` wrote, `{built_at, people}`, while
 * the store holds one person's document per key. Each person's document carries its own
 * `built_at` from 17/11/2026, so the lift below is only for a fixture built before that and
 * never overwrites a timestamp the document already has.
 */
async function localDocument(person: string): Promise<unknown | null> {
  let raw: string;
  try {
    raw = await readFile(LOCAL, "utf8");
  } catch {
    throw new CleaningStoreError(
      `CLEANING_LOCAL_PATH points at ${LOCAL}, which cannot be read. It should be the file ` +
        `build_note.py --publish wrote.`,
    );
  }
  const parsed = JSON.parse(raw) as { built_at?: unknown; people?: Record<string, unknown> };
  const document = parsed.people?.[person];
  if (!document || typeof document !== "object") return null;
  const record = document as Record<string, unknown>;
  if (typeof parsed.built_at === "string" && typeof record.built_at !== "string") {
    return { ...record, built_at: parsed.built_at };
  }
  return document;
}

async function localPeople(): Promise<string[]> {
  try {
    const raw = await readFile(LOCAL, "utf8");
    const parsed = JSON.parse(raw) as { people?: Record<string, unknown> };
    return Object.keys(parsed.people ?? {});
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- *
 * The six operations every caller in this app is written against.
 * -------------------------------------------------------------------------- */

function requireStore(): StoreMode {
  const mode = storeMode();
  if (mode === "none") throw new CleaningStoreError(storeProblem() as string);
  return mode;
}

export async function get(key: string): Promise<string | null> {
  if (requireStore() === "redis") return redis<string | null>(["GET", key]);
  const state = await readLocalState();
  return state[key]?.value ?? null;
}

export async function set(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (requireStore() === "redis") {
    await redis(ttlSeconds ? ["SET", key, value, "EX", ttlSeconds] : ["SET", key, value]);
    return;
  }
  const state = await readLocalState();
  state[key] = ttlSeconds ? { value, expires: Date.now() + ttlSeconds * 1000 } : { value };
  await writeLocalState(state);
}

export async function del(key: string): Promise<void> {
  if (requireStore() === "redis") {
    await redis(["DEL", key]);
    return;
  }
  const state = await readLocalState();
  delete state[key];
  await writeLocalState(state);
}

/**
 * Read a key and delete it in one step, which is how an enrolment token is spent.
 *
 * One step matters: a read then a delete leaves a window in which a forwarded link opens
 * twice, and that window is exactly the attack the single-use link exists to close.
 */
export async function getdel(key: string): Promise<string | null> {
  if (requireStore() === "redis") return redis<string | null>(["GETDEL", key]);
  const state = await readLocalState();
  const entry = state[key];
  if (!entry) return null;
  delete state[key];
  await writeLocalState(state);
  return entry.value;
}

/** Add one, and set the window on the first failure of a run. Returns the count. */
export async function incr(key: string, ttlSeconds: number): Promise<number> {
  if (requireStore() === "redis") {
    const count = await redis<number>(["INCR", key]);
    if (count === 1) await redis(["EXPIRE", key, ttlSeconds]);
    return count;
  }
  const state = await readLocalState();
  const entry = state[key];
  const count = entry ? Number(entry.value) + 1 : 1;
  state[key] = {
    value: String(count),
    expires: entry?.expires ?? Date.now() + ttlSeconds * 1000,
  };
  await writeLocalState(state);
  return count;
}

/** Every key under a prefix. Only Paul's screen calls this, to list who exists without
 * this app holding a roster of its own. */
export async function keysUnder(prefix: string): Promise<string[]> {
  if (requireStore() === "redis") {
    const found: string[] = [];
    let cursor = "0";
    do {
      const page = await redis<[string, string[]]>([
        "SCAN",
        cursor,
        "MATCH",
        `${prefix}*`,
        "COUNT",
        200,
      ]);
      cursor = page[0];
      found.push(...page[1]);
    } while (cursor !== "0");
    return [...new Set(found)];
  }
  const state = await readLocalState();
  const fromState = Object.keys(state).filter((key) => key.startsWith(prefix));
  // The documents live in the fixture file rather than in the state file, so the note keys
  // are synthesised from it. Same answer as a SCAN against the real store.
  if (prefix === NOTE_PREFIX) {
    const people = await localPeople();
    return [...new Set([...fromState, ...people.map(noteKey)])];
  }
  return fromState;
}

/** One person's published document, as JSON, or null when nothing is published for her. */
export async function readNote(person: string): Promise<unknown | null> {
  if (requireStore() === "redis") {
    const raw = await redis<string | null>(["GET", noteKey(person)]);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      throw new CleaningStoreError(`${noteKey(person)} is not readable JSON.`);
    }
  }
  return localDocument(person);
}
