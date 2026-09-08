import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Poppins,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  Unbounded,
  Noto_Sans_Thai,
  Noto_Sans_SC,
} from "next/font/google";
// Vercel Analytics is cookieless and stores no persistent identifier, which is why
// this site needs no cookie banner and no consent log. Keep it that way: adding a
// cookie-setting analytics or ads tag changes the legal position of every page.
//
// The live chat added on 06/09/2026 is the first tag that came close, and it is allowed
// through on one condition rather than in general. Crisp's Total Privacy Mode means no
// storage exists until the visitor opens the chatbox themselves, which puts it where the
// payment provider's cookies already sit: set because someone asked for something, not
// because they arrived. That is the test any future tag has to pass. A tag that writes on
// page view does not pass it, however useful it is.
import { Analytics } from "@vercel/analytics/next";
import "../globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { CrispChat } from "@/components/crisp-chat";
import { NotFoundStringsProvider } from "@/components/not-found-strings";
import { getDictionary } from "@/i18n";
import { HTML_LANG, LOCALES, isLocale } from "@/i18n/config";
import {
  CRISP_WEBSITE_ID,
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

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["500"],
  subsets: ["latin"],
});

// 800 only. 900 was declared and never asked for: --font-headline resolves at 800
// everywhere, there is no font-black and no font-weight:900 anywhere in src/, and the
// unused face was 20.6KB fetched at highest priority on every page in every language.
const unbounded = Unbounded({
  variable: "--font-unbounded",
  weight: ["800"],
  subsets: ["latin"],
});

// 800 matters: Unbounded and Poppins carry no Thai glyphs, so a Thai hero headline falls
// through to this face at the weight the heading asks for. Without a real 800 the browser
// synthesises one and the headline reads smeared.
const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  weight: ["400", "600", "800"],
  subsets: ["thai"],
});

// The simplified-Chinese face, and the most expensive thing on this site by an order of
// magnitude. Three things about it were wrong until 06/09/2026 and the comment that used
// to sit here asserted the opposite of what the build produced.
//
// It said the face arrives "split across dozens of unicode-range slices" so the browser
// fetches only what a Chinese page uses. Google's own css2 output is sliced; what
// next/font emits is not. Every @font-face in the built stylesheet carries no
// unicode-range at all, so each weight is one file of roughly 1.1MB and the browser has
// to fetch the whole thing to draw a single character.
//
// Which it was doing on every page in every language, because the language switcher
// renders the label 中文, no Latin or Thai face carries those two glyphs, and the four
// font stacks in globals.css all end in var(--font-noto-sc). An English visitor to
// /destinations was downloading 1.14MB of Chinese webfont to draw two characters in the
// header. Measured, not inferred: the same page with the label written "ZH" fetches 40KB
// instead of 1.17MB.
//
// Three changes. The variable is applied to <html> only on the Chinese locale, so the
// stacks fall through to the system CJK face elsewhere and 中文 still renders. The weight
// list drops to 400 and 700: 500 and 900 were reached only by CSS weight matching from
// font-medium and font-extrabold, and cost 2.28MB between them, so a Chinese page goes
// from 4.6MB of webfont to 2.3MB. preload stays false, and is load-bearing -- it is what
// keeps even the Chinese pages from fetching this before first paint.
const notoSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  weight: ["400", "700"],
  preload: false,
});

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
        locale === "zh" ? notoSC.variable : ""
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
        {/* Renders nothing until NEXT_PUBLIC_CRISP_WEBSITE_ID is set. It is the one
            third-party tag on this site besides analytics and the payment provider, and
            it keeps the no-cookie-banner position only because Crisp's Total Privacy Mode
            is on: see src/components/crisp-chat.tsx, which is where that is written down. */}
        <CrispChat locale={locale} websiteId={CRISP_WEBSITE_ID} />
      </body>
    </html>
  );
}
