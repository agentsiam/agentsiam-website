/**
 * The cleaning team app's own URLs, written once.
 *
 * Separate from src/lib/site.ts for the same reason the admin's routes are: that list feeds
 * the sitemap, and nothing here should ever be advertised to a crawler. Separate from
 * src/lib/admin/routes.ts because this is a different subtree with a different sign-in and
 * a different set of readers.
 *
 * Everything under CLEANING_ROOT is one route group with one root layout, so these paths
 * are also the shape src/proxy.ts matches on.
 */

export const CLEANING_ROOT = "/cleaning";

/** Her schedule. The device cookie alone opens it. */
export const CLEANING_SCHEDULE = CLEANING_ROOT;

/** Her codes. The device cookie plus her PIN. */
export const CLEANING_CODES = `${CLEANING_ROOT}/codes`;

/** What a phone with no working device cookie is shown: ask Paul for a new link, and
 * nothing else. There is no sign-in form here and no recovery flow, by design. */
export const CLEANING_NO_ACCESS = `${CLEANING_ROOT}/no-access`;

/** The enrolment link Paul sends in LINE. Answers without a cookie, which is the point. */
export const CLEANING_ENROL = `${CLEANING_ROOT}/enrol`;

export function cleaningEnrolPath(token: string): string {
  return `${CLEANING_ENROL}/${token}`;
}

/** The three API routes the app posts to. */
export const CLEANING_API_ENROL = "/api/cleaning/enrol";
export const CLEANING_API_PIN = "/api/cleaning/pin";
export const CLEANING_API_SEEN = "/api/cleaning/seen";

/** Paul's one screen, inside the admin he already signs in to. It holds device
 * bookkeeping and never a door code or a schedule. */
export const ADMIN_CLEANING = "/admin/cleaning";
export const ADMIN_API_CLEANING = "/api/admin/cleaning";

/**
 * The service worker and the manifest, both static files in public/.
 *
 * The worker is served from the root rather than from inside /cleaning because a worker's
 * maximum scope is the directory it is served from: at the root it can claim the /cleaning
 * scope with no Service-Worker-Allowed header, and at /cleaning/sw.js it could not claim
 * /cleaning itself, only /cleaning/.
 */
export const CLEANING_SERVICE_WORKER = "/cleaning-sw.js";
export const CLEANING_MANIFEST = "/cleaning/manifest.webmanifest";
