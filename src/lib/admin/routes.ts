/**
 * The admin's own URLs, written once.
 *
 * Separate from src/proxy.ts on purpose: the proxy is bundled for the edge and is not a
 * module anything else should import from, and separate from src/lib/site.ts because these
 * routes are deliberately not in ROUTES. That list feeds the sitemap, so an admin URL that
 * appeared in it would be advertised to crawlers.
 */

export const ADMIN_ROOT = "/admin";
export const ADMIN_SIGN_IN = "/admin/sign-in";
export const ADMIN_BLOCKED = "/admin/blocked";

export function adminLeadPath(leadId: string): string {
  return `/admin/leads/${leadId}`;
}

export function adminCandidatePath(leadId: string, candidateId: string): string {
  return `/admin/leads/${leadId}/candidates/${candidateId}`;
}

/** The form for a candidate that does not exist yet. `new` is not a valid candidate id,
 * because ids come from a property name slug and this one is reserved. */
export const NEW_CANDIDATE = "new";
