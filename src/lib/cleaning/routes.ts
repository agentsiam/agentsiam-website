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

/**
 * Her schedule, behind her PIN.
 *
 * Since 17/11/2026 this one URL answers with two different documents: the PIN gate to a
 * phone that has not given it, and her schedule to one that has. That is the whole reason
 * CLEANING_GATE_HEADER below exists.
 */
export const CLEANING_SCHEDULE = CLEANING_ROOT;

/** Her codes. Opened by the same PIN as the schedule, and never asked for a second time. */
export const CLEANING_CODES = `${CLEANING_ROOT}/codes`;

/**
 * One job: the house, the line, the address and the way to its codes.
 *
 * New with more than one property, and the screen the comparable products all have and we
 * did not. With one house every question but "when" was answered by there being only one
 * house; with two, "which one and where" is the question, and it needs somewhere to live.
 */
export const CLEANING_JOB = `${CLEANING_ROOT}/job`;

export function cleaningJobPath(slug: string): string {
  return `${CLEANING_JOB}/${slug}`;
}

/**
 * The codes screen, optionally opening on one house.
 *
 * A query string rather than a path on purpose. The service worker matches a saved page
 * ignoring the search, so every one of these shares a single saved copy, and that copy
 * holds **every** house's codes whichever link made it. So a phone with no signal always
 * has all of them and the parameter only decides which is at the top.
 */
export function cleaningCodesPath(property?: string | null): string {
  return property ? `${CLEANING_CODES}?house=${encodeURIComponent(property)}` : CLEANING_CODES;
}

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

/**
 * The header that tells the service worker it is looking at the PIN gate and not a
 * schedule, so that it serves the page and saves nothing.
 *
 * It exists because CLEANING_SCHEDULE is one URL serving two documents. The worker saves
 * every schedule that loads, which is what lets her read one at a gate with no signal, and
 * a cache is keyed on the URL alone. Without this, one load of the gate replaces the saved
 * schedule with a PIN form, and the next time she has no signal the phone shows her a form
 * whose submit cannot reach the network: the thing the worker exists for becomes the one
 * thing it cannot do.
 *
 * Set in src/proxy.ts, which is the only layer here that can set a header, because a server
 * component cannot. **It is a hint about storage and never the gate.** The gate is the
 * pinGiven check inside the page, which also knows about revocation; if this header were
 * wrong in either direction the cost would be a stale cache entry or a missed one, never a
 * door code on a screen.
 *
 * public/cleaning-sw.js carries the same string as a literal, because a static file in
 * public/ cannot import from src/. It is the second value that file duplicates, after
 * /cleaning itself, and both are commented there.
 */
export const CLEANING_GATE_HEADER = "X-Cleaning-Gate";

/**
 * The header that tells the service worker it may keep this door code page, and the moment
 * its copy stops being allowed.
 *
 * It carries an absolute deadline in epoch milliseconds, never a flag, because the phone
 * checking it may have been offline for days and a flag would mean "keep this forever". The
 * number is codesKeepUntil in src/lib/cleaning/session.ts, which is the shorter of her
 * remaining PIN session and seven days, and that file carries the reasoning for both.
 *
 * **A codes response that arrives without this header is served and never saved**, the same
 * way the PIN gate is, so a copy fetched by anything that did not come through src/proxy.ts
 * is not written down. The worker is the only cache allowed to hold these at all: the page
 * still answers no-store, so the browser's own HTTP cache and anything in between still may
 * not keep them, and the one copy that exists is under this app's control, with a deadline
 * on it and a wipe that fires the moment a phone is revoked.
 *
 * public/cleaning-sw.js carries the same string as a literal, for the reason given above
 * CLEANING_GATE_HEADER: a static file in public/ cannot import from src/. Changing one
 * means changing both.
 */
export const CLEANING_KEEP_HEADER = "X-Cleaning-Keep-Until";
