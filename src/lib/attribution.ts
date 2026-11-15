/**
 * What brought a visitor to the site, read in the browser and sent with the owner form.
 *
 * Two places to read it from, and only one is switched on.
 *
 * - **The page the form sits on.** Read at the moment of submitting, from that page's own
 *   URL and `document.referrer`. Stores nothing anywhere, so it passes the test the layout
 *   writes down for every tag: storage exists only because someone asked for something. It
 *   only sees UTM tags on a link that lands straight on /contact.
 * - **The first page of the visit.** Kept in `sessionStorage` on arrival, so a visitor who
 *   lands on /how-it-works from an ad and only then opens /contact is still attributed. That
 *   is storage written on page view, which the layout's rule does not admit, so it is off
 *   until Paul decides it and the privacy policy says so. `KEEP_LANDING` is the switch.
 *
 * Nothing here is sent anywhere except inside a form the visitor chose to submit.
 */

import type { Attribution } from "@/lib/admin/types";

/** Off: see the file comment. Turning it on is a privacy decision, not a code change. */
export const KEEP_LANDING = false;

const STORAGE_KEY = "agentsiam:landing";

const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;

/** The longest any one value may be, here and again on the server. */
export const ATTRIBUTION_MAX = 200;

function clip(value: string | null): string {
  return (value ?? "").trim().slice(0, ATTRIBUTION_MAX);
}

/** An external referrer as its origin and path, never its query string, which can carry a
 * search term or a token. A referrer on this site is dropped: it says which page they
 * clicked from, and `landing_path` already says where they started. */
function externalReferrer(referrer: string, ownHost: string): string {
  if (!referrer) return "";
  try {
    const url = new URL(referrer);
    if (url.host === ownHost) return "";
    return clip(`${url.origin}${url.pathname}`);
  } catch {
    return "";
  }
}

/** Pure, so it can be read from any URL: the landing page or the page the form is on. */
export function attributionFrom(href: string, referrer: string, captured: string): Attribution {
  const url = new URL(href);
  const values = Object.fromEntries(PARAMS.map((key) => [key, clip(url.searchParams.get(key))]));
  return {
    utm_source: values.utm_source,
    utm_medium: values.utm_medium,
    utm_campaign: values.utm_campaign,
    utm_term: values.utm_term,
    utm_content: values.utm_content,
    gclid: values.gclid,
    fbclid: values.fbclid,
    referrer: externalReferrer(referrer, url.host),
    landing_path: clip(url.pathname),
    captured,
  };
}

function says(attribution: Attribution): boolean {
  return PARAMS.some((key) => attribution[key] !== "") || attribution.referrer !== "";
}

/** Called once per page view. Does nothing while `KEEP_LANDING` is off, and keeps only the
 * first page of a visit that carried something: first touch, not last. */
export function keepLanding(): void {
  if (!KEEP_LANDING || typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(STORAGE_KEY)) return;
    const attribution = attributionFrom(window.location.href, document.referrer, "landing");
    if (says(attribution)) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Storage refused, private mode or a full quota: attribution is never worth an error.
  }
}

/** What to send with the form: the kept landing if there is one, else the form's own page. */
export function attributionForForm(): Attribution {
  if (KEEP_LANDING) {
    try {
      const kept = window.sessionStorage.getItem(STORAGE_KEY);
      if (kept) return JSON.parse(kept) as Attribution;
    } catch {
      // Fall through to the page itself.
    }
  }
  return attributionFrom(window.location.href, document.referrer, "form page");
}
