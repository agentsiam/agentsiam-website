import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/faq";
import { JsonLd } from "@/components/json-ld";
import { PropertyTile } from "@/components/property-tile";
import { StayRequestForm, type StayRequestLabels } from "@/components/stay-request-form";
import { getDictionary } from "@/i18n";
import { DEFAULT_LOCALE, isLocale, localePath, type Locale } from "@/i18n/config";
import { AREAS } from "@/lib/areas";
import { LOTUS_HOUSE } from "@/lib/property";
import { pageMeta } from "@/lib/site";
import { breadcrumbSchema, faqSchema, type Crumb } from "@/lib/structured-data";

/**
 * Monthly house rental in Chiang Mai: the template for the guest-demand pages.
 *
 * Target query: "house for rent chiang mai" (Search Console, www property, 31/07 to
 * 30/10/2026: 31 variants, 101 impressions, average position 7.6, 0 clicks).
 *
 * The first screen answers the four things every long-stay guest asks: the monthly rate or
 * how to get one, what is included, deposit and terms, and where. Then what we actually
 * have, then the request form, then the FAQ that carries the FAQPage markup.
 *
 * **Template status.** English only and `placeholder` in ROUTES, so it is noindex and out
 * of the sitemap. Lines marked TO CONFIRM are facts nobody has given yet (what the monthly
 * price includes, the deposit, the Wi-Fi speed). They stay visible on the preview on
 * purpose, so they cannot ship by accident. Once the copy is settled it moves into the
 * dictionaries and is translated in one pass (R9), and the page renders on every locale.
 */

const PATH = "/house-for-rent-chiang-mai";

const COPY = {
  metaTitle: "Houses for rent in Chiang Mai, by the month",
  metaDesc:
    "Monthly house rentals in Chiang Mai for remote workers and families. Tell us your dates, area and budget, and we reply with what fits and a price.",
  crumb: "House for rent, monthly",
  eyebrow: "Monthly stays · Chiang Mai",
  h1: "Houses for rent in Chiang Mai, by the month.",
  intro:
    "Staying three weeks or three months? Tell us the dates, the area and the budget. We reply with what fits and a price for your dates.",
  answers: [
    {
      q: "Monthly rate",
      a: "Priced for your dates. Send the form and we reply with a price for the whole stay.",
    },
    {
      q: "What's included",
      a: "TO CONFIRM: electricity, water, cleaning and the Wi-Fi speed.",
    },
    {
      q: "Deposit and terms",
      a: "TO CONFIRM: deposit amount, when it is returned, and the minimum stay.",
    },
    {
      q: "Where",
      a: "Our house is in Chang Khlan, near the Night Bazaar. Ask about Nimman, Santitham, the Old City or further out and we tell you honestly what we can find.",
    },
  ],
  haveTitle: "What we run today",
  haveBody:
    "One house, run properly. We would rather run one well than list ten. If it does not fit your dates or your family, the form below is how we look further for you.",
  formTitle: "Tell us what you need",
  formBody: "One form, two minutes. A person reads it and replies by email.",
  faqTitle: "Questions guests ask",
  faq: [
    {
      q: "Can I rent a house in Chiang Mai by the month?",
      a: "Yes. Send your dates, the area you want and your budget through the form on this page, and we reply with what fits and a price for the whole stay.",
    },
    {
      q: "Is Wi-Fi good enough for remote work?",
      a: "TO CONFIRM: the measured download and upload speed at the house.",
    },
    {
      q: "Are electricity and water included in a monthly rent?",
      a: "TO CONFIRM: what the monthly price covers and how electricity is billed.",
    },
    {
      q: "Do you only rent the houses on this site?",
      a: "We run one house today. When a request does not fit it, we look for one that does, and tell you plainly if we cannot find a match.",
    },
  ],
} as const;

const FORM_LABELS: StayRequestLabels = {
  name: "Your name",
  email: "Email",
  phone: "Phone, WhatsApp or LINE",
  optional: "optional",
  area: "Area",
  areaAny: "Anywhere in Chiang Mai",
  checkIn: "Arrive",
  checkOut: "Leave",
  bedrooms: "Bedrooms",
  budget: "Budget",
  budgetHint: "e.g. 30,000 THB a month",
  foundVia: "How did you find us?",
  foundViaHint: "e.g. Google, ChatGPT, a friend, Facebook",
  message: "Anything else",
  messageHint: "Work desk, pool, pets, parking, schools nearby...",
  required: "required",
  send: "Send request",
  sending: "Sending...",
  sentTitle: "Request received.",
  sentBody: "We reply by email, usually the same day. If it is urgent, write to",
  error: "Sending failed. Please email us at {email}.",
  consent: "We use what you send only to reply to this request. See our",
  privacy: "privacy policy",
};

export function generateStaticParams() {
  return [{ locale: DEFAULT_LOCALE }];
}

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== DEFAULT_LOCALE) notFound();
  return pageMeta({
    title: COPY.metaTitle,
    description: COPY.metaDesc,
    path: PATH,
    locale,
    placeholder: true,
  });
}

export default async function HouseForRentPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale) || locale !== DEFAULT_LOCALE) notFound();
  const t = getDictionary(locale);
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

      {/* shape: first-screen answers. The four questions both leads asked, before anything else. */}
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
      <a href="#request" className="pill-primary mt-6 inline-block">
        {COPY.formTitle}
      </a>

      <section className="mt-12">
        <h2 className="font-display text-xl font-bold tracking-[-0.015em]">{COPY.haveTitle}</h2>
        <p className="mt-2.5 max-w-[600px] text-[15px] leading-relaxed text-body">
          {COPY.haveBody}
        </p>
        <div className="mt-5 grid gap-6 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          <PropertyTile property={LOTUS_HOUSE} t={t} href={href(`/${LOTUS_HOUSE.slug}`)} />
        </div>
      </section>

      <section id="request" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-xl font-bold tracking-[-0.015em]">{COPY.formTitle}</h2>
        <p className="mt-2.5 mb-5 max-w-[600px] text-[15px] leading-relaxed text-body">
          {COPY.formBody}
        </p>
        <StayRequestForm
          labels={FORM_LABELS}
          areas={AREAS.map((area) => area.name)}
          page={PATH}
          privacyHref={href("/privacy-policy")}
        />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-bold tracking-[-0.015em]">{COPY.faqTitle}</h2>
        <Faq items={COPY.faq.map((item) => ({ q: item.q, a: item.a }))} />
      </section>

      <section className="mt-14 border-t border-hairline pt-8">
        <h2 className="font-display text-lg font-bold tracking-[-0.015em]">{t.navDestinations}</h2>
        <ul className="mt-3.5 flex flex-wrap gap-2">
          {AREAS.map((area) => (
            <li key={area.slug}>
              <Link
                href={href(`/destinations/${area.slug}`)}
                className="inline-block rounded-full border-[1.5px] border-hairline px-3.5 py-2 text-[12.5px] hover:border-ink"
              >
                {area.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
