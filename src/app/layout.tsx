import type { Metadata } from "next";
import {
  Poppins,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  Unbounded,
  Noto_Sans_Thai,
} from "next/font/google";
// Vercel Analytics is cookieless and stores no persistent identifier, which is why
// this site needs no cookie banner and no consent log. Keep it that way: adding a
// cookie-setting analytics or ads tag changes the legal position of every page.
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["700", "800"],
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

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  weight: ["400", "500", "600"],
  subsets: ["thai"],
});

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
  alternates: { canonical: "/" },
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
  // The site is not multilingual yet. When Thai copy lands, this needs a locale
  // segment plus alternates.languages, not just a font swap.
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} ${plexSans.variable} ${plexMono.variable} ${unbounded.variable} ${notoThai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
