import type { Metadata } from "next";
import { DEFAULT_LOCALE, HTML_LANG, LOCALES, localePath, type Locale } from "@/i18n/config";
import { AREAS } from "@/lib/areas";

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
  "Feasibility, vacation rental permission and management for short-term rentals in Chiang Mai. Three separate steps, each one earning the next.";

// The published contact address, used by the legal pages and as the reply-to on
// contact form notifications, so it is written down once.
export const CONTACT_EMAIL = "hi@agentsiam.com";

// Shown as "Last updated" on the privacy policy and the terms. Bump by hand when the
// text of either page materially changes, not on every deploy.
export const POLICY_UPDATED = "14 August 2026";

// No Beds24 booking-page URL here on purpose. Payment is taken by Stripe on this site's
// own domain (see src/lib/stripe.ts and /api/booking/checkout), so a guest is never sent
// to a third party's checkout and Beds24 is never named in the front end. Beds24 remains
// the calendar of record behind it.

type RouteMeta = {
  /** The bare English route. Locale paths are derived from it, never written out. */
  path: string;
  /** Excluded from the sitemap and marked noindex. Use for placeholder pages. */
  placeholder?: boolean;
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
const OG_LOCALE: Record<Locale, string> = {
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
 * Builds a page's Metadata from one title/description pair, so every route gets a
 * canonical URL, hreflang alternates, an Open Graph block and a Twitter card without
 * repeating them eight times over three languages.
 * The title is passed bare ("How it works"); the root layout's template appends the brand.
 */
export function pageMeta({
  title,
  description,
  path,
  locale,
  placeholder = false,
}: {
  title: string;
  description: string;
  /** The bare English route, e.g. "/how-it-works". */
  path: string;
  locale: Locale;
  placeholder?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(locale, path),
      languages: languageAlternates(path),
    },
    ...(placeholder ? NOINDEX : {}),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      url: absoluteUrl(locale, path),
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [OG_IMAGE],
    },
  };
}
