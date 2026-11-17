import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { ServiceWorker } from "@/components/cleaning/service-worker";
import { CLEANING_MANIFEST } from "@/lib/cleaning/routes";

/**
 * The cleaning team's schedule app, and the third root layout in this repository.
 *
 * Every public page lives under src/app/[locale] because the marketing site is localised,
 * and the admin is a sibling root layout for the same reason this is: a subtree with its
 * own chrome, its own sign-in and nobody moving between them mid-task.
 *
 * **Not localised, and no dictionary keys.** Language here is a roster fact, not a URL
 * fact: each person's published document is already rendered in her own language and says
 * which one it is, so the three dictionaries buy nothing and a locale prefix would buy
 * less. The handful of strings the document cannot carry are in
 * src/lib/cleaning/strings.ts, where Paul writes them. A string he has not written yet
 * renders as nothing and takes its element with it, so these screens are quieter than they
 * are finished: nothing on them says a sentence is missing. That was a band mounted here
 * until 17/11/2026, and Paul asked for it gone.
 *
 * Two faces, not the site's six. Noto Sans Thai carries every word on these screens; Plex
 * Sans carries the digits, the Latin spelling of Ting's name and the door codes. The
 * family is set explicitly rather than through the --font-body token, because that token
 * stacks a Chinese face this app never needs.
 *
 * Phone first and one-handed, because it is read at a gate in daylight with a bag in the
 * other hand: 18px body, generous line height, nothing that needs a second tap to reveal
 * a date.
 */

const notoThai = localFont({
  variable: "--font-noto-thai",
  display: "swap",
  src: [
    { path: "../../fonts/noto-sans-thai-thai.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/noto-sans-thai-thai.woff2", weight: "600", style: "normal" },
  ],
});

const plexSans = localFont({
  variable: "--font-plex-sans",
  display: "swap",
  src: [
    { path: "../../fonts/ibm-plex-sans-latin.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/ibm-plex-sans-latin.woff2", weight: "600", style: "normal" },
  ],
});

/** Not indexed, not followed, not cached by a search engine that asks. Same reasoning as
 * the admin's: nothing in this subtree should be crawled and no link out of it either. */
export const metadata: Metadata = {
  title: "AgentSiam",
  robots: { index: false, follow: false, nocache: true },
  manifest: CLEANING_MANIFEST,
  appleWebApp: { capable: true, statusBarStyle: "default", title: "AgentSiam" },
  icons: {
    icon: [{ url: "/cleaning/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/cleaning/icon-180.png", sizes: "180x180" }],
  },
};

/** No zoom lock. A doorstep in daylight is exactly where somebody pinches to read. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14141c",
};

export default function CleaningLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${notoThai.variable} ${plexSans.variable}`}>
      <body
        className="min-h-dvh bg-bg text-text antialiased"
        style={{
          fontFamily: "var(--font-noto-thai), var(--font-plex-sans), system-ui, sans-serif",
        }}
      >
        <div className="mx-auto w-full max-w-[520px] px-4 pb-16 pt-5">{children}</div>
        <ServiceWorker />
      </body>
    </html>
  );
}
