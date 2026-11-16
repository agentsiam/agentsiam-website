import type { Metadata } from "next";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
// Vercel Analytics is cookieless and stores no persistent identifier, so it runs for
// every visitor with no question asked.
//
// Google Analytics writes cookies on page view, and it is the one tag admitted anyway, on
// fixed terms: visitors from the EEA, the UK and Switzerland are
// asked before it loads, everyone else gets it on page view with a switch in the privacy
// policy that turns it off, advertising storage is denied for all, and the policy describes
// it only while it is configured. The terms are written down once, in
// src/components/analytics-consent.tsx. They are not a precedent for the next tag.
//
// The live chat added on 06/09/2026 is allowed through on one condition rather than in
// general. Crisp's Total Privacy Mode means no storage exists until the visitor opens the
// chatbox themselves, which puts it where the payment provider's cookies already sit: set
// because someone asked for something, not because they arrived. That is the test any
// future tag has to pass. A tag that writes on page view does not pass it, however useful
// it is.
import { Analytics } from "@vercel/analytics/next";
import "../globals.css";
import "../../fonts/noto-sans-sc.generated.css";
import { Nav } from "@/components/nav";
import { NavHeight } from "@/components/nav-height";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { CrispChat } from "@/components/crisp-chat";
import { AnalyticsConsent } from "@/components/analytics-consent";
import { AttributionLanding } from "@/components/attribution-landing";
import { NotFoundStringsProvider } from "@/components/not-found-strings";
import { getDictionary } from "@/i18n";
import { HTML_LANG, LOCALES, isLocale, localePath } from "@/i18n/config";
import {
  BING_SITE_VERIFICATION,
  CRISP_WEBSITE_ID,
  GA_MEASUREMENT_ID,
  GOOGLE_SITE_VERIFICATION,
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  languageAlternates,
} from "@/lib/site";
import { organizationSchema, websiteSchema } from "@/lib/structured-data";

// This is the root layout. It sits under a dynamic segment rather than at src/app/layout.tsx
// because every page is localised; src/proxy.ts rewrites the bare English paths onto /en so
// the URLs stay clean. See the Next i18n guide in node_modules/next/dist/docs.

// The faces are files in this repository, under src/fonts, and nothing below reaches a
// network at build time. They were loaded through next/font/google until 16/11/2026, which
// fetched fonts.googleapis.com and then fonts.gstatic.com on every build and cost a
// production deployment to a fetch that did not land. src/fonts/README.md says where the
// files came from, and scripts/fetch-fonts.mjs is how they are refreshed, by hand.
//
// Every src array is written out in full on purpose: localFont takes literal object
// arguments, so a helper that builds the array fails to compile.
//
// The latin slice only, for all four Latin families. Google's response carries every
// subset it has and next/font/google downloaded all of them, which is how the old build
// came to carry 9.46MB of font files. Measured against the text of all 114 pages in all
// three languages, no character on this site reaches Poppins devanagari, Plex cyrillic or
// greek, or Unbounded vietnamese, so those files are not here.
const poppins = localFont({
  variable: "--font-poppins",
  display: "swap",
  src: [
    { path: "../../fonts/poppins-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../../fonts/poppins-latin-700.woff2", weight: "700", style: "normal" },
    { path: "../../fonts/poppins-latin-800.woff2", weight: "800", style: "normal" },
  ],
});

// One file, three weights. Google serves IBM Plex Sans as a variable font, one woff2 per
// subset, and each face clamps it to the weight it declares. The same is true of Noto Sans
// Thai below. Poppins is static, so it is one file per weight.
const plexSans = localFont({
  variable: "--font-plex-sans",
  display: "swap",
  src: [
    { path: "../../fonts/ibm-plex-sans-latin.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/ibm-plex-sans-latin.woff2", weight: "500", style: "normal" },
    { path: "../../fonts/ibm-plex-sans-latin.woff2", weight: "600", style: "normal" },
  ],
});

const plexMono = localFont({
  variable: "--font-plex-mono",
  display: "swap",
  src: [{ path: "../../fonts/ibm-plex-mono-latin.woff2", weight: "500", style: "normal" }],
});

// 800 only. 900 was declared and never asked for: --font-headline resolves at 800
// everywhere, there is no font-black and no font-weight:900 anywhere in src/, and the
// unused face was 20.6KB fetched at highest priority on every page in every language.
const unbounded = localFont({
  variable: "--font-unbounded",
  display: "swap",
  src: [{ path: "../../fonts/unbounded-latin.woff2", weight: "800", style: "normal" }],
});

// 800 matters: Unbounded and Poppins carry no Thai glyphs, so a Thai hero headline falls
// through to this face at the weight the heading asks for. Without a real 800 the browser
// synthesises one and the headline reads smeared.
// The thai slice only. Its latin slice is not here because no character ever reaches it:
// this face sits behind Poppins, Unbounded and Plex in all four stacks in globals.css, and
// all four carry the Latin range already.
const notoThai = localFont({
  variable: "--font-noto-thai",
  display: "swap",
  src: [
    { path: "../../fonts/noto-sans-thai-thai.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/noto-sans-thai-thai.woff2", weight: "600", style: "normal" },
    { path: "../../fonts/noto-sans-thai-thai.woff2", weight: "800", style: "normal" },
  ],
});

// The simplified-Chinese face is the one family not loaded here, and the most expensive
// thing on this site by an order of magnitude. It lives in
// src/fonts/noto-sans-sc.generated.css, imported at the top of this file.
//
// Why it is not a localFont call. Google slices this family into 101 unicode-range files,
// 4.4MB in all, so a browser fetches only the ranges the page it is drawing actually
// needs: a Chinese page costs 1.2MB of webfont, not 4.4MB. next/font/local cannot say
// that. It emits one @font-face per src entry, each entry takes a path, a weight and a
// style, and its declarations option applies to every face in the call, so there is no way
// to give each face its own unicode-range. Loading the family as one file per weight would
// hand every Chinese visitor 4.4MB before the first character appeared. The generated
// stylesheet carries Google's own ranges instead, and the fallback face
// next/font/google emitted, with its metrics read from Next's own table.
//
// Three things that file keeps from the call that used to sit here, all three load-bearing.
// The variable is applied to <html> on the Chinese locale only, so elsewhere the stacks
// fall through to the system CJK face and 中文 in the language switcher still renders:
// without that, an English visitor to /destinations downloads a Chinese webfont to draw
// two characters in the header. Nothing is preloaded, which is what keeps even a Chinese
// page from fetching this before first paint. And the weights stay 400 and 700, the two
// the design asks for, with 500 and 900 reached by CSS weight matching from font-medium
// and font-extrabold as before.

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  // metadataBase makes every relative URL below (canonicals, the generated OG image)
  // resolve to an absolute one. Without it Next throws at build time on relative
  // metadata URLs, and social scrapers get a path they cannot fetch.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Short-term rental management in Chiang Mai`,
    // Per-page metadata sets only its own title; this appends the brand.
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  // Search-engine ownership tokens, both optional and both unset by default, so the tag is
  // absent rather than empty until there is a real token. A property can be verified by DNS
  // TXT instead, in which case these stay unset and nothing here changes. Google Search
  // Console is what submits the sitemap, surfaces coverage errors and reports queries; Bing
  // Webmaster Tools is the same for Bing and, through it, for several assistants.
  ...(GOOGLE_SITE_VERIFICATION || BING_SITE_VERIFICATION
    ? {
        verification: {
          ...(GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : {}),
          ...(BING_SITE_VERIFICATION
            ? { other: { "msvalidate.01": BING_SITE_VERIFICATION } }
            : {}),
        },
      }
    : {}),
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  keywords: [
    "short-term rental management Chiang Mai",
    "vacation rental permission Thailand",
    "non-hotel accommodation exemption",
    "Airbnb management Chiang Mai",
    "feasibility study short-term rental",
  ],
  alternates: {
    canonical: SITE_URL,
    languages: languageAlternates("/"),
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: SITE_URL,
    title: `${SITE_NAME} | Short-term rental management in Chiang Mai`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Short-term rental management in Chiang Mai`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  formatDetection: { telephone: false },
};

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <html
      lang={HTML_LANG[locale]}
      suppressHydrationWarning
      // The Chinese face is applied on the Chinese locale only. On en and th the
      // --font-noto-sc variable is simply absent, and the stacks in globals.css read it
      // through var(--font-noto-sc, sans-serif) so the declaration stays valid and CJK
      // characters fall through to whatever the system provides.
      className={`${poppins.variable} ${plexSans.variable} ${plexMono.variable} ${unbounded.variable} ${notoThai.variable} ${
        locale === "zh" ? "noto-sans-sc-variable" : ""
      } h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg text-text">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
        >
          {t.skipToContent}
        </a>
        <Nav locale={locale} />
        {/* Corrects --nav-h from the header's real height once mounted. The constant in
            globals.css is what the first paint uses. */}
        <NavHeight />
        {/* The 404 boundary's strings, passed down rather than looked up. See
            src/components/not-found-strings.tsx: the boundary receives no params, and
            the alternative was a client component importing getDictionary, which put
            all three dictionaries into the chunk every route on this site loads. */}
        <NotFoundStringsProvider
          value={{
            locale,
            eyebrow: t.notFoundEyebrow,
            title: t.notFoundTitle,
            body: t.notFoundBody,
            cta: t.notFoundCta,
            howItWorks: t.footHow,
            contact: t.navContact,
          }}
        >
          {/* tabIndex -1 so the skip link actually moves focus. Without it Chrome moves
              only the sequential-focus starting point, so the next Tab lands in the content
              but the screen reader's reading cursor stays at the top of the page, which is
              the half of the job that matters. */}
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
        </NotFoundStringsProvider>
        <Footer locale={locale} />
        {/* The company and the site, declared once per page with stable @id values so
            every other block on the page can point at them instead of repeating them. */}
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        <Analytics />
        {/* Renders nothing until NEXT_PUBLIC_GA_MEASUREMENT_ID is set. Four strings, not the
            dictionary: this is a client component on every page. */}
        <AnalyticsConsent
          measurementId={GA_MEASUREMENT_ID}
          policyHref={localePath(locale, "/privacy-policy")}
          labels={{
            label: t.consentLabel,
            body: t.consentBody,
            accept: t.consentAccept,
            decline: t.consentDecline,
            policy: t.privacy,
          }}
        />
        {/* Renders nothing until NEXT_PUBLIC_CRISP_WEBSITE_ID is set. It is the one
            third-party tag on this site besides the two analytics and the payment provider,
            and it stays out of the consent banner only because Crisp's Total Privacy Mode
            is on: see src/components/crisp-chat.tsx, which is where that is written down. */}
        <CrispChat locale={locale} websiteId={CRISP_WEBSITE_ID} />
        {/* Session storage on arrival, admitted by Paul as the one exception to the rule
            above: see src/lib/attribution.ts and the privacy policy's Cookies section. */}
        <AttributionLanding />
      </body>
    </html>
  );
}
