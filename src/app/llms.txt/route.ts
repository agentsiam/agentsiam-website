import { DEFAULT_LOCALE, resolvePublishedLocale, type Locale } from "@/i18n/config";
import { areaBySlug } from "@/lib/areas";
import {
  ARTICLES,
  articleBody,
  articlePath,
  OUTLETS,
  outletCopy,
  type OutletSlug,
} from "@/lib/editorial";
import { managementCityBySlug } from "@/lib/management-cities";
import { PROPERTIES } from "@/lib/property";
import {
  absoluteUrl,
  CONTACT_EMAIL,
  CONTACT_TELEPHONE,
  POSTAL_ADDRESS,
  ROUTES,
  SITE_NAME,
} from "@/lib/site";

/**
 * /llms.txt, the plain-text site summary an assistant reads instead of crawling.
 *
 * It is a route rather than a file in public/ for one reason: it was a hand-written file,
 * it was the only machine-readable surface on this site not derived from ROUTES, and it had
 * drifted sixteen pages behind by 15/11/2026 -- both editorial articles, both editorial
 * hubs, six of the nine houses and the three newest neighbourhoods were missing, while the
 * sitemap, the canonicals and the hreflang sets had all stayed correct because they are
 * generated. Nothing was broken in it; it was simply incomplete, which is the failure mode
 * of a list a person has to remember to update. Now it walks ROUTES like sitemap.ts does,
 * so a route that exists is in here whether or not anyone remembered.
 *
 * What is written by hand is only what cannot be derived: which audience a page serves, and
 * the sentence under the handful of pages that earn one. Both are below, keyed by the bare
 * English route. A page with no entry in either still appears, under a label worked out from
 * its own data or its path, because an unlabelled line is a smaller failure than a missing
 * one. That is the whole design: the hand-written part can fall behind without the file
 * losing a page.
 *
 * English only, and absolute URLs. One file sits at one URL, and a reader who wants Thai or
 * Chinese is told in the header that /th and /zh exist.
 *
 * `force-static` because the output depends on nothing but the build, exactly as the old
 * file in public/ did. See node_modules/next/dist/docs on route handlers: a GET is dynamic
 * until it says otherwise.
 */

export const dynamic = "force-static";

/** The sections, in the order they are written out. */
const SECTIONS = [
  { key: "owners", heading: "For property owners" },
  { key: "guests", heading: "For guests" },
  { key: "areas", heading: "Chiang Mai neighbourhoods" },
  { key: "editorial", heading: "Writing" },
  // Last on purpose. llmstxt.org reserves this heading for what a reader short of room may
  // skip, which is what the legal pages and the one page outside the rental business are.
  { key: "optional", heading: "Optional" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

/**
 * The homepage, left out of the lists rather than missing from them.
 *
 * The header below is the homepage's own summary and this file is served from the site
 * root, so a line pointing at `/` would say a second time what the first paragraph already
 * says. Every other route in ROUTES is listed.
 */
const SKIP = new Set(["/"]);

/** Which audience a page is for. Everything not named here is worked out in sectionOf(). */
const SECTION_OF: Record<string, SectionKey> = {
  "/how-it-works": "owners",
  "/short-term-rental-licence-chiang-mai": "owners",
  "/contact": "owners",
  "/properties": "guests",
  "/house-for-rent-chiang-mai": "guests",
  "/destinations": "areas",
  "/business-services": "optional",
  "/terms-and-conditions": "optional",
  "/privacy-policy": "optional",
};

/**
 * The label for a route whose name cannot be derived from its own data.
 *
 * A property, a neighbourhood, a city page and an article all carry their own title, so
 * they are not here. These are the pages whose name is a decision rather than a field.
 */
const LABEL_OF: Record<string, string> = {
  "/how-it-works": "How it works",
  "/properties": "All properties",
  // Not "Chiang Mai neighbourhoods", which is the heading this link sits under.
  "/destinations": "All neighbourhoods",
  "/house-for-rent-chiang-mai": "Houses for rent in Chiang Mai, by the month",
  "/short-term-rental-licence-chiang-mai": "Short-term rental licence in Chiang Mai",
  "/contact": "Contact",
  "/business-services": "Business services",
  "/terms-and-conditions": "Terms and conditions",
  "/privacy-policy": "Privacy policy",
};

/**
 * The sentence under a link, for the pages where one line changes whether an assistant
 * understands the page or guesses at it. Written by hand, and deliberately not written for
 * every page: a blurb on all thirty-seven would be a second copy of the site to keep true.
 */
const BLURB_OF: Record<string, string> = {
  "/how-it-works":
    "six services, chosen against your property rather than sold as a package. Feasibility, the non-hotel exemption filing, and OTA and direct booking management. Houses, townhouses and small buildings in Chiang Mai; condos too, where the building permits short stays in writing.",
  "/short-term-rental-licence-chiang-mai":
    "the 30-night rule, the non-hotel route (Certificate of Exemption) for houses, townhouses and villas, and why condos cannot use it. A summary of published sources, not legal advice.",
  "/contact": "tell us about your property. We read it and reply within two working days.",
  "/house-for-rent-chiang-mai":
    "send your dates, size, area, budget and must-haves. We find a privately owned home that fits and send it with the total price. Every home is checked first: photos, exact location and a Wi-Fi speed test from the owner. Any deposit is agreed per home and stated before you book.",
  "/lotushouse":
    "the house AgentSiam runs. A three-storey townhouse with a rooftop terrace in Chang Khlan, Chiang Mai, near the Night Bazaar. Two king bedrooms, two bathrooms, a full kitchen and space for four guests. Book direct on this site.",
  "/business-services": "for businesses entering Thailand.",
};

/** A property by the slug its route uses, so a listing names itself. */
function propertyBySlug(slug: string) {
  return PROPERTIES.find((property) => property.slug === slug);
}

/** The outlet a hub route belongs to, or undefined where the route is not a hub. */
function outletOf(path: string): OutletSlug | undefined {
  if (path === "/journal") return "journal";
  if (path === "/host-newsletter") return "host-newsletter";
  return undefined;
}

/**
 * Last resort: a label from the path itself, so a route added tomorrow with no entry in
 * LABEL_OF still reads as something rather than as a bare URL.
 */
function labelFromPath(path: string): string {
  const segment = path.split("/").filter(Boolean).pop() ?? path;
  const words = segment.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function sectionOf(path: string): SectionKey {
  const named = SECTION_OF[path];
  if (named) return named;
  if (path.startsWith("/destinations/")) return "areas";
  if (path.startsWith("/management/")) return "owners";
  if (path.startsWith("/journal") || path.startsWith("/host-newsletter")) return "editorial";
  // A property page, and a property's local guide, are both for a guest.
  if (propertyBySlug(path.split("/")[1] ?? "")) return "guests";
  return "optional";
}

function labelOf(path: string): string {
  const named = LABEL_OF[path];
  if (named) return named;

  const area = path.startsWith("/destinations/")
    ? areaBySlug(path.slice("/destinations/".length))
    : undefined;
  if (area) return area.name;

  const city = path.startsWith("/management/")
    ? managementCityBySlug(path.slice("/management/".length))
    : undefined;
  if (city) return `Short-term rental management in ${city.name}`;

  const outlet = outletOf(path);
  if (outlet) return outletCopy(OUTLETS[outlet], DEFAULT_LOCALE).name;

  const article = ARTICLES.find((item) => articlePath(item) === path);
  if (article) return articleBody(article, DEFAULT_LOCALE).title;

  // A property page, or its local guide, named from the property record.
  const slug = path.split("/")[1] ?? "";
  const property = propertyBySlug(slug);
  if (property) {
    return path.endsWith("/local-guide") ? `${property.title} local guide` : property.title;
  }

  return labelFromPath(path);
}

/**
 * The blurb for a route: the hand-written one where there is one, otherwise whatever the
 * page's own published copy already says about itself. An article and an editorial hub both
 * carry a meta description written for exactly this job, so neither needs a second one here.
 */
function blurbOf(path: string): string | undefined {
  const written = BLURB_OF[path];
  if (written) return written;

  const outlet = outletOf(path);
  if (outlet) return outletCopy(OUTLETS[outlet], DEFAULT_LOCALE).metaDesc;

  const article = ARTICLES.find((item) => articlePath(item) === path);
  if (article) return articleBody(article, DEFAULT_LOCALE).metaDesc;

  // A house with no hand-written line still says where it is and what it is.
  const slug = path.split("/")[1] ?? "";
  const property = propertyBySlug(slug);
  if (property && !path.endsWith("/local-guide")) {
    const area = areaBySlug(property.areaSlug);
    const where = area ? `${area.name}, ${POSTAL_ADDRESS.locality}` : POSTAL_ADDRESS.locality;
    return `${property.bedrooms}-bedroom ${property.type} in ${where}.`;
  }

  return undefined;
}

/** The URL to publish for a route: English, or the language the page was written in. */
function urlOf(path: string, publishedIn?: readonly Locale[]): string {
  const locale = publishedIn ? resolvePublishedLocale(DEFAULT_LOCALE, publishedIn) : DEFAULT_LOCALE;
  return absoluteUrl(locale, path);
}

function body(): string {
  const lines: string[] = [];

  lines.push(`# ${SITE_NAME}`);
  lines.push("");
  lines.push(
    "> Short-term rental management in Chiang Mai, Thailand. Feasibility, vacation rental permission and management for short-term rentals, chosen against the property rather than sold as a package. For guests, AgentSiam runs one house itself and finds privately owned homes for monthly stays, from owners and never from other agents.",
  );
  lines.push("");
  lines.push(
    `${POSTAL_ADDRESS.legalName}, ${POSTAL_ADDRESS.district}, ${POSTAL_ADDRESS.locality}, ${POSTAL_ADDRESS.country}. Email ${CONTACT_EMAIL}, phone ${CONTACT_TELEPHONE}. The site is in English, Thai (/th) and Simplified Chinese (/zh).`,
  );

  // ROUTES order carries the same intent it carries in the sitemap: a hub before the pages
  // under it. Bucketing preserves it, so nothing here decides an order a second time.
  const listed = ROUTES.filter((route) => !route.placeholder && !SKIP.has(route.path));

  for (const section of SECTIONS) {
    const rows = listed.filter((route) => sectionOf(route.path) === section.key);
    if (rows.length === 0) continue;

    lines.push("");
    lines.push(`## ${section.heading}`);
    lines.push("");
    for (const route of rows) {
      const link = `- [${labelOf(route.path)}](${urlOf(route.path, route.publishedIn)})`;
      const blurb = blurbOf(route.path);
      lines.push(blurb ? `${link}: ${blurb}` : link);
    }
  }

  return `${lines.join("\n")}\n`;
}

export async function GET() {
  return new Response(body(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
