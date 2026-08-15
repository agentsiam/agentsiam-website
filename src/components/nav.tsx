import Link from "next/link";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { getDictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";

/**
 * Sticky header from the handoff: white, 1px hairline underneath, 66px tall, content
 * capped at 1440px with 20px side padding.
 *
 * Items are labelled by *audience*, not by content -- Guests, Destinations, Property
 * Owners -- so a visitor sorts themselves before reading anything. The footer keeps
 * descriptive wording instead ("All properties", "How it works"), because audience labels
 * read wrong under a "Stay" heading.
 *
 * The handoff flagged one thing as undecided: its header carried both a "Property Owners"
 * nav item and a "List your property" pill pointing at the same page, and said one should
 * probably go. Both are kept here, aimed at different things -- the nav item at the
 * explanation (/how-it-works), the pill at the action (/contact). That is what the two
 * tiers are for: one is where you go to understand, the other is where you go to start.
 * Sending both to the same URL was the actual problem, not having two of them.
 *
 * The pill is outlined rather than solid so it reads as a distinct destination instead of
 * competing with Contact, which keeps the header's single solid call to action.
 */
export function Nav({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale, path);

  const links = [
    { href: href("/properties"), label: t.navGuests },
    { href: href("/destinations"), label: t.navDestinations },
    { href: href("/how-it-works"), label: t.navOwners },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-bg px-5">
      <nav className="mx-auto flex min-h-[66px] max-w-(--container-chrome) flex-wrap items-center gap-x-6 gap-y-3 py-2.5">
        <Link href={href("/")} aria-label={`AgentSiam — ${t.navGuests}`}>
          <Logo className="h-[15px] w-auto text-text" />
        </Link>

        <ul className="flex items-center gap-5 text-[13.5px] font-medium">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-primary">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <span className="flex-1" />

        <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} label={t.languageLabel} />

          {/* Hidden on narrow screens: the owner path is already in the nav list, the
              fork band and the footer, and three controls in a wrapped header on a phone
              is how a header turns into two rows of clutter. */}
          <Link
            href={href("/contact")}
            className="hidden rounded-full border-[1.5px] border-primary px-4 py-2.5 text-[13px] font-semibold text-primary hover:bg-primary hover:text-white min-[900px]:inline-block"
          >
            {t.navListProperty}
          </Link>

          <Link
            href={href("/contact")}
            className="rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-primary"
          >
            {t.navContact}
          </Link>
        </div>
      </nav>
    </header>
  );
}
