/**
 * The check every admin page and every admin route handler makes for itself.
 *
 * src/proxy.ts already turns a signed-out visitor away at the edge, but an edge check reads
 * a cookie and cannot be the only thing standing between a URL and the document store.
 * Next's own guidance is that the proxy is an optimistic filter and the real check belongs
 * where the data is read. So both exist, and this is the one that counts.
 *
 * Node side only: it reaches for next/headers.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, readSession, type AdminSession } from "./session";
import { ADMIN_ROOT, ADMIN_SIGN_IN } from "./routes";

/** The session, or a redirect to sign-in. For pages. */
export async function requireSession(nextPath?: string): Promise<AdminSession> {
  const session = await currentSession();
  if (session) return session;
  const target = nextPath && nextPath.startsWith(ADMIN_ROOT) ? nextPath : "";
  redirect(target ? `${ADMIN_SIGN_IN}?next=${encodeURIComponent(target)}` : ADMIN_SIGN_IN);
}

/** The session, or null. For route handlers, which answer 401 rather than redirect. */
export async function currentSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return readSession(store.get(ADMIN_COOKIE)?.value);
}

/** Only a path inside the admin is ever followed after sign-in, so a crafted `next` cannot
 * turn the sign-in form into an open redirect. */
export function safeNext(value: string | undefined): string {
  if (!value) return ADMIN_ROOT;
  if (!value.startsWith(ADMIN_ROOT)) return ADMIN_ROOT;
  if (value.startsWith("//")) return ADMIN_ROOT;
  return value;
}
