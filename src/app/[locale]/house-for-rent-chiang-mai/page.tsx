import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/faq";
import { JsonLd } from "@/components/json-ld";
import { StayRequestForm, type StayRequestLabels } from "@/components/stay-request-form";
import { getDictionary } from "@/i18n";
import { DEFAULT_LOCALE, isLocale, localePath, type Locale } from "@/i18n/config";
import { AREAS } from "@/lib/areas";
import { LOTUS_HOUSE } from "@/lib/property";
import { englishOnlyAlternates, pageMeta } from "@/lib/site";
import { breadcrumbSchema, faqSchema, type Crumb } from "@/lib/structured-data";

/**
 * Monthly house rental in Chiang Mai: the template for the guest-demand pages.
 *
 * Target query: "house for rent chiang mai" (Search Console, www property, 31/07 to
 * 30/10/2026: 31 variants, 101 impressions, average position 7.6, 0 clicks).
 *
 * The first screen answers the four things every long-stay guest asks: the monthly rate or
 * how to get one, what is included, deposit and terms, and where. Then the request form,
 * one line on the house we run, and the FAQ that carries the FAQPage markup. Lotus House
 * is a link, not a tile: the page answers the search, it is not a listing.
 *
 * **English only.** Rendered on /en alone, with hreflang naming English only and the
 * sitemap listing the one URL (`englishOnly` in ROUTES). When the copy is translated in one
 * pass (R9) it moves into the dictionaries and the flag goes.
 *
 * The approach for homes we do not list (finding service, owners only, every home checked
 * with photos, exact location and a speed test) is Ariya's, 01/11/2026. The owner's fee
 * stays off the page: the owner pays it.
 */

const PATH = "/house-for-rent-chiang-mai";

const COPY = {
  metaTitle: "Houses for rent in Chiang Mai, by the month",
  metaDesc:
    "Private houses for rent in Chiang Mai by the month, found for you. Send your dates, size, area and budget. Every home is checked first: photos, exact location and a Wi-Fi speed test.",
  crumb: "House for rent, monthly",
  eyebrow: "Monthly stays · Chiang Mai",
  h1: "Houses for rent in Chiang Mai, by the month.",
  intro:
    "Tell us your dates, size, area, budget and must-haves. We find a privately owned home that fits, from owners and never from other agents, and send it to you with the total price.",
  answers: [
    {
      q: "Monthly rate",
      a: "Priced per home for your dates. We send the total for the whole stay before you decide.",
    },
    {
      q: "What's included",
      a: "Stated for each home before you book: utilities, cleaning and internet. At the house we run, stays of 28 nights or more include utilities on fair use and one clean a week.",
    },
    {
      q: "Deposit and terms",
      a: "Any deposit is agreed per home and stated before you book. Monthly terms start at 28 nights.",
    },
    {
      q: "Wi-Fi and location",
      a: "Measured at each home: the owner sends a speed test, and we send it to you with the photos and the exact location before you book.",
    },
  ],
  howTitle: "How it works",
  how: [
    "You send the request below: dates, bedrooms, area, budget and what the home must have.",
    "We look for privately owned homes that fit, from owners, never from other agents.",
    "Before we offer a home we check it: photos, exact location, and a Wi-Fi speed test from the owner.",
    "You get the homes that fit, each with the total price, what is included and the deposit, and decide.",
  ],
  haveBody:
    "We also run one house ourselves, Lotus House in Chang Khlan, and we would rather run one well than list ten.",
  haveLink: "See Lotus House",
  formTitle: "Tell us what you need",
  formBody: "A person reads every request and replies by email.",
  faqTitle: "Questions guests ask",
  faq: [
    {
      q: "Do you have a private house free for a month in Chiang Mai?",
      a: "Send your dates through the form on this page. We look for privately owned houses that are free for those dates and reply with the ones that fit, each with photos, the exact location and the total price.",
    },
    {
      q: "What does the monthly rate cover?",
      a: "It depends on the home, and we state it for each one before you book: utilities, cleaning and internet. At the house we run, stays of 28 nights or more include utilities on fair use and one clean a week on a fixed day and time. Extra cleans are charged.",
    },
    {
      q: "What is the deposit?",
      a: "Any deposit is agreed per home and stated before you book, so you know it before you pay anything.",
    },
    {
      q: "Is the Wi-Fi fast enough for remote work?",
      a: "We do not guess. Before we offer a home, the owner sends a speed test, and we pass it to you with the photos and the exact location.",
    },
    {
      q: "Can you find a house near Nimman, Santitham or the Old City?",
      a: "Yes, ask. Choose the area in the form, or say anywhere in Chiang Mai, and we tell you plainly if we cannot find a match.",
    },
    {
      q: "Do you work with other agents?",
      a: "No. We find homes from their owners and check each one before we offer it.",
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
  message: "Must-haves",
  messageHint: "Private house, outdoor space, fibre Wi-Fi, work desk, quiet, near nature...",
  required: "required",
  send: "Send request",
  sending: "Sending...",
  sentTitle: "Request received.",
  sentBody: "A person reads it and replies by email. If it is urgent, write to",
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
        <h2 className="font-display text-xl font-bold tracking-[-0.015em]">{COPY.howTitle}</h2>
        <ol className="mt-4 max-w-[640px] list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-body">
          {COPY.how.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
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

      <p className="mt-6 max-w-[600px] text-[14px] leading-relaxed text-muted">
        {COPY.haveBody}{" "}
        <Link href={href(`/${LOTUS_HOUSE.slug}`)} className="font-semibold underline hover:text-primary">
          {COPY.haveLink}
        </Link>
      </p>

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
