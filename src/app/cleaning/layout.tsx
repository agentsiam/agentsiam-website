import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { LangSwitch } from "@/components/cleaning/lang-switch";
import { ServiceWorker } from "@/components/cleaning/service-worker";
import { teamLang } from "@/lib/cleaning/lang";
import { CLEANING_MANIFEST } from "@/lib/cleaning/routes";

/**
 * The cleaning team's schedule app, and the third root layout in this repository.
 *
 * Every public page lives under src/app/[locale] because the marketing site is localised,
 * and the admin is a sibling root layout for the same reason this is: a subtree with its
 * own chrome, its own sign-in and nobody moving between them mid-task.
 *
 * **No locale in the URL and no dictionary keys, but two languages.** Paul, 18/11/2026: the
 * cleaner should be able to switch between English and Thai. The switch is a cookie on her
 * phone, read here, and what it changes is the app's own words: the strings in
 * src/lib/cleaning/strings.ts, which is every sentence this app has to supply itself. The
 * schedule under them is not translated and cannot be from here, because each person's
 * document arrives as finished text in the language it was published in; that file says so
 * where it says what English reaches.
 *
 * A URL per locale, which is how the public site does its three languages, would mean a
 * second address for the same schedule and a second saved copy of it in the service worker,
 * so a phone with no signal would open whichever one it last happened to save.
 *
 * A string nobody has written yet renders as nothing and takes its element with it, so these
 * screens are quieter than they are finished: nothing on them says a sentence is missing.
 * That was a band mounted here until 17/11/2026, and Paul asked for it gone.
 *
 * Two faces, not the site's six. Noto Sans Thai carries every Thai word on these screens;
 * Plex Sans carries the digits, the door codes, the Latin spelling of Ting's name, the house
 * names and, since there is a switch, the whole of the app in English. The
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

export default async function CleaningLayout({ children }: { children: React.ReactNode }) {
  const lang = await teamLang();

  return (
    <html lang={lang} className={`${notoThai.variable} ${plexSans.variable}`}>
      <body
        className="min-h-dvh bg-bg text-text antialiased"
        style={{
          fontFamily: "var(--font-noto-thai), var(--font-plex-sans), system-ui, sans-serif",
        }}
      >
        <div className="mx-auto w-full max-w-[520px] px-4 pb-16 pt-4">
          {/* Above everything, on every screen, including the two that answer without a
              device cookie. The one control in here that has to be findable by somebody who
              cannot read the rest of the screen. */}
          <LangSwitch lang={lang} />
          {children}
        </div>
        <ServiceWorker />
      </body>
    </html>
  );
}
