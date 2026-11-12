import type { Metadata } from "next";
import Link from "next/link";
import { Poppins, IBM_Plex_Sans } from "next/font/google";
import "../globals.css";
import { SignOut } from "@/components/admin/sign-out";
import { currentSession } from "@/lib/admin/guard";
import {
  ADMIN_BLOCKED,
  ADMIN_CLIENTS,
  ADMIN_OWNERS,
  ADMIN_PROPERTIES,
  ADMIN_ROOT,
} from "@/lib/admin/routes";
import { storeDescription } from "@/lib/admin/store";

/**
 * The renter shortlist admin, and the second root layout in this app.
 *
 * The site's root layout sits at src/app/[locale]/layout.tsx because every public page is
 * localised. This subtree is a sibling of that one, so it is a root layout in its own
 * right and carries its own html and body. Navigating between the two is a full page load,
 * which is correct: they share no chrome, and nobody moves between them mid-task.
 *
 * Not localised, and no dictionary keys. Two people read this, both in English, so the
 * usual rule that anything a reader reads belongs in the three dictionaries does not buy
 * anything here: it would cost three translations of "Bedrooms" that nobody will read.
 *
 * Two of the six site faces, not all six. Poppins for headings and Plex Sans for
 * everything else, with the font family set explicitly rather than through the --font-body
 * token, because that token stacks Noto Thai and Noto SC behind the Latin faces and an
 * undefined custom property inside it would make the whole declaration invalid. A Thai
 * property name therefore renders in the system Thai face here. For an internal tool with
 * two readers that is the right trade against two more megabytes of webfont.
 */

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["600", "700"],
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

/**
 * Not indexed, not followed, not cached by a search engine that asks.
 *
 * Deliberately not the shared NOINDEX constant in src/lib/site.ts: that one allows
 * following, which is right for a placeholder page and wrong here. Nothing about this
 * subtree should be crawled, and no link out of it should be either.
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();

  return (
    <html lang="en" className={`${poppins.variable} ${plexSans.variable}`}>
      <body
        className="min-h-dvh bg-surface text-body"
        style={{ fontFamily: "var(--font-plex-sans), system-ui, sans-serif" }}
      >
        <header className="border-b border-hairline bg-bg">
          <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link
              href={ADMIN_ROOT}
              className="text-sm font-semibold text-text"
              style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
            >
              AgentSiam admin
            </Link>
            {session ? (
              <>
                <nav className="flex items-center gap-4 text-sm">
                  <Link href={ADMIN_ROOT} className="text-primary hover:underline">
                    Renter leads
                  </Link>
                  <Link href={ADMIN_OWNERS} className="text-primary hover:underline">
                    Owner leads
                  </Link>
                  <Link href={ADMIN_PROPERTIES} className="text-primary hover:underline">
                    Property pool
                  </Link>
                  <Link href={ADMIN_CLIENTS} className="text-primary hover:underline">
                    Clients
                  </Link>
                  <Link href={ADMIN_BLOCKED} className="text-primary hover:underline">
                    Blocked operators
                  </Link>
                </nav>
                <div className="ml-auto flex items-center gap-4 text-xs text-muted">
                  <span>{session.who}</span>
                  <SignOut />
                </div>
              </>
            ) : null}
          </div>
        </header>

        <main className="mx-auto max-w-[1080px] px-4 py-8">{children}</main>

        {session ? (
          <footer className="mx-auto max-w-[1080px] px-4 pb-10 text-xs text-muted">
            Changes land in {storeDescription()}. Nothing here is public, indexed or in the
            sitemap.
          </footer>
        ) : null}
      </body>
    </html>
  );
}
