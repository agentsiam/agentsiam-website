import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { TranslationNote } from "@/components/translation-note";
import { getDictionary } from "@/i18n";
import { localePath, resolvePublishedLocale, type Locale } from "@/i18n/config";
import {
  articleBody,
  articlePath,
  articlesForOutlet,
  outletCopy,
  OUTLETS,
  type OutletSlug,
} from "@/lib/editorial";
import { localeDate } from "@/lib/site";
import { breadcrumbSchema, type Crumb } from "@/lib/structured-data";

/**
 * The index for one outlet: the masthead, every piece in it, and a way out.
 *
 * The hub exists for two reasons beyond being a list. It gives every article an internal
 * link from a page that is itself linked from the footer, so nothing in here is an orphan;
 * and it is the page that can rank for the category rather than the question, which an
 * individual article cannot do.
 *
 * It also carries the link to the *other* outlet, which is the one piece of cross-audience
 * navigation on the site that is actively useful. A property owner who arrives at the guest
 * journal through a search for Chiang Mai air quality is exactly the reader the owner
 * outlet wants, and the reverse holds too. Sending them across costs one line and is better
 * than hoping they find the footer.
 *
 * No CollectionPage or Blog markup. The organisation and the site are already declared once
 * per page from the root layout, the breadcrumb is rendered and published, and a third
 * block asserting that a list of two articles is a publication would be describing an
 * ambition rather than the page.
 */

const OTHER: Record<OutletSlug, OutletSlug> = {
  journal: "host-newsletter",
  "host-newsletter": "journal",
};

export function OutletIndex({
  outlet: slug,
  locale,
}: {
  outlet: OutletSlug;
  locale: Locale;
}) {
  const t = getDictionary(locale);
  const outlet = OUTLETS[slug];
  const masthead = outletCopy(outlet, locale);
  const written = resolvePublishedLocale(locale, outlet.publishedIn);
  const articles = articlesForOutlet(slug);
  const otherSlug = OTHER[slug];
  const otherMasthead = outletCopy(OUTLETS[otherSlug], locale);
  const href = (path: string) => localePath(locale, path);
  const crumbs: Crumb[] = [{ name: masthead.name }];

  return (
    <div>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />

      {written === locale ? null : (
        <TranslationNote locale={locale} note="editorialEnglishNote" />
      )}

      <div
        className="mx-auto max-w-(--container-prose) px-5 pb-18 pt-9"
        lang={written === locale ? undefined : written}
      >
        <span className="eyebrow">{t.articleOutletEyebrow}</span>
        <h1 className="mt-3 font-headline text-[clamp(28px,5vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
          {masthead.name}
        </h1>
        <p className="mt-4 max-w-[640px] text-[17px] leading-relaxed text-body">
          {masthead.standfirst}
        </p>

        <ul className="mt-10 divide-y divide-hairline border-y border-hairline">
          {articles.map((article) => {
            const copy = articleBody(article, locale);
            return (
              <li key={article.slug} className="py-6">
                <Link href={href(articlePath(article))} className="group block">
                  <time dateTime={article.datePublished} className="text-[13px] text-muted">
                    {localeDate(locale, article.datePublished)}
                  </time>
                  <h2 className="mt-1.5 font-display text-xl font-bold tracking-[-0.015em] group-hover:text-primary">
                    {copy.title}
                  </h2>
                  <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-body">
                    {copy.standfirst}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>

        <section className="mt-12">
          <div className="flex flex-wrap gap-3">
            <Link href={href(outlet.ctaPath)} className="pill-primary inline-block">
              {masthead.ctaLabel}
            </Link>
          </div>
        </section>

        <section className="mt-14 border-t border-hairline pt-8">
          <p className="max-w-[640px] text-[14px] leading-relaxed text-muted">
            {otherSlug === "host-newsletter" ? t.articleOtherHost : t.articleOtherJournal}{" "}
            <Link href={href(`/${otherSlug}`)} className="underline hover:text-primary">
              {t.articleReadOutlet.replace("{outlet}", otherMasthead.name)}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
