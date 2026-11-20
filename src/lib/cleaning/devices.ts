/**
 * Enrolled phones, enrolment links, and the PIN in front of the door codes.
 *
 * Everything here is the Node half of the sign-in: it reaches the store, which the edge
 * never does. src/lib/cleaning/session.ts holds the cookie half and runs in both runtimes.
 *
 * The shape, which follows the gate-and-door asymmetry the team already lives with:
 *
 *   enrolment    a link Paul sends in LINE, opened with her PIN. Every browser she opens it
 *                in gets its own record. Without the PIN the link is worth nothing.
 *   schedule     the device cookie resolving against a device record. No PIN.
 *   codes        the same, plus her PIN, checked against a counter in the shared store.
 *   revocation   Paul deletes the device record. The cookie stops resolving at once and no
 *                door is reprogrammed, which is the whole point of doing it this way.
 *
 * There is no recovery flow and that is the feature, not an omission. A lost phone is
 * re-enrolled by Paul sending a new link. Nothing here mails or texts a way back in.
 *
 * **A phone is not a device record and one person holds several.** A record is one browser's
 * cookie jar, so the same handset in LINE's in-app browser and in its own browser is two of
 * them, revoked separately. Nothing here caps the number, and `label` exists because nothing
 * else on the record tells them apart.
 *
 * **The link is not the secret any more, her PIN is.** That is the change of 20/11/2026 and
 * everything above follows from it. A single-use link had to die on its first open because
 * possession of it was the whole proof, which meant it enrolled whichever browser she
 * happened to tap it in and left the other one at a PIN gate with no cookie behind it,
 * looking spent. Now the same link opens any browser she has and five wrong PINs kill it.
 */

import { cleanDeviceLabel } from "./device-shape";
import {
  CLEANING_COOKIE_MAX_AGE,
  DEVICE_ID,
  PERSON_KEY,
  mintDeviceId,
  mintEnrolToken,
} from "./session";
import {
  DEVICE_INDEX_PREFIX,
  del,
  deviceIndexKey,
  deviceKey,
  enrolFailKey,
  enrolKey,
  get,
  incr,
  keysUnder,
  pinFailKey,
  pinKey,
  set,
} from "./store";

/**
 * How long an enrolment link lives. Thirty days, which was a week until 20/11/2026.
 *
 * It is a window now rather than slack, because the link is the thing she opens on each new
 * browser instead of once: LINE's browser today, her own browser when she gets to it, a
 * replacement phone the week after. A week meant Paul minting another link for every one of
 * those. Thirty days is the PIN session's own length, which is the other number she lives
 * with, and it still dies on its own, so a link in a LINE thread is not there for ever.
 */
export const ENROL_TOKEN_TTL = 60 * 60 * 24 * 30;

/** Wrong PINs allowed on one phone before it stops answering, and for how long. A four or
 * six digit PIN has almost no entropy, so the counter is what protects the codes and not
 * the hash. It lives in the shared store for exactly that reason. */
export const PIN_MAX_FAILURES = 5;
export const PIN_LOCK_SECONDS = 60 * 15;

/** Wrong PINs allowed against one enrolment link before the link itself is deleted. The
 * same five a phone gets, and a dead link rather than a locked one, for the reasons in
 * spendEnrolToken. */
export const ENROL_MAX_FAILURES = 5;

/** PBKDF2 rounds. The PIN is short, so this buys little against a stolen store and is
 * still worth having: nothing here ever holds a PIN that can be read back. */
const PIN_ITERATIONS = 120_000;

/** A device record outlives its cookie by a month, so a phone that has been away longer
 * than the cookie lasts does not leave a record Paul has to tidy up by hand. */
const DEVICE_TTL = CLEANING_COOKIE_MAX_AGE + 60 * 60 * 24 * 30;

/** lastSeen is refreshed at most this often, so reading a schedule is not a write on every
 * open. An hour is plenty for telling Paul which phone is in use. */
const LAST_SEEN_REFRESH_MS = 60 * 60 * 1000;

export type DeviceRecord = {
  person: string;
  /** ISO. When this phone was enrolled. */
  enrolledAt: string;
  /** ISO. Roughly when it last opened the app, within an hour. */
  lastSeenAt: string;
  /**
   * What the user agent said at enrolment, truncated. The fallback for telling two
   * enrolments apart and a poor one, because two browsers on one handset differ by a
   * version string in the middle of a line nobody reads at a glance. It is a bookkeeping
   * note, never an identity check: a cookie resolves because the record exists, not
   * because the agent still matches.
   */
  agent?: string;
  /**
   * Paul's own word for this enrolment, typed on his screen and shown in front of the
   * agent string.
   *
   * One person holds as many of these as she has browsers, and they are not always as many
   * phones: LINE's in-app browser and the phone's own browser are separate cookie jars, so
   * the same handset enrolled in both is two records with near-identical agents. Which of
   * them he is revoking has to be answerable before he presses the button.
   */
  label?: string;
};

type EnrolRecord = { person: string; createdAt: string };
type PinRecord = { salt: string; hash: string; iterations: number; setAt: string };

function parse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- *
 * Enrolment
 * -------------------------------------------------------------------------- */

/** Mint a link for one person. Returns the token; the path is built by the caller so this
 * module needs no opinion about URLs. */
export async function createEnrolToken(person: string): Promise<string> {
  if (!PERSON_KEY.test(person)) throw new Error("Not a roster key.");
  const token = mintEnrolToken();
  const record: EnrolRecord = { person, createdAt: new Date().toISOString() };
  await set(enrolKey(token), JSON.stringify(record), ENROL_TOKEN_TTL);
  return token;
}

/** Who a link is for, without spending it, so the page the link opens can greet her by
 * name before she taps anything. */
export async function peekEnrolToken(token: string): Promise<string | null> {
  if (!token || token.length > 128) return null;
  return parse<EnrolRecord>(await get(enrolKey(token)))?.person ?? null;
}

/** What came of offering a link and a PIN. Four answers, because three of them need
 * different words on her screen: try again, ask Paul to set your code, ask Paul for a new
 * link. */
export type EnrolSpend =
  | { state: "ok"; person: string; device: string }
  | { state: "wrong" }
  | { state: "unset" }
  | { state: "dead" };

/**
 * Enrol this browser, against a link and her PIN.
 *
 * **A link is not single-use, since 20/11/2026.** What it binds is one browser's cookie jar
 * and one woman has several, so a link that died on its first open enrolled her wherever she
 * tapped it and nowhere else. She would then open the app in her other browser, meet the PIN
 * gate with no cookie behind it, and report that the link had not worked. One link now opens
 * every browser she has, each as its own record with its own name and its own revoke.
 *
 * **Her PIN is what the link used to be.** Possession of the token was the whole proof,
 * which is why spending it had to destroy it; the proof is now four to eight digits she
 * already types on the screen after this one, so a forwarded or screenshotted link is worth
 * nothing without them. Five wrong answers delete the link rather than lock it: she will not
 * miss five times typing her own code, and a stranger holding the link should not get a
 * sixth. The cost is that a stranger can kill the link by guessing at it, which costs Paul
 * one press of a button and is the cheaper of the two failures.
 *
 * **The counter is in the shared store and keyed on the link**, because at this moment there
 * is no phone to key it to, and because the per-instance limiter in src/lib/rate-limit.ts is
 * one bucket per warm instance by its own admission, which is no defence of a four-digit
 * number.
 *
 * **Nothing caps how many browsers one link may enrol.** A cap would be a number nobody can
 * name, it would fail in the middle of her setting up a new phone, and the screen it would
 * protect already lists every enrolment with a revoke on each.
 *
 * Still a POST and never a GET, because LINE fetches a link to build its preview card.
 */
export async function spendEnrolToken(
  token: string,
  pin: string,
  agent?: string,
): Promise<EnrolSpend> {
  if (!token || token.length > 128) return { state: "dead" };
  const record = parse<EnrolRecord>(await get(enrolKey(token)));
  if (!record || !PERSON_KEY.test(record.person)) return { state: "dead" };

  const failures = Number(await get(enrolFailKey(token))) || 0;
  if (failures >= ENROL_MAX_FAILURES) {
    await del(enrolKey(token));
    return { state: "dead" };
  }

  const answer = await samePin(record.person, pin);
  // No PIN set for her is Paul's to fix and nothing she can get right, so it is not counted
  // against the link.
  if (answer === "unset") return { state: "unset" };
  if (answer !== "ok") {
    const count = await incr(enrolFailKey(token), ENROL_TOKEN_TTL);
    if (count >= ENROL_MAX_FAILURES) {
      await del(enrolKey(token));
      return { state: "dead" };
    }
    return { state: "wrong" };
  }

  const device = mintDeviceId();
  const now = new Date().toISOString();
  const stored: DeviceRecord = {
    person: record.person,
    enrolledAt: now,
    lastSeenAt: now,
    agent: agent ? agent.slice(0, 120) : undefined,
  };
  await set(deviceKey(device), JSON.stringify(stored), DEVICE_TTL);
  await addToIndex(record.person, device);
  await del(enrolFailKey(token));
  return { state: "ok", person: record.person, device };
}

async function readIndex(person: string): Promise<string[]> {
  const parsed = parse<unknown>(await get(deviceIndexKey(person)));
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((id): id is string => typeof id === "string" && DEVICE_ID.test(id));
}

async function addToIndex(person: string, device: string): Promise<void> {
  const ids = await readIndex(person);
  if (!ids.includes(device)) ids.push(device);
  await set(deviceIndexKey(person), JSON.stringify(ids));
}

async function removeFromIndex(person: string, device: string): Promise<void> {
  const ids = (await readIndex(person)).filter((id) => id !== device);
  await set(deviceIndexKey(person), JSON.stringify(ids));
}

/* -------------------------------------------------------------------------- *
 * Resolving a phone
 * -------------------------------------------------------------------------- */

/**
 * Whether this phone is still enrolled to this person.
 *
 * The signature on the cookie says it was issued by us. This says it has not been revoked,
 * which is a different question and the one that matters: Paul deleting the record is how a
 * lost phone is killed without touching a lock, so the record is checked on every page and
 * every route rather than trusted from the edge.
 */
export async function resolveDevice(person: string, device: string): Promise<DeviceRecord | null> {
  if (!PERSON_KEY.test(person) || !DEVICE_ID.test(device)) return null;
  const record = parse<DeviceRecord>(await get(deviceKey(device)));
  if (!record || record.person !== person) return null;

  const last = Date.parse(record.lastSeenAt);
  if (!Number.isFinite(last) || Date.now() - last > LAST_SEEN_REFRESH_MS) {
    await set(
      deviceKey(device),
      JSON.stringify({ ...record, lastSeenAt: new Date().toISOString() }),
      DEVICE_TTL,
    );
  }
  return record;
}

/** Every phone enrolled to one person, newest first, with the ones whose record has gone
 * dropped from the index as they are noticed. */
export async function listDevices(
  person: string,
): Promise<Array<DeviceRecord & { device: string }>> {
  const ids = await readIndex(person);
  const found: Array<DeviceRecord & { device: string }> = [];
  const live: string[] = [];
  for (const id of ids) {
    const record = parse<DeviceRecord>(await get(deviceKey(id)));
    if (!record || record.person !== person) continue;
    live.push(id);
    found.push({ ...record, device: id });
  }
  if (live.length !== ids.length) await set(deviceIndexKey(person), JSON.stringify(live));
  return found.sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt));
}

/**
 * Name one enrolment, or remove the name by saving an empty one.
 *
 * Read, amend, write. Safe as a whole-record write because the admin screen is the only
 * writer of a name and the other fields are not his to set, and the one field that moves on
 * its own, lastSeenAt, is only ever moved forward by a visit. The TTL is renewed with it,
 * the same way a visit renews it, which cannot widen access: a cookie past
 * CLEANING_COOKIE_MAX_AGE is refused on its own terms whatever the record says.
 */
export async function setDeviceLabel(
  person: string,
  device: string,
  label: string,
): Promise<boolean> {
  if (!PERSON_KEY.test(person) || !DEVICE_ID.test(device)) return false;
  const record = parse<DeviceRecord>(await get(deviceKey(device)));
  if (!record || record.person !== person) return false;
  const named: DeviceRecord = { ...record, label: cleanDeviceLabel(label) || undefined };
  await set(deviceKey(device), JSON.stringify(named), DEVICE_TTL);
  return true;
}

/** Revoke one phone. The cookie on it stops resolving immediately and no lock is touched. */
export async function revokeDevice(person: string, device: string): Promise<boolean> {
  if (!PERSON_KEY.test(person) || !DEVICE_ID.test(device)) return false;
  const record = parse<DeviceRecord>(await get(deviceKey(device)));
  if (!record || record.person !== person) return false;
  await del(deviceKey(device));
  await removeFromIndex(person, device);
  // Her PIN counter on that phone goes with it, so a re-enrolled phone does not inherit a
  // lockout from the phone that was lost.
  await del(pinFailKey(person, device));
  return true;
}

/** Everyone the store knows about: whoever has a published document, plus anyone who has a
 * phone enrolled but nothing published. This app holds no roster of its own, so the store
 * is the only answer to "who exists", and a person with an expired document still needs a
 * row on Paul's screen. */
export async function knownPeople(): Promise<string[]> {
  const notes = await keysUnder("cleaning:note:");
  const indexes = await keysUnder(DEVICE_INDEX_PREFIX);
  const people = new Set<string>();
  for (const key of notes) people.add(key.slice("cleaning:note:".length));
  for (const key of indexes) people.add(key.slice(DEVICE_INDEX_PREFIX.length));
  return [...people].filter((person) => PERSON_KEY.test(person)).sort();
}

/* -------------------------------------------------------------------------- *
 * The PIN
 * -------------------------------------------------------------------------- */

function toBase64Url(bytes: Uint8Array): string {
  let raw = "";
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function derive(pin: string, salt: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new TextEncoder().encode(salt),
      iterations,
    },
    key,
    256,
  );
  return toBase64Url(new Uint8Array(bits));
}

/** Digits only, four to eight of them. Paul sets it and tells her in LINE, and a PIN she
 * cannot type on a numeric keypad at a gate is the wrong kind of secret. */
export const PIN_SHAPE = /^\d{4,8}$/;

export async function setPin(person: string, pin: string): Promise<void> {
  if (!PERSON_KEY.test(person)) throw new Error("Not a roster key.");
  if (!PIN_SHAPE.test(pin)) throw new Error("A PIN is four to eight digits.");
  const salt = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const record: PinRecord = {
    salt,
    hash: await derive(pin, salt, PIN_ITERATIONS),
    iterations: PIN_ITERATIONS,
    setAt: new Date().toISOString(),
  };
  await set(pinKey(person), JSON.stringify(record));
  // A new PIN clears whatever counters were standing against the old one.
  for (const device of await readIndex(person)) await del(pinFailKey(person, device));
}

export async function pinSetAt(person: string): Promise<string | null> {
  return parse<PinRecord>(await get(pinKey(person)))?.setAt ?? null;
}

export type PinCheck = "ok" | "wrong" | "locked" | "unset";

/**
 * Whether this is her PIN. Nothing counted, nothing written, no opinion about tries.
 *
 * The comparison on its own, because two different things now stand in front of a PIN and
 * they count their failures in different places: her phone counts against the phone, an
 * enrolment link counts against the link. Both ask this the same question.
 */
async function samePin(person: string, pin: string): Promise<PinCheck> {
  const record = parse<PinRecord>(await get(pinKey(person)));
  if (!record) return "unset";
  if (!PIN_SHAPE.test(pin)) return "wrong";
  const offered = await derive(pin, record.salt, record.iterations);
  return offered === record.hash ? "ok" : "wrong";
}

/**
 * Check a PIN, counting the failures in the shared store.
 *
 * Per person and per phone. Counting per phone rather than per person means a stolen phone
 * cannot lock the owner out of her own codes from somewhere else, and the phone doing the
 * guessing is the one that stops answering.
 */
export async function checkPin(person: string, device: string, pin: string): Promise<PinCheck> {
  if (!PERSON_KEY.test(person) || !DEVICE_ID.test(device)) return "wrong";

  const failures = Number(await get(pinFailKey(person, device))) || 0;
  if (failures >= PIN_MAX_FAILURES) return "locked";

  const answer = await samePin(person, pin);
  if (answer === "unset") return "unset";
  if (answer === "ok") {
    await del(pinFailKey(person, device));
    return "ok";
  }
  const count = await incr(pinFailKey(person, device), PIN_LOCK_SECONDS);
  return count >= PIN_MAX_FAILURES ? "locked" : "wrong";
}
