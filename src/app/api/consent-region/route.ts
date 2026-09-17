import { NextResponse } from "next/server";

/**
 * Whether the visitor has to be asked before Google Analytics loads.
 *
 * The answer is yes for the European Economic Area, the United Kingdom and Switzerland,
 * which is the territory Google's EU user consent policy covers and where the cookie rules
 * are enforced hardest. Everywhere else Analytics loads on page view, and the privacy policy
 * says so and carries a switch to turn it off.
 *
 * Asked from the browser rather than decided while rendering, because every page on this
 * site is static. Reading the country header in the layout would make every page dynamic to
 * serve one boolean to one component.
 *
 * `x-vercel-ip-country` is set by Vercel from the requester's public IP. A missing header
 * means the site is not running on Vercel (local dev) or the country is unknown, and both
 * answer "ask", so the banner fails towards asking rather than towards tracking.
 */

// EU member states, then the EU's outermost regions that carry their own ISO codes (Canary
// Islands, Madeira and the Azores do not, they geolocate as ES and PT), then the three other
// EEA members, then the UK and Switzerland.
const CONSENT_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  "AX", "GF", "GP", "MF", "MQ", "RE", "YT",
  "IS", "LI", "NO",
  "GB", "CH",
]);

export function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase() ?? "";
  const required = !country || CONSENT_COUNTRIES.has(country);

  return NextResponse.json(
    { required },
    // Per visitor, so never cached by the CDN or shared between visitors.
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
