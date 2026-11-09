import type { Metadata } from "next";
import {
  DEFAULT_LOCALE,
  HTML_LANG,
  LOCALES,
  localePath,
  resolvePublishedLocale,
  type Locale,
} from "@/i18n/config";
import { AREAS } from "@/lib/areas";
import { ARTICLES, articlePath, HOST_LOCALES, JOURNAL_LOCALES } from "@/lib/editorial";
import { MANAGEMENT_CITIES } from "@/lib/management-cities";

// Single source for the site's canonical URL, share copy and route list.
// Everything metadata-related (layout.tsx, sitemap.ts, robots.ts, opengraph-image.tsx)
// reads from here, so the domain is written down once.
//
// NEXT_PUBLIC_SITE_URL lets a Vercel preview deployment advertise its own URL instead of
// the production one. Falls back to production so a local build never fails on a missing env.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.agentsiam.com";

export const SITE_NAME = "AgentSiam";

export const SITE_DESCRIPTION =
  "Feasibility, vacation rental permission and management for short-term rentals in Chiang Mai. Take the services your property needs and leave the ones it does not.";

// The published contact address, used by the legal pages and as the reply-to on
// contact form notifications, so it is written down once.
export const CONTACT_EMAIL = "hi@agentsiam.com";

// The business line, as listed on the Google Business Profile, in international form for
// schema.org. Declared in the LocalBusiness node so it matches that profile.
export const CONTACT_TELEPHONE = "+66 98 482 5832";

/**
 * The registered postal address, as published.
 *
 * Written down once because two places publish it and they must not drift: the footer
 * renders it, and the LocalBusiness node in src/lib/structured-data.ts declares it. It has
 * to match the Google Business Profile character for character, or the two records compete
 * in local search.
 *
 * Chiang Mai, corrected 06/09/2026 on Paul's instruction. The site published a Bangkok
 * address until then and the registered office was never in Bangkok: the DBD certificate
 * records it as เลขที่ 42 ซอย 1 ถนนเวียงพิงค์ ตำบลช้างคลาน อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่,
 * mirrored in agentsiam-consulting's `as-context/00-company/company-identity.md`. The
 * mismatch was raised as an open decision on 27/08/2026 and this closes it.
 *
 * Know what this publishes. The registered office is the Lotus House building, so the
 * property's street address is now on every page of the site rather than released at
 * booking confirmation. That is a deliberate trade and not an accident: a registered
 * office is public record at the DBD either way, and a Chiang Mai business whose only
 * published address is in Bangkok cannot win a local search it is entitled to. The
 * property page still shows the neighbourhood only and still says the exact address
 * follows confirmation, because that is true of what the listing itself states.
 */
export const POSTAL_ADDRESS = {
  legalName: "AgentSiam Co., Ltd.",
  street: "42 Soi 1, Wiang Ping Road, Chang Khlan",
  locality: "Chiang Mai",
  postalCode: "50100",
  country: "Thailand",
  /** ISO 3166-1 alpha-2, for schema.org's addressCountry. */
  countryCode: "TH",
} as const;

/**
 * WhatsApp number that guest enquiries reach, digits only with country code and no plus,
 * e.g. 66812345678. Unset hides every WhatsApp call to action rather than rendering a link
 * that opens WhatsApp to nobody, which is worse than no button at all.
 *
 * Public by nature: it ends up in a wa.me link either way, which is why it is NEXT_PUBLIC_.
 */
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/[^\d]/g, "");

/**
 * Crisp website ID, for the live chat launcher. Public by nature: it identifies the
 * chatbox to Crisp's own script and ends up in the page either way.
 *
 * Unset renders no widget at all, which is the state the site ships in. Setting it turns
 * the chat on AND turns on a sentence in the privacy policy, so the policy cannot describe
 * a chat provider the site is not using, and cannot stay silent about one it is.
 *
 * Total Privacy Mode has to be enabled in the Crisp dashboard before this is set. See
 * src/components/crisp-chat.tsx: with it off the widget writes a six-month cookie for
 * every passive visitor and this site needs a cookie banner it has never needed.
 */
export const CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID ?? "";

/**
 * Search-engine ownership tokens. Both optional, both empty by default.
 *
 * `GOOGLE_SITE_VERIFICATION` is the content value of the `google-site-verification` meta
 * tag Google Search Console offers under the HTML tag method; `BING_SITE_VERIFICATION` is
 * the `msvalidate.01` value from Bing Webmaster Tools. Empty means the tag is not rendered
 * at all, which is the right state while there is no token: an empty token is a claim that
 * fails verification rather than one that is absent.
 *
 * Neither is required to be indexed. A property can be verified by DNS TXT instead, and
 * verification is about who can read the reports, not about whether a crawler is allowed in.
 * What it unlocks is the sitemap submission, the coverage and query reports, and the ability
 * to ask for a URL to be recrawled.
 */
export const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "";

export const BING_SITE_VERIFICATION = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? "";

/**
 * Google Analytics 4 measurement ID. Public by nature: gtag.js is loaded with it in the URL.
 *
 * Unset renders no Analytics, no consent banner and no request to the region route, and
 * the privacy policy keeps describing a site with cookieless analytics only. Setting it
 * turns all of that on together, so the policy cannot drift from what the site runs. See
 * src/components/analytics-consent.tsx for who is asked and who is not.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

// Shown as "Last updated" on the privacy policy and the terms. Bump by hand when the
// text of either page materially changes, not on every deploy.
//
// ISO, not prose. It was the literal string "14 August 2026" until 06/09/2026, which
// rendered as "ปรับปรุงล่าสุด 14 August 2026" and "最后更新 14 August 2026" -- an English
// date inside a Thai and a Chinese sentence. Kept as a date so each locale formats it.
export const POLICY_UPDATED = "2026-08-14";

// The privacy policy's own date once Google Analytics is on, because that is when its
// measurement and cookie sections change. The terms keep POLICY_UPDATED, since nothing in
// them moved.
export const PRIVACY_WITH_ANALYTICS_UPDATED = "2026-09-17";

/**
 * An ISO date written the way the reader's own locale writes dates.
 *
 * `th-TH-u-ca-gregory` is not decoration. Plain `th-TH` formats in the Buddhist era, so
 * 2026 renders as 2569 and a Thai reader is told the figures were checked 43 years from
 * now. The calendar has to be pinned every time.
 *
 * Anything printing a date a reader can read goes through here. Hand-rolling
 * `${day}/${month}/${year}` prints an English convention inside Thai and Chinese
 * sentences, which this site has now done three times: the policy pages in 09/2026, then
 * both editorial components in 11/2026.
 */
export function localeDate(locale: string, iso: string): string {
  const tag = locale === "th" ? "th-TH-u-ca-gregory" : locale === "zh" ? "zh-Hans" : "en-GB";
  return new Intl.DateTimeFormat(tag, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(iso + "T00:00:00Z"),
  );
}

/** The policy date, which is the one date with a default. */
export function policyUpdated(locale: string, iso: string = POLICY_UPDATED): string {
  return localeDate(locale, iso);
}

// No Beds24 booking-page URL here on purpose. Payment is taken by Stripe on this site's
// own domain (see src/lib/stripe.ts and /api/booking/checkout), so a guest is never sent
// to a third party's checkout and Beds24 is never named in the front end. Beds24 remains
// the calendar of record behind it.

type RouteMeta = {
  /** The bare English route. Locale paths are derived from it, never written out. */
  path: string;
  /** Excluded from the sitemap and marked noindex. Use for placeholder pages. */
  placeholder?: boolean;
  /**
   * The locales this route is actually published in. Omitted means all three.
   *
   * It replaced a boolean `englishOnly`, which could only say "English" and could not say
   * "Thai and English". The owner material needs the second: `service-model.md` in
   * agentsiam-consulting makes Thai owners the primary owner audience and foreign owners
   * the secondary one, so an owner page that exists only in English is addressing the
   * smaller half of its own market.
   *
   * The first entry is the language the page was written in. The sitemap lists one URL per
   * published locale and every entry repeats the same hreflang set.
   */
  publishedIn?: readonly Locale[];
  changeFrequency: "yearly" | "monthly" | "weekly";
  priority: number;
};

// The full route list, in English form. `/about` is gone: the design folds the company
// story into /how-it-works, and next.config.ts redirects the old URL there.
export const ROUTES: RouteMeta[] = [
  { path: "/", changeFrequency: "monthly", priority: 1 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.9 },
  { path: "/properties", changeFrequency: "weekly", priority: 0.9 },
  { path: "/lotushouse", changeFrequency: "weekly", priority: 0.8 },
  // The guest guide. Carried over from the Wix site at the same URL, so published links
  // and anything already indexed keep working without a redirect.
  { path: "/lotushouse/local-guide", changeFrequency: "monthly", priority: 0.6 },
  { path: "/cosmoshouse", changeFrequency: "weekly", priority: 0.8 },
  { path: "/cosmoshouse/local-guide", changeFrequency: "monthly", priority: 0.6 },
  { path: "/maerimhouse", changeFrequency: "weekly", priority: 0.8 },
  { path: "/destinations", changeFrequency: "monthly", priority: 0.7 },
  // One entry per neighbourhood. These are the pages organic search is meant to land on
  // -- "where to stay in Nimman" is a question people actually type -- so they are listed
  // individually rather than left for a crawler to discover through the index.
  ...AREAS.map(
    (area): RouteMeta => ({
      path: `/destinations/${area.slug}`,
      changeFrequency: "monthly",
      priority: 0.6,
    }),
  ),
  // One entry per opportunistic market. Chiang Mai is deliberately not here: the homepage
  // already targets that query, and a second page would compete with it.
  ...MANAGEMENT_CITIES.map(
    (city): RouteMeta => ({
      path: `/management/${city.slug}`,
      changeFrequency: "monthly",
      priority: 0.7,
    }),
  ),
  // Guest-demand page for "house for rent chiang mai".
  { path: "/house-for-rent-chiang-mai", changeFrequency: "monthly", priority: 0.7 },
  // Owner page for "do I need a licence to rent out my condo short term in Chiang Mai".
  { path: "/short-term-rental-licence-chiang-mai", changeFrequency: "monthly", priority: 0.7 },
  // The two editorial outlets and their articles, all English-only. See src/lib/editorial.ts
  // for why the prose is not in the dictionaries and what that costs. The index pages are
  // listed ahead of their articles so a crawler meets the hub first, and every article route
  // is derived from ARTICLES rather than written out, so publishing a piece puts it in the
  // sitemap and nothing has to be remembered here.
  { path: "/journal", changeFrequency: "monthly", priority: 0.6, publishedIn: JOURNAL_LOCALES },
  {
    path: "/host-newsletter",
    changeFrequency: "monthly",
    priority: 0.6,
    publishedIn: HOST_LOCALES,
  },
  ...ARTICLES.map(
    (article): RouteMeta => ({
      path: articlePath(article),
      changeFrequency: "yearly",
      priority: 0.5,
      publishedIn: article.publishedIn,
    }),
  ),
  { path: "/contact", changeFrequency: "yearly", priority: 0.7 },
  { path: "/business-services", changeFrequency: "monthly", priority: 0.6 },
  { path: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
];

// The generated card from src/app/opengraph-image.tsx. Next only attaches a file-based OG
// image automatically to segments that do NOT declare their own `openGraph` object -- as soon
// as a page sets one, it replaces the inherited block, image included. Since every page here
// sets its own title and description, the image has to be named explicitly. Relative URL,
// resolved against metadataBase.
export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "AgentSiam, short-term rental management in Chiang Mai: feasibility, permission, management",
} as const;

/** Metadata fragment for a page that should not be indexed while it is still a stub. */
export const NOINDEX = {
  robots: { index: false, follow: true },
} as const;

// og:locale wants a language_TERRITORY pair, which is a different vocabulary from the
// hreflang codes in HTML_LANG. Written out rather than derived, because the mapping is a
// judgement call: zh-Hans is served to a mainland-Chinese audience here.
export const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  th: "th_TH",
  zh: "zh_CN",
};

/** Absolute URL for a bare route in a given locale. */
export function absoluteUrl(locale: Locale, path: string): string {
  const localised = localePath(locale, path);
  return `${SITE_URL}${localised === "/" ? "" : localised}`;
}

/**
 * Absolute URL for a static asset, from the path a bundled import gives it.
 *
 * encodeURI rather than plain interpolation, because photo filenames come from the
 * photographer and several carry spaces: "Parking zone Street.jpg" and
 * "20250413_100343 (2).jpg" among them. A browser forgives an unescaped space in an
 * img src, which is why the pages have always looked right, but a sitemap's <image:loc>
 * and a JSON-LD image array are read by machines that do not forgive it. encodeURI
 * escapes the space and leaves everything already legal in a path alone, parentheses
 * included.
 */
export function assetUrl(path: string): string {
  return `${SITE_URL}${encodeURI(path)}`;
}

/**
 * hreflang map for a route: one entry per locale plus x-default pointing at English.
 * Every page publishes the full set, which is what tells a search engine the three URLs
 * are the same page rather than three thin duplicates.
 */
export function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    languages[HTML_LANG[locale]] = absoluteUrl(locale, path);
  }
  languages["x-default"] = absoluteUrl(DEFAULT_LOCALE, path);
  return languages;
}

/**
 * hreflang map for a page published in some but not all locales.
 *
 * x-default points at English wherever English is published, because it is the fallback for
 * a reader whose language the page does not carry, and English is the one the site treats as
 * international. Where a page is not in English at all it points at the language it was
 * written in, which is the only honest answer available.
 */
export function localeAlternates(path: string, locales: readonly Locale[]): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[HTML_LANG[locale]] = absoluteUrl(locale, path);
  }
  const fallback = locales.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : locales[0];
  languages["x-default"] = absoluteUrl(fallback, path);
  return languages;
}


/**
 * The share card for one specific route, replacing the site-wide OG_IMAGE.
 *
 * Next only attaches a file-based opengraph-image automatically to a segment that does not
 * declare its own `openGraph` object, and every page here declares one. So a per-route card
 * has to be named explicitly, exactly as OG_IMAGE is. The URL is the segment's own path
 * with `/opengraph-image` appended, locale prefix included, which is where Next serves the
 * generated file from.
 */
export function routeOgImage(locale: Locale, path: string, alt: string) {
  const localised = localePath(locale, path);
  return {
    url: `${localised === "/" ? "" : localised}/opengraph-image`,
    width: 1200,
    height: 630,
    alt,
  } as const;
}

/**
 * Builds a page's Metadata from one title/description pair, so every route gets a
 * canonical URL, hreflang alternates, an Open Graph block and a Twitter card without
 * repeating them eight times over three languages.
 * The title is passed bare ("How it works"); the root layout's template appends the brand.
 *
 * `image` defaults to the site-wide card. Pass a route's own card where the site-wide one
 * would be actively wrong -- a property listing shared into a guest group should not carry
 * an owner-acquisition pitch.
 */
export function pageMeta({
  title,
  description,
  path,
  locale,
  placeholder = false,
  publishedIn,
  image = OG_IMAGE,
}: {
  title: string;
  description: string;
  /** The bare English route, e.g. "/how-it-works". */
  path: string;
  locale: Locale;
  placeholder?: boolean;
  /**
   * The locales this page is published in, matching its ROUTES entry. Omitted means all three.
   *
   * Two things change when it is set, and they have to change together with the sitemap or
   * the page and the sitemap contradict each other on the same URLs. hreflang names only the
   * published locales plus x-default, matching localeAlternates(). And the canonical points
   * at the URL of the language the visitor was actually served, because a locale the page
   * does not carry falls back to English and would otherwise publish a second URL for text
   * that already exists at the first.
   */
  publishedIn?: readonly Locale[];
  image?: { url: string; width: number; height: number; alt: string };
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(
        publishedIn ? resolvePublishedLocale(locale, publishedIn) : locale,
        path,
      ),
      languages: publishedIn ? localeAlternates(path, publishedIn) : languageAlternates(path),
    },
    ...(placeholder ? NOINDEX : {}),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      url: absoluteUrl(locale, path),
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
  };
}
