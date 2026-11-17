/**
 * The check every cleaning-app page and route handler makes for itself.
 *
 * src/proxy.ts already turns a phone with no signed cookie away at the edge, but an edge
 * check reads a cookie and cannot be the only thing between a URL and a door code. Next's
 * own guidance is that the proxy is an optimistic filter and the real check belongs where
 * the data is read, and here there is a second reason: revocation is a store lookup, and
 * the edge does not reach the store. A cookie Paul has revoked still has a valid
 * signature. This is the check that notices.
 *
 * Node side only: it reaches for next/headers and the store.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveDevice } from "./devices";
import { CLEANING_NO_ACCESS } from "./routes";
import {
  CLEANING_COOKIE,
  CLEANING_PIN_COOKIE,
  readDeviceCookie,
  readPinCookie,
} from "./session";

export type Holder = { person: string; device: string };

/**
 * Whose phone this is, or null.
 *
 * Null covers every failure with one answer, because every failure has the same remedy:
 * ask Paul for a new link. A missing cookie, a forged one, a revoked device and an
 * unconfigured app are not distinguished on screen.
 */
export async function currentHolder(): Promise<Holder | null> {
  const store = await cookies();
  const session = await readDeviceCookie(store.get(CLEANING_COOKIE)?.value);
  if (!session) return null;
  try {
    const record = await resolveDevice(session.person, session.device);
    if (!record) return null;
  } catch {
    // The store is unreachable or unconfigured. Fail closed: a schedule nobody can prove
    // belongs to this phone is not shown on it.
    return null;
  }
  return { person: session.person, device: session.device };
}

/** Whose phone this is, or the page that tells her to ask Paul. For pages. */
export async function requireHolder(): Promise<Holder> {
  const holder = await currentHolder();
  if (holder) return holder;
  redirect(CLEANING_NO_ACCESS);
}

/** Whether her PIN has been given on this phone in the last few minutes. */
export async function pinGiven(holder: Holder): Promise<boolean> {
  const store = await cookies();
  const session = await readPinCookie(
    store.get(CLEANING_PIN_COOKIE)?.value,
    holder.person,
    holder.device,
  );
  return session !== null;
}
