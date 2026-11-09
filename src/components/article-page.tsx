import Link from "next/link";
import { Faq } from "@/components/faq";
import { JsonLd } from "@/components/json-ld";
import { TranslationNote } from "@/components/translation-note";
import { getDictionary } from "@/i18n";
import { localePath, resolvePublishedLocale, type Locale } from "@/i18n/config";
import { articleBody, articlePath, outletCopy, OUTLETS, type Article } from "@/lib/editorial";
import { localeDate } from "@/lib/site";
import {
  articleSchema,
  breadcrumbSchema,
  faqSchema,
  type Crumb,
} from "@/lib/structured-data";

/**
 * One article, in either outlet.
 *
 * Shared rather than written twice. The two outlets differ in who they address, what
 * language they are written in and what they link to, and not at all in how a piece is laid
 * out, so a second copy of this file would only be somewhere for the two to drift apart.
 *
 * **Chrome and editorial resolve separately, and that is the point.** The labels framing the
 * piece come from the dictionaries in the visitor's own language, because navigation is
 * always translated. The piece itself comes from `articleBody`, in whichever of its
 * published languages best matches the request. A Chinese-speaking visitor on the owner
 * outlet therefore gets Chinese chrome around English prose, with the banner saying so,
 * which is honest and is what the fallback actually is.
 *
 * The order of the page is the argument, in the same way the neighbourhood pages work.
 * First the four short answers, because a reader who wants only the answer should not have
 * to earn it and an answer engine should not have to infer it. Then the reasoning. Then the
 * questions people actually type. Then, last and deliberately, what the piece does not
 * settle, and the sources. A page that puts its limits at the top never gets read, and one
 * that leaves them out is the kind of page we are competing against.
 *
 * Three markup blocks are published and all three describe something a reader can see: the
 * breadcrumb is rendered above the headline, the FAQ block carries exactly the questions in
 * the accordion, and the Article block names the organisation as author because no bylined
 * author exists. Nothing is claimed in markup that is not on the page.
 */

/** ISO to DD/MM/YYYY, per C28. The ISO value stays in the time element for machines. */
export function ArticlePage({
  article,
  locale,
}: {
  article: Article;
  locale: Locale;
}) {
  const t = getDictionary(locale);
  const outlet = OUTLETS[article.outlet];
  const masthead = outletCopy(outlet, locale);
  const copy = articleBody(article, locale);
  const written = resolvePublishedLocale(locale, article.publishedIn);
  const href = (path: string) => localePath(locale, path);
  const path = articlePath(article);

  const crumbs: Crumb[] = [
    { name: masthead.name, path: `/${outlet.slug}` },
    { name: copy.title },
  ];

  return (
    <div>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />
      <JsonLd
        data={articleSchema({
          headline: copy.title,
          description: copy.metaDesc,
          path,
          locale,
          inLanguage: written,
          datePublished: article.datePublished,
          dateModified: article.dateModified,
        })}
      />
      <JsonLd data={faqSchema(copy.faq)} />

      {/* Only where the prose is not in the language the visitor asked for. */}
      {written === locale ? null : (
        <TranslationNote locale={locale} note="editorialEnglishNote" />
      )}

      {/* The banner is a full-width strip and sits outside the prose column, as it does on
          the legal pages. The column carries an explicit lang wherever the prose is not in
          the page's own locale, so a screen reader does not read English with Thai or
          Chinese pronunciation. */}
      <div
        className="mx-auto max-w-(--container-prose) px-5 pb-18 pt-9"
        lang={written === locale ? undefined : written}
      >
        <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
          <Link href={href(`/${outlet.slug}`)} className="underline hover:text-primary">
            {masthead.name}
          </Link>
        </nav>

        <h1 className="mt-3 font-headline text-[clamp(28px,5vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
          {copy.title}
        </h1>

        <p className="mt-4 max-w-[640px] text-[17px] leading-relaxed text-body">
          {copy.standfirst}
        </p>

        <p className="mt-4 text-[13px] text-muted">
          {t.articlePublishedOn}{" "}
          <time dateTime={article.datePublished}>{localeDate(locale, article.datePublished)}</time>
          {/* Thai runs sentences on with a space and Chinese closes with a full-width
              stop. A Latin ". " here printed "2026年11月9日. 所有数据" on the Chinese page. */}
          {locale === "zh" ? "。" : locale === "th" ? " " : ". "}
          {t.articleCheckedOn.replace("{date}", localeDate(locale, article.checkedOn))}
        </p>

        {/* shape: first-screen answers, as on /short-term-rental-licence-chiang-mai. */}
        <dl className="mt-7 grid gap-3 sm:grid-cols-2">
          {copy.answers.map((item) => (
            <div key={item.q} className="rounded-box border border-hairline px-5 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                {item.q}
              </dt>
              <dd className="mt-1.5 text-[14.5px] leading-relaxed text-body">{item.a}</dd>
            </div>
          ))}
        </dl>

        {copy.sections.map((section) => (
          <section key={section.heading} className="mt-12">
            <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
              {section.heading}
            </h2>
            {section.body.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-body"
              >
                {paragraph}
              </p>
            ))}

            {section.table ? (
              <figure className="mt-6">
                <figcaption className="text-[14px] font-semibold text-ink">
                  {section.table.title}
                </figcaption>
                {/* Overflow wrapper: three columns of prose do not fit a phone, and a table
                    that silently clips is worse than one a reader can push sideways. */}
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-left">
                    <thead>
                      <tr className="border-y border-hairline">
                        {section.table.head.map((cell) => (
                          <th
                            key={cell}
                            scope="col"
                            className="py-2.5 pr-4 text-[13px] font-semibold uppercase tracking-[0.05em] text-muted"
                          >
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {section.table.rows.map((row) => (
                        <tr key={row[0]}>
                          {row.map((cell, index) => (
                            <td
                              key={cell}
                              className={
                                index === 0
                                  ? "py-3 pr-4 align-top text-[14px] font-semibold text-ink"
                                  : "py-3 pr-4 align-top text-[14.5px] leading-relaxed text-body"
                              }
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 max-w-[640px] text-[13.5px] leading-relaxed text-muted">
                  {section.table.note}
                </p>
              </figure>
            ) : null}
          </section>
        ))}

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
            {t.articleFaqTitle}
          </h2>
          <Faq items={copy.faq} />
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
            {t.articleReadNext}
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={href(copy.related[0].path)} className="pill-primary inline-block">
              {copy.related[0].label}
            </Link>
            {copy.related.slice(1).map((link) => (
              <Link
                key={link.path}
                href={href(link.path)}
                className="inline-block rounded-full border-[1.5px] border-hairline px-5 py-2.5 text-[14px] font-semibold hover:border-ink"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 border-t border-hairline pt-8">
          <h2 className="font-display text-lg font-bold tracking-[-0.015em]">
            {t.articleLimitsTitle}
          </h2>
          <p className="mt-2.5 max-w-[640px] text-[14px] leading-relaxed text-muted">
            {copy.limits}
          </p>
          <h3 className="mt-6 text-[14px] font-semibold text-ink">{t.articleSourcesTitle}</h3>
          <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed text-muted">
            {article.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  rel="noopener"
                  target="_blank"
                  className="underline hover:text-primary"
                  lang="en"
                >
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
