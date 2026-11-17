/**
 * Which phone is holding the app, and whether its PIN has been given recently.
 *
 * Three people, no accounts, no passwords and no recovery flow. Paul sends one of them a
 * single-use link in LINE; the first open of that link binds this phone to her and mints a
 * long-lived signed cookie. From then on her schedule needs the cookie alone, because she
 * opens it at a door with her hands full and the schedule is not the secret. Her door codes
 * need the cookie and a short PIN Paul told her, because they are.
 *
 * Deliberately not an extension of src/lib/admin/session.ts, whose shape this follows. That
 * one signs in Paul and Nils with passphrases from the environment and stands in front of a
 * GitHub token that can commit to the document store. This is a different trust zone with
 * different readers, so it is a different cookie, a different secret and a different
 * module, and a change to one cannot widen the other.
 *
 * Runs in both runtimes, so Web Crypto and nothing from node:. src/proxy.ts imports it on
 * the edge, where it checks a signature and nothing else. **A valid signature is not
 * access.** The device record has to exist in the store as well, and that check is made
 * inside every page and every route, which is what makes Paul deleting a device actually
 * revoke it.
 *
 * Fail closed. Without CLEANING_COOKIE_SECRET nothing can be signed, so no link can be
 * opened and no cookie can resolve. An unconfigured app is a shut app, never an open one.
 */

/** The phone, bound to one person. */
export const CLEANING_COOKIE = "as_clean";

/** That her PIN was given on this phone, a few minutes ago. */
export const CLEANING_PIN_COOKIE = "as_clean_pin";

/**
 * A year. Longer than the admin's thirty days on purpose: nobody here has a password to
 * fall back on, so an expiring cookie is a cleaner locked out at a door with Paul asleep.
 * What makes it safe is that revocation does not wait for it: deleting the device record
 * stops the cookie resolving the moment Paul presses the button.
 */
export const CLEANING_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Thirty days for the PIN, which used to be fifteen minutes.
 *
 * It changed because what the PIN guards changed. Paul's decision, 17/11/2026: it stands in
 * front of the whole app rather than in front of the codes alone, so she types it once and
 * then has her schedule and her codes both. Fifteen minutes in that position would mean
 * typing it at every gate before she could read a date, which is the opposite of what he
 * asked for.
 *
 * Thirty days rather than the year the device cookie gets, because the two are protecting
 * different things. The device cookie says which phone this is and Paul can revoke it from
 * his own screen the moment a phone goes missing. The PIN says who is holding it, and the
 * only case it covers is a phone lost and not yet revoked, which is a case that gets worse
 * the longer the window is. A month is light to type and short enough to matter.
 *
 * **The cost of the move is real and it is Paul's**: a phone somebody else picks up unlocked
 * is now one tap from the door codes for the rest of that window. The argument and the two
 * ways to narrow it are in `as-work/2026-11-17-cleaning-app-redesign/` in the consulting
 * repo. This number is the dial.
 */
export const CLEANING_PIN_MAX_AGE = 60 * 60 * 24 * 30;

const SECRET = process.env.CLEANING_COOKIE_SECRET ?? "";

/** A secret shorter than this is a typo, not a secret. `openssl rand -base64 32` gives 44
 * characters. Same floor as the admin's. */
const MIN_SECRET_LENGTH = 32;

export const CLEANING_CONFIGURED = SECRET.length >= MIN_SECRET_LENGTH;

/** A roster key, as the skill writes it. Narrow because it is concatenated into a store
 * key, and this is the only thing between a crafted cookie and an arbitrary key. */
export const PERSON_KEY = /^[a-z0-9_-]{1,32}$/;

/** A device id, as mintDeviceId writes them. */
export const DEVICE_ID = /^[A-Za-z0-9_-]{16,64}$/;

export type DeviceSession = { person: string; device: string; issued: number };
export type PinSession = { person: string; device: string; expires: number };

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

/** Compares in time that does not depend on where the first difference is. */
function sameString(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function sign(payload: unknown): Promise<string> {
  const encoded = encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${encoded}.${await signature(encoded)}`;
}

async function open(token: string | undefined): Promise<Record<string, unknown> | null> {
  if (!token || !CLEANING_CONFIGURED) return null;
  const [payload, provided] = token.split(".");
  if (!payload || !provided) return null;
  if (!sameString(await signature(payload), provided)) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload))) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function issueDeviceCookie(person: string, device: string): Promise<string> {
  return sign({ person, device, issued: Date.now() });
}

/**
 * The person and phone a cookie names, or null for anything that is not correctly signed.
 *
 * Null is the only failure: a malformed cookie, a forged signature and a key that is not a
 * roster key are the same answer to the caller, which is no. **Says nothing about whether
 * that phone is still enrolled**, which is a store lookup and is made separately, on the
 * Node side, by resolveDevice.
 */
export async function readDeviceCookie(token: string | undefined): Promise<DeviceSession | null> {
  const parsed = await open(token);
  if (!parsed) return null;
  const { person, device, issued } = parsed as {
    person?: unknown;
    device?: unknown;
    issued?: unknown;
  };
  if (typeof person !== "string" || !PERSON_KEY.test(person)) return null;
  if (typeof device !== "string" || !DEVICE_ID.test(device)) return null;
  if (typeof issued !== "number") return null;
  if (issued + CLEANING_COOKIE_MAX_AGE * 1000 < Date.now()) return null;
  return { person, device, issued };
}

export async function issuePinCookie(person: string, device: string): Promise<string> {
  return sign({ person, device, expires: Date.now() + CLEANING_PIN_MAX_AGE * 1000 });
}

/**
 * That her PIN was given recently, on this phone, by this person.
 *
 * Bound to both, so a PIN cookie cannot survive a re-enrolment onto another device and
 * cannot be carried between two people's phones.
 */
export async function readPinCookie(
  token: string | undefined,
  person: string,
  device: string,
): Promise<PinSession | null> {
  const parsed = await open(token);
  if (!parsed) return null;
  const session = parsed as { person?: unknown; device?: unknown; expires?: unknown };
  if (typeof session.expires !== "number" || session.expires < Date.now()) return null;
  if (session.person !== person || session.device !== device) return null;
  return { person, device, expires: session.expires };
}

/** 32 random bytes, which is what an enrolment link's whole security is. Long enough that
 * guessing one is not a strategy, and it is single-use and short-lived besides. */
export function mintEnrolToken(): string {
  return encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

/** 16 random bytes. Only ever compared against the store, never guessed at. */
export function mintDeviceId(): string {
  return encodeBase64Url(crypto.getRandomValues(new Uint8Array(16)));
}
