import Link from "next/link";
import { Logo } from "./logo";
import { getDictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { AREAS } from "@/lib/areas";
import { MANAGEMENT_CITIES } from "@/lib/management-cities";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Ink footer from the handoff. Two rules from the design carried over:
 *
 * - Footer labels are *descriptive*, not the audience labels the header uses. "How it
 *   works" reads wrong under a heading called "Property Owners".
 * - Business Services appears here and nowhere else. It must never be promoted to the
 *   primary nav while there are no active clients in it.
 *
 * The handoff's "Areas we manage" column is here now that the destination pages exist.
 * It was deliberately omitted while they did not: eight neighbourhood names linking at
 * nothing would have been the kind of empty SEO the rest of this site argues against.
 * With the pages built, this is one of the three routes into them the handoff names --
 * the nav, this footer, and organic search.
 *
 * The city column follows the same reasoning and exists for the same reason. Without it the
 * two `/management/*` pages were orphans -- reachable from the sitemap and from nothing on
 * the site, which earns them a crawl and no internal link equity at all.
 *
 * It is headed "Cities we cover" rather than "Cities we manage" on purpose. Phuket and
 * Bangkok are opportunistic markets under decision #29 and there is nothing under management
 * in either. "Manage" would be a claim; "cover" is what is actually true, which is that the
 * service is sold there and delivered from Chiang Mai.
 */
export function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale, path);

  const columns = [
    {
      heading: t.footStay,
      links: [
        { href: href("/properties"), label: t.allProperties },
        { href: href("/lotushouse"), label: t.viewProperty },
      ],
    },
    {
      heading: t.footAreas,
      links: AREAS.map((area) => ({
        href: href(`/destinations/${area.slug}`),
        label: area.name,
      })),
    },
    {
      heading: t.footCities,
      links: MANAGEMENT_CITIES.map((city) => ({
        href: href(`/management/${city.slug}`),
        label: city.name,
      })),
    },
    {
      heading: t.footOwners,
      links: [
        { href: href("/how-it-works"), label: t.footHow },
        { href: href("/contact"), label: t.navContact },
        { href: href("/business-services"), label: t.businessServices },
      ],
    },
    {
      heading: t.footLegal,
      links: [
        { href: href("/terms-and-conditions"), label: t.terms },
        { href: href("/privacy-policy"), label: t.privacy },
      ],
    },
  ];

  return (
    <footer className="mt-auto bg-ink px-5 pb-8 pt-13 text-white">
      <div className="mx-auto max-w-(--container-chrome)">
        <div className="grid gap-7 sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
          {columns.map((column) => (
            <div key={column.heading} className="flex flex-col gap-2.5">
              <h2 className="eyebrow text-gold-on-ink tracking-[0.1em]">
                {column.heading}
              </h2>
              {column.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13.5px] text-white/80 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}

          <div className="flex flex-col gap-2.5">
            <h2 className="eyebrow text-gold-on-ink tracking-[0.1em]">
              {t.footContact}
            </h2>
            {/* Name and address must match the Google Business Profile character for
                character, or the two records compete in local search. */}
            <address className="text-[13.5px] not-italic leading-relaxed text-white/80">
              AgentSiam Co., Ltd.
              <br />
              922/11 Rama 9 Road, Huaykwang
              <br />
              Bangkok 10310, Thailand
            </address>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[13.5px] text-white/80 hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-4.5">
          <Logo className="h-3.5 w-auto text-white/50" />
          <span className="text-xs text-white/50">{t.copyright}</span>
        </div>
      </div>
    </footer>
  );
}
