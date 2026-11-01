import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/faq";
import { JsonLd } from "@/components/json-ld";
import { DEFAULT_LOCALE, isLocale, localePath, type Locale } from "@/i18n/config";
import { englishOnlyAlternates, pageMeta } from "@/lib/site";
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
 * **English only**, like /house-for-rent-chiang-mai, until the copy is translated in one
 * pass (R9).
 */

const PATH = "/short-term-rental-licence-chiang-mai";

const COPY = {
  metaTitle: "Short-term rental licence in Chiang Mai: condos and houses",
  metaDesc:
    "Do you need a licence to rent out your condo or house short term in Chiang Mai? The 30-night rule, the non-hotel Certificate of Exemption, and why condos cannot use it.",
  crumb: "Short-term rental licence",
  eyebrow: "For owners · Chiang Mai",
  h1: "Do you need a licence to rent out short term in Chiang Mai?",
  intro:
    "For stays under 30 nights, in most cases yes. Here is what the rules say today, for condos and for houses. Confirm the position for your own property before you list it.",
  answers: [
    {
      q: "Stays of 30 nights or more",
      a: "Legal without hotel registration.",
    },
    {
      q: "Stays under 30 nights",
      a: "Fall under hotel-type registration under Thai law.",
    },
    {
      q: "Houses, townhouses and villas",
      a: "Can take the non-hotel route: notify the local Registrar and obtain a Certificate of Exemption, instead of a full hotel licence.",
    },
    {
      q: "Condos",
      a: "Cannot use the Certificate of Exemption. It is available to landed property only.",
    },
  ],
  exemptionTitle: "The Certificate of Exemption",
  exemptionRows: [
    { k: "Who can apply", v: "Owners of landed property: houses, townhouses and villas. Not condominium units." },
    { k: "Limit", v: "Up to 8 rooms and 30 guests. Raised in 2023 from 4 rooms and 20 guests, and the old figure is still widely repeated." },
    { k: "Valid for", v: "5 years, renewable." },
    { k: "Inspection", v: "A safety inspection is mandatory: fire extinguishers, emergency lighting and smoke detectors." },
    { k: "Where", v: "The District Office or the Provincial Administration Office." },
  ],
  condoTitle: "If you own a condo",
  condoBody:
    "The Certificate of Exemption is not open to condominium units, so a condo has no exemption route for stays under 30 nights. Stays of 30 nights or more do not need hotel registration. Separately from national law, your building's own rules can restrict short-term letting, so check them with the building's juristic person.",
  helpTitle: "We can file it for you",
  helpBody:
    "We assess your property against these rules, prepare the documents and file the application under power of attorney, so you do not have to deal with the office yourself.",
  helpLink: "See how it works",
  contactLink: "Ask about your property",
  faqTitle: "Questions owners ask",
  faq: [
    {
      q: "Do I need a licence to rent out my condo short term in Chiang Mai?",
      a: "For stays under 30 nights, the rules treat it as hotel-type accommodation, and the non-hotel Certificate of Exemption is not available to condominium units. Stays of 30 nights or more do not need hotel registration. Your building's own rules can restrict short-term letting as well. Confirm the position for your unit before you list it.",
    },
    {
      q: "Is Airbnb legal in a Chiang Mai condo?",
      a: "For stays of 30 nights or more, it needs no hotel registration, subject to your building's rules. For shorter stays a condo unit has no exemption route, because the Certificate of Exemption covers landed property only.",
    },
    {
      q: "Do I need a short-term rental licence for a house in Chiang Mai?",
      a: "For stays under 30 nights, yes. A house, townhouse or villa can take the non-hotel route instead of a full hotel licence: notify the District Office or the Provincial Administration Office and obtain a Certificate of Exemption, valid for 5 years and renewable.",
    },
    {
      q: "How many rooms and guests does the Certificate of Exemption allow?",
      a: "Up to 8 rooms and 30 guests, raised in 2023 from 4 rooms and 20 guests. The published sources do not settle whether rooms means bedrooms only or every habitable room.",
    },
    {
      q: "What does the safety inspection check?",
      a: "Fire extinguishers, emergency lighting and smoke detectors.",
    },
    {
      q: "Is the 30-night rule enforced in Chiang Mai?",
      a: "Enforcement is expanding in tourist-heavy areas, and in Chiang Mai that means Nimman and the Old City.",
    },
  ],
  limitsTitle: "What this page is",
  limitsBody:
    "A summary of what published sources say today. It is not legal advice: confirm the position for your own property before you list it.",
  sourcesTitle: "Sources",
  sources: [
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
  ],
} as const;

export function generateStaticParams() {
  return [{ locale: DEFAULT_LOCALE }];
}

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== DEFAULT_LOCALE) notFound();
  const meta = pageMeta({
    title: COPY.metaTitle,
    description: COPY.metaDesc,
    path: PATH,
    locale,
  });
  // English only, so hreflang names English alone rather than two URLs that 404.
  return {
    ...meta,
    alternates: { canonical: meta.alternates?.canonical, languages: englishOnlyAlternates(PATH) },
  };
}

export default async function LicencePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale) || locale !== DEFAULT_LOCALE) notFound();
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
