import type { Metadata } from "next";

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
export const POLICY_UPDATED = "13 August 2026";

// Beds24 hosted booking widget URL for Lotus House, taken from the Beds24 dashboard's
// Booking Widget -> Iframe Generator. Public by nature, but kept in an env var so the
// property ID is not baked into the repo and can differ per property. When unset, the
// property page falls back to an enquiry call to action rather than an empty frame.
export const BOOKING_WIDGET_URL =
  process.env.NEXT_PUBLIC_BEDS24_WIDGET_URL ?? "";

type RouteMeta = {
  path: string;
  /** Excluded from the sitemap and marked noindex. Use for placeholder pages. */
  placeholder?: boolean;
  changeFrequency: "yearly" | "monthly" | "weekly";
  priority: number;
};

// The full route list. `placeholder: true` marks a page whose own body still says it is a
// stub -- those are kept out of the sitemap and set to noindex so a half-written page is not
// what a search engine or a pasted link shows first. Flip the flag when the real copy lands.
export const ROUTES: RouteMeta[] = [
  { path: "/", changeFrequency: "monthly", priority: 1 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.9 },
  { path: "/lotushouse", changeFrequency: "weekly", priority: 0.8 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.7 },
  { path: "/business-services", changeFrequency: "monthly", priority: 0.6 },
  { path: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.3 },
  { path: "/about", placeholder: true, changeFrequency: "monthly", priority: 0.5 },
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

/**
 * Builds a page's Metadata from one title/description pair, so every route gets a
 * canonical URL, an Open Graph block and a Twitter card without repeating them eight times.
 * The title is passed bare ("How it works"); the root layout's template appends the brand.
 */
export function pageMeta({
  title,
  description,
  path,
  placeholder = false,
}: {
  title: string;
  description: string;
  path: string;
  placeholder?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    ...(placeholder ? NOINDEX : {}),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: `${SITE_URL}${path === "/" ? "" : path}`,
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
