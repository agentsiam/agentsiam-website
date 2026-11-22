/**
 * Recognising the same renter across two requests, by the handles they gave.
 *
 * Paul, 22/11/2026: a repeat is matched on the email address, the phone or WhatsApp number,
 * or the LINE ID, because those are what identify a person; a name and a pair of dates do
 * not. The CRM's rule still holds that no handle is written into the document store, so what
 * is written is a keyed fingerprint of each one: HMAC-SHA256 under LEAD_MATCH_KEY, a secret
 * that lives only in the deployment's environment.
 *
 * Keyed rather than a plain hash on purpose. A phone number has few enough possible values
 * that a plain SHA-256 of one is reversed by trying them all, so anyone holding the
 * document store would hold the numbers. Without the key that search is not possible.
 *
 * A fingerprint is still personal data: it is derived from a handle and it links two
 * requests to one person. The privacy policy has to say so before this ships.
 *
 * Each fingerprint is stored as `kind:hex`, so a match can say which handle matched. The
 * kind is already in the record as `contact_channels`, so the prefix discloses nothing new.
 * Phone and WhatsApp share the kind `phone`: they are the same number more often than not,
 * and a renter who gave it as WhatsApp once and as a phone the next time is the same renter.
 *
 * Node only, for node:crypto.
 */

import { createHmac } from "node:crypto";

const KEY = process.env.LEAD_MATCH_KEY ?? "";

/** How far back a new request is compared. Long enough for a renter who asks again after
 * hearing nothing for a few weeks, short enough that a returning guest a year later is a
 * new lead rather than a repeat. */
export const REPEAT_WINDOW_DAYS = 90;

export type ContactKind = "email" | "phone" | "line";

export function matchingConfigured(): boolean {
  return KEY.length > 0;
}

export function normaliseEmail(value: string): string {
  const trimmed = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : "";
}

/**
 * Digits only, in international form. A number written the Thai domestic way, ten digits
 * starting 0, is read as +66; one starting 00 has the international prefix dropped. Anything
 * shorter than eight digits is not a number anyone can be reached on and is not fingerprinted,
 * so "n/a" or "123" cannot make two strangers into one renter.
 */
export function normalisePhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.length === 10 && digits.startsWith("0")) digits = `66${digits.slice(1)}`;
  return digits.length >= 8 ? digits : "";
}

/** LINE IDs are case-insensitive and are often written with a leading @. */
export function normaliseLine(value: string): string {
  const id = value.trim().toLowerCase().replace(/^@+/, "").replace(/\s+/g, "");
  return id.length >= 3 ? id : "";
}

function fingerprint(kind: ContactKind, value: string): string {
  return `${kind}:${createHmac("sha256", KEY).update(`${kind}:${value}`).digest("hex")}`;
}

/** Every fingerprint this renter's handles produce, without duplicates. Empty when the key is
 * not set, which turns matching off rather than writing unkeyed hashes. */
export function contactKeys(handles: {
  email: string;
  phone: string;
  whatsapp: string;
  line: string;
}): string[] {
  if (!matchingConfigured()) return [];
  const keys = new Set<string>();
  const email = normaliseEmail(handles.email);
  if (email) keys.add(fingerprint("email", email));
  for (const number of [handles.phone, handles.whatsapp]) {
    const phone = normalisePhone(number);
    if (phone) keys.add(fingerprint("phone", phone));
  }
  const line = normaliseLine(handles.line);
  if (line) keys.add(fingerprint("line", line));
  return [...keys];
}

export type RepeatMatch = { lead_id: string; matched_on: ContactKind[] };

/** Which earlier requests share a fingerprint with this one, and on which handles. */
export function findRepeats(
  keys: string[],
  earlier: { lead_id: string; contact_keys?: string[] }[],
): RepeatMatch[] {
  if (keys.length === 0) return [];
  const mine = new Set(keys);
  const matches: RepeatMatch[] = [];
  for (const record of earlier) {
    const shared = (record.contact_keys ?? []).filter((key) => mine.has(key));
    if (shared.length === 0) continue;
    const kinds = [...new Set(shared.map((key) => key.split(":")[0] as ContactKind))];
    matches.push({ lead_id: record.lead_id, matched_on: kinds });
  }
  return matches.sort((a, b) => a.lead_id.localeCompare(b.lead_id));
}

/** "G-0007 (same email), G-0009 (same phone and LINE)". */
export function repeatsAsWritten(matches: RepeatMatch[]): string {
  const label: Record<ContactKind, string> = { email: "email", phone: "phone", line: "LINE" };
  return matches
    .map((match) => {
      const kinds = match.matched_on.map((kind) => label[kind]);
      const joined =
        kinds.length > 1 ? `${kinds.slice(0, -1).join(", ")} and ${kinds.at(-1)}` : kinds[0];
      return `${match.lead_id} (same ${joined})`;
    })
    .join(", ");
}
