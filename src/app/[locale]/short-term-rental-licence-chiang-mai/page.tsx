import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/faq";
import { JsonLd } from "@/components/json-ld";
import { getDictionary, type Dictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { pickPhoto } from "@/lib/photos";
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
 * Block order: hero (the owner's own question, both owner routes out of it) -> the four
 * answers -> the Certificate of Exemption, as a spec panel -> the condo limit -> the ask ->
 * the FAQ that carries the FAQPage markup -> what the page is, and its sources.
 *
 * Built from the same named shapes as the rest of the site rather than as a prose
 * document, which is what it was. The hero carries a generated frame briefed against the
 * hero's own slots: it serves `reframe` and `ask`, two people working the documents
 * together rather than one owner alone. The first frame here showed a man alone, which can
 * only carry `symptom`, so it showed the predicament this page exists to resolve and was
 * pulled for it. The second figure is the argument. The ground stays underneath the image
 * as what shows if the file fails to load.
 *
 * Neither the condo limit nor the ask takes a verdict hue, because teal and vermilion are
 * verdict tokens and the ground would then rate copy the page never rated.
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
  const heroPhoto = pickPhoto("heroes", "at-the-table");

  return (
    <div>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />
      <JsonLd data={faqSchema(COPY.faq.map((item) => ({ q: item.q, a: item.a })))} />

      {/* shape: hero -- the owner's own question, and the two owner routes out of it. */}
      <section className="px-5">
        <div className="relative mx-auto mt-4 max-w-(--container-chrome) overflow-hidden rounded-panel bg-primary px-6 py-13 sm:px-12 sm:py-14">
          {/* The frame serves this hero's own spine slots, not `fit`: a hero carries
              `symptom`, `reframe` and `ask`, and the first pair of frames was briefed
              against `fit` and pulled for it. The ground stays underneath as what shows
              if the file fails to load. */}
          {heroPhoto ? (
            <div className="absolute inset-y-0 right-0 hidden w-[32%] min-[900px]:block">
              <Image
                src={heroPhoto.src}
                alt={heroPhoto.alt}
                lang="en"
                placeholder="blur"
                fill
                priority
                sizes="(min-width: 900px) 460px, 0px"
                className="object-cover"
              />
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-y-0 right-0 hidden w-[24%] bg-sand min-[900px]:block"
            />
          )}
          <div className="relative min-[900px]:max-w-[min(680px,calc(66%-24px))]">
            <span className="eyebrow inline-block rounded-full bg-linear-to-b from-white/95 to-white/70 px-4.5 py-2 text-ink">
              {COPY.eyebrow}
            </span>
            <h1 className="mt-4.5 font-headline text-[clamp(28px,5vw,42px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
              {COPY.h1}
            </h1>
            <p className="mt-4 max-w-[560px] text-base leading-relaxed text-white/85">
              {COPY.intro}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5.5">
              <Link href={href("/how-it-works")} className="pill-primary">
                {COPY.helpLink}
              </Link>
              <Link
                href={href("/contact")}
                className="hit inline-block text-[14.5px] text-white underline underline-offset-4"
              >
                {COPY.contactLink}
              </Link>
            </div>
          </div>
          {/* The phone copy. The frames are portrait, made for the tall column this hero
              carries at 900px and up, so the ratio stays close to the source: a 16:10 band
              out of the middle of a 2:3 frame is a slice, not a photograph. Its own
              `sizes` keeps the two copies from both being fetched, and it is above the
              fold on a phone, so it carries `priority`. */}
          {heroPhoto ? (
            <div className="relative mt-8 aspect-4/5 overflow-hidden rounded-box min-[900px]:hidden">
              <Image
                src={heroPhoto.src}
                alt={heroPhoto.alt}
                lang="en"
                placeholder="blur"
                fill
                priority
                sizes="(min-width: 900px) 0px, calc(100vw - 88px)"
                className="object-cover"
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* shape: answer-grid -- the four cases an owner asks about, before anything else. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-14">
        <dl className="grid gap-4 sm:grid-cols-2">
          {COPY.answers.map((item, i) => (
            <div key={item.q} className="rounded-panel border border-hairline px-6.5 py-6">
              <dt className="flex items-baseline gap-3">
                <span aria-hidden="true" className="font-mono text-[13px] font-semibold text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="eyebrow">{item.q}</span>
              </dt>
              <dd className="mt-3 text-[15px] leading-relaxed text-body">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* shape: spec-panel -- the Certificate of Exemption, as a panel rather than six rows
          of hairline. The rows are the page's reference content and are read by row. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {COPY.exemptionTitle}
        </h2>
        <dl className="mt-6 overflow-hidden rounded-panel border border-hairline">
          {COPY.exemptionRows.map((row, i) => (
            <div
              key={row.k}
              className={`grid gap-1 px-6 py-4.5 sm:grid-cols-[190px_1fr] sm:gap-6 ${
                i % 2 === 1 ? "bg-surface" : ""
              }`}
            >
              <dt className="eyebrow pt-0.5">{row.k}</dt>
              <dd className="text-[15px] leading-relaxed text-body">{row.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* shape: limit-callout -- the condo answer. Surface rather than a verdict hue: this
          is the page's exclusion, and the excluded column on /how-it-works reads the same. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <div className="rounded-panel bg-surface px-6.5 py-7 sm:px-8.5">
          <h2 className="font-display text-[23px] font-bold tracking-[-0.02em]">
            {COPY.condoTitle}
          </h2>
          <p className="mt-3 max-w-[720px] text-[15px] leading-relaxed text-body">
            {COPY.condoBody}
          </p>
        </div>
      </section>

      {/* shape: highlight-panel -- the ask. The one place on the page that sells, and the
          only block carrying both owner CTAs. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <div className="grad-sand rounded-panel px-6 py-8 sm:px-8.5">
          <h2 className="font-display text-[23px] font-bold tracking-[-0.02em] text-ink">
            {COPY.helpTitle}
          </h2>
          <p className="mt-2.5 max-w-[700px] text-[15px] leading-relaxed text-ink/85">
            {COPY.helpBody}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={href("/how-it-works")} className="pill-primary">
              {COPY.helpLink}
            </Link>
            <Link href={href("/contact")} className="pill-outline">
              {COPY.contactLink}
            </Link>
          </div>
        </div>
      </section>

      {/* shape: faq-rows -- the questions owners ask, carrying the FAQPage markup. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-15">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">{COPY.faqTitle}</h2>
        <Faq items={COPY.faq.map((item) => ({ q: item.q, a: item.a }))} />
      </section>

      {/* shape: sources-block -- what the page is and what it is not, then the sources it
          came from. Lower weight on purpose: it is provenance, not the argument. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pb-18 pt-16">
        <div className="rounded-panel border border-hairline px-6.5 py-7 sm:px-8.5">
          <h2 className="font-display text-[18px] font-bold tracking-[-0.015em]">
            {COPY.limitsTitle}
          </h2>
          <p className="mt-2.5 max-w-[720px] text-[14px] leading-relaxed text-muted">
            {COPY.limitsBody}
          </p>
          <h3 className="eyebrow mt-7">{COPY.sourcesTitle}</h3>
          <ul className="mt-3 grid gap-2 text-[14px] leading-relaxed text-muted sm:grid-cols-2">
            {COPY.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  rel="noopener"
                  target="_blank"
                  className="underline hover:text-primary"
                >
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
