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
import { Analytics } from "@vercel/analytics/next";
import "../globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { getDictionary } from "@/i18n";
import { HTML_LANG, LOCALES, isLocale } from "@/i18n/config";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL, languageAlternates } from "@/lib/site";

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

const unbounded = Unbounded({
  variable: "--font-unbounded",
  weight: ["800", "900"],
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

// No `subsets` and no preload: the simplified-Chinese face is megabytes split across
// dozens of unicode-range slices, and preloading it would cost every English visitor.
// The browser fetches only the slices a Chinese page actually uses.
const notoSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  weight: ["400", "500", "700", "900"],
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
      className={`${poppins.variable} ${plexSans.variable} ${plexMono.variable} ${unbounded.variable} ${notoThai.variable} ${notoSC.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg text-text">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
        >
          {t.skipToContent}
        </a>
        <Nav locale={locale} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer locale={locale} />
        <Analytics />
      </body>
    </html>
  );
}
