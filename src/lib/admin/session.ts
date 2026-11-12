/**
 * Who is signed in to the renter shortlist admin, and nothing else.
 *
 * Two people, no accounts, no database. A passphrase each, held in the Vercel project's
 * environment variables, is exchanged for a signed cookie that lasts thirty days. The
 * cookie carries the name it was issued to, so a candidate's history can say Paul or Nils.
 *
 * This module runs in both runtimes, so it uses Web Crypto and nothing from node:. The
 * proxy at src/proxy.ts imports it on the edge; the route handlers import it on Node.
 * Never import the store from here: that one reaches for the filesystem and would break
 * the edge bundle.
 *
 * Fail closed, deliberately. Without ADMIN_COOKIE_SECRET nothing can be signed, so nobody
 * can sign in and every admin URL stays shut. An unconfigured admin is an inaccessible
 * admin, never an open one.
 */

export const ADMIN_COOKIE = "as_admin";

/** Thirty days. Long enough that a phone does not ask every morning, short enough that a
 * stolen cookie is not a permanent key. */
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const SECRET = process.env.ADMIN_COOKIE_SECRET ?? "";

/**
 * The people, in the order they are offered nowhere: the passphrase is typed, not picked,
 * so this list is only ever walked to find which one matched.
 *
 * Written as literals rather than looked up by a computed key, because Next inlines
 * process.env references into the edge bundle at build time and a dynamic lookup resolves
 * to undefined there.
 *
 * Trimmed at both ends, here and on the way in. Whitespace around a passphrase is never
 * part of it: a value pasted into the Vercel field can arrive with a newline, a phone
 * keyboard adds a space after a word, and a copied string carries whatever came with it.
 * None of those should shut two people out of a live admin, and the set of passphrases
 * that differ only by the space around them has one member.
 */
const PEOPLE: ReadonlyArray<{ who: string; passphrase: string }> = [
  { who: "Paul", passphrase: (process.env.ADMIN_PASSPHRASE_PAUL ?? "").trim() },
  { who: "Nils", passphrase: (process.env.ADMIN_PASSPHRASE_NILS ?? "").trim() },
];

/** A secret shorter than this is a typo, not a secret. `openssl rand -base64 32` gives 44
 * characters. */
const MIN_SECRET_LENGTH = 32;

export const SESSION_SIGNING_READY = SECRET.length >= MIN_SECRET_LENGTH;

/** Sign-in is possible only when the secret can sign and at least one passphrase is set. */
export const ADMIN_CONFIGURED =
  SESSION_SIGNING_READY && PEOPLE.some((person) => person.passphrase.length > 0);

export type AdminSession = { who: string; expires: number };

function encodeBase64Url(bytes: Uint8Array): string {
  let raw = "";
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): Uint8Array {
  const standard = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = standard + "=".repeat((4 - (standard.length % 4)) % 4);
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

async function signingKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signature(payload: string): Promise<string> {
  const signed = await crypto.subtle.sign(
    "HMAC",
    await signingKey(),
    new TextEncoder().encode(payload),
  );
  return encodeBase64Url(new Uint8Array(signed));
}

/** Compares in time that does not depend on where the first difference is. The strings here
 * are short and attacker-supplied, so the cheap `===` would leak their shape. */
function sameString(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

/** The name the passphrase belongs to, or null. Every passphrase is checked even after one
 * matches, so a wrong guess takes the same time whichever person it was aimed at. */
export function whoSignedIn(passphrase: string): string | null {
  const typed = passphrase.trim();
  let matched: string | null = null;
  for (const person of PEOPLE) {
    if (person.passphrase.length > 0 && sameString(person.passphrase, typed)) {
      matched = person.who;
    }
  }
  return matched;
}

export async function issueSession(who: string): Promise<string> {
  const payload = encodeBase64Url(
    new TextEncoder().encode(
      JSON.stringify({ who, expires: Date.now() + ADMIN_COOKIE_MAX_AGE * 1000 }),
    ),
  );
  return `${payload}.${await signature(payload)}`;
}

/**
 * The session a cookie carries, or null for anything that is not a live, correctly signed
 * one. Null is the only failure: a malformed cookie, a forged signature and an expired
 * session are the same answer to the caller, which is no.
 */
export async function readSession(token: string | undefined): Promise<AdminSession | null> {
  if (!token || !SESSION_SIGNING_READY) return null;
  const [payload, provided] = token.split(".");
  if (!payload || !provided) return null;
  if (!sameString(await signature(payload), provided)) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload))) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    const { who, expires } = parsed as { who?: unknown; expires?: unknown };
    if (typeof who !== "string" || typeof expires !== "number") return null;
    if (expires < Date.now()) return null;
    return { who, expires };
  } catch {
    return null;
  }
}
