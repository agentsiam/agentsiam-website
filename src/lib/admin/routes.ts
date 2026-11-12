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
export const ADMIN_OWNERS = "/admin/owners";
export const ADMIN_PROPERTIES = "/admin/properties";

export function adminLeadPath(leadId: string): string {
  return `/admin/leads/${leadId}`;
}

export function adminCandidatePath(leadId: string, candidateId: string): string {
  return `/admin/leads/${leadId}/candidates/${candidateId}`;
}

/** The form for a candidate that does not exist yet. `new` is not a valid candidate id,
 * because ids come from a property name slug and this one is reserved. */
export const NEW_CANDIDATE = "new";

export function adminOwnerPath(ownerId: string): string {
  return `${ADMIN_OWNERS}/${ownerId}`;
}

export function adminPropertyPath(propertyId: string): string {
  return `${ADMIN_PROPERTIES}/${propertyId}`;
}

/** The renter lead's own row, which is edited on a page of its own rather than inline, so
 * the shortlist stays the thing the lead page is about. */
export function adminLeadEditPath(leadId: string): string {
  return `/admin/leads/${leadId}/edit`;
}

/** The form for a row that does not exist yet. Shares the value of NEW_CANDIDATE because
 * both reserve the same word in a path, and neither `L-0001` nor a property-name slug can
 * ever be "new". */
export const NEW_RECORD = "new";
