import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/faq";
import { JsonLd } from "@/components/json-ld";
import { getDictionary, type Dictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { pageMeta } from "@/lib/site";
import { breadcrumbSchema, faqSchema, type Crumb } from "@/lib/structured-data";

/**
 * Owner page: do you need a licence to let short term in Chiang Mai.
 *
 * Target query: "do I need a licence to rent out my condo short term in Chiang Mai", with
 * "short term rental licence Chiang Mai" and "Airbnb legal Chiang Mai condo". Taken from an
 * outside audit of AI answers, not from Search Console: there is no impression data yet.
 *
 * Every legal statement comes from `as-context/04-industry-research/regulations-compliance/
 * thailand/str-legal-overview.md` in agentsiam-consulting, and the sources listed at the foot
 * of the page are that file's own. Two limits from that repo (R13, R14): the position is
 * written as what the rules say today, to be confirmed per property, never as settled; and
 * nothing here mentions serving owners who do not apply.
 *
 * English, Thai and Chinese. The copy lives in the dictionaries under the `lic` keys; Thai
 * addresses the owner as ท่าน.
 */

const PATH = "/short-term-rental-licence-chiang-mai";

function pageCopy(t: Dictionary) {
  return {
    metaTitle: t.licMetaTitle,
    metaDesc: t.licMetaDesc,
    crumb: t.licCrumb,
    eyebrow: t.licEyebrow,
    h1: t.licH1,
    intro: t.licIntro,
    answers: [
      { q: t.licAns1Q, a: t.licAns1A },
      { q: t.licAns2Q, a: t.licAns2A },
      { q: t.licAns3Q, a: t.licAns3A },
      { q: t.licAns4Q, a: t.licAns4A },
    ],
    exemptionTitle: t.licExTitle,
    exemptionRows: [
      { k: t.licRow1K, v: t.licRow1V },
      { k: t.licRow2K, v: t.licRow2V },
      { k: t.licRow3K, v: t.licRow3V },
      { k: t.licRow4K, v: t.licRow4V },
      { k: t.licRow5K, v: t.licRow5V },
    ],
    condoTitle: t.licCondoTitle,
    condoBody: t.licCondoBody,
    helpTitle: t.licHelpTitle,
    helpBody: t.licHelpBody,
    helpLink: t.licHelpLink,
    contactLink: t.licContactLink,
    faqTitle: t.licFaqTitle,
    faq: [
      { q: t.licFaq1Q, a: t.licFaq1A },
      { q: t.licFaq2Q, a: t.licFaq2A },
      { q: t.licFaq3Q, a: t.licFaq3A },
      { q: t.licFaq4Q, a: t.licFaq4A },
      { q: t.licFaq5Q, a: t.licFaq5A },
      { q: t.licFaq6Q, a: t.licFaq6A },
    ],
    limitsTitle: t.licLimitsTitle,
    limitsBody: t.licLimitsBody,
    sourcesTitle: t.licSourcesTitle,
    sources: SOURCES,
  };
}

/** The sources are English-language articles, so their titles stay English on every locale. */
const SOURCES = [
  {
    name: "Short-Term Rentals in Thailand: Understanding the Non-Hotel Registration Framework (FOSR Law)",
    url: "https://fosrlaw.com/2026/short-term-rental-laws-thailand/",
  },
  {
    name: "Short-Term Rentals in Thailand: the Non-Hotel Registration Framework (FRANK Legal & Tax)",
    url: "https://franklegaltax.com/short-term-rentals-in-thailand-understanding-the-non-hotel-registration-framework/",
  },
  {
    name: "Legal Prohibition, Penalties and the Landed Property Exception (Lexology)",
    url: "https://www.lexology.com/library/detail.aspx?g=324a55bc-3b3b-434d-90d6-fe88d5153150",
  },
  {
    name: "Thailand Airbnb Rules 2026: Short-Term Rental Laws (Rumavi)",
    url: "https://rumavi.com/en/property-guides/short-term-rental-rules-in-thailand-what-airbnb-investors-need-to-know-in-2026",
  },
  {
    name: "Is Airbnb Legal in Thailand in 2026? (Relife Properties)",
    url: "https://relifeproperties.com/airbnb-legal-thailand/",
  },
] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return pageMeta({
    title: t.licMetaTitle,
    description: t.licMetaDesc,
    path: PATH,
    locale,
  });
}

export default async function LicencePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const COPY = pageCopy(t);
  const href = (path: string) => localePath(locale as Locale, path);
  const crumbs: Crumb[] = [{ name: COPY.crumb }];

  return (
    <div className="mx-auto max-w-(--container-prose) px-5 pb-18 pt-9">
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />
      <JsonLd data={faqSchema(COPY.faq.map((item) => ({ q: item.q, a: item.a })))} />

      <span className="eyebrow">{COPY.eyebrow}</span>
      <h1 className="mt-3 font-headline text-[clamp(28px,5vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
        {COPY.h1}
      </h1>
      <p className="mt-3 max-w-[600px] text-base leading-relaxed text-body">{COPY.intro}</p>

      {/* shape: first-screen answers. The four cases an owner asks about, before anything else. */}
      <dl className="mt-7 grid gap-3 sm:grid-cols-2">
        {COPY.answers.map((item) => (
          <div key={item.q} className="rounded-box border border-hairline px-5 py-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
              {item.q}
            </dt>
            <dd className="mt-1.5 text-[14.5px] leading-relaxed text-body">{item.a}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12">
        <h2 className="font-display text-xl font-bold tracking-[-0.015em]">{COPY.exemptionTitle}</h2>
        <dl className="mt-4 max-w-[640px] divide-y divide-hairline border-y border-hairline">
          {COPY.exemptionRows.map((row) => (
            <div key={row.k} className="grid gap-1 py-3 sm:grid-cols-[160px_1fr] sm:gap-4">
              <dt className="text-[14px] font-semibold text-ink">{row.k}</dt>
              <dd className="text-[15px] leading-relaxed text-body">{row.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-bold tracking-[-0.015em]">{COPY.condoTitle}</h2>
        <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-body">{COPY.condoBody}</p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-bold tracking-[-0.015em]">{COPY.helpTitle}</h2>
        <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-body">{COPY.helpBody}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={href("/how-it-works")} className="pill-primary inline-block">
            {COPY.helpLink}
          </Link>
          <Link
            href={href("/contact")}
            className="inline-block rounded-full border-[1.5px] border-hairline px-5 py-2.5 text-[14px] font-semibold hover:border-ink"
          >
            {COPY.contactLink}
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-bold tracking-[-0.015em]">{COPY.faqTitle}</h2>
        <Faq items={COPY.faq.map((item) => ({ q: item.q, a: item.a }))} />
      </section>

      <section className="mt-14 border-t border-hairline pt-8">
        <h2 className="font-display text-lg font-bold tracking-[-0.015em]">{COPY.limitsTitle}</h2>
        <p className="mt-2.5 max-w-[640px] text-[14px] leading-relaxed text-muted">{COPY.limitsBody}</p>
        <h3 className="mt-6 text-[14px] font-semibold text-ink">{COPY.sourcesTitle}</h3>
        <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed text-muted">
          {COPY.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} rel="noopener" target="_blank" className="underline hover:text-primary">
                {source.name}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
