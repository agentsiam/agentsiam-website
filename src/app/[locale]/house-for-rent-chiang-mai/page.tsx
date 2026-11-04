import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/faq";
import { JsonLd } from "@/components/json-ld";
import { StayRequestForm, type StayRequestLabels } from "@/components/stay-request-form";
import { getDictionary, type Dictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { AREAS } from "@/lib/areas";
import { pageMeta, routeOgImage } from "@/lib/site";
import { alt as ogAlt } from "./opengraph-image";
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
 * English, Thai and Chinese. The copy lives in the dictionaries under the `hfr` keys; Thai
 * addresses the guest as คุณ. The area names in the form stay English on every locale,
 * because that value is what reaches the mailbox.
 *
 * The approach for homes we do not list (finding service, owners only, every home checked
 * with photos, exact location and a speed test) is Ariya's, 01/11/2026. The owner's fee
 * stays off the page: the owner pays it.
 */

const PATH = "/house-for-rent-chiang-mai";

function pageCopy(t: Dictionary) {
  return {
    metaTitle: t.hfrMetaTitle,
    metaDesc: t.hfrMetaDesc,
    crumb: t.hfrCrumb,
    eyebrow: t.hfrEyebrow,
    h1: t.hfrH1,
    intro: t.hfrIntro,
    answers: [
      { q: t.hfrAns1Q, a: t.hfrAns1A },
      { q: t.hfrAns2Q, a: t.hfrAns2A },
      { q: t.hfrAns3Q, a: t.hfrAns3A },
      { q: t.hfrAns4Q, a: t.hfrAns4A },
    ],
    howTitle: t.hfrHowTitle,
    how: [t.hfrHow1, t.hfrHow2, t.hfrHow3, t.hfrHow4],
    haveBody: t.hfrHaveBody,
    haveLink: t.hfrHaveLink,
    formTitle: t.hfrFormTitle,
    formBody: t.hfrFormBody,
    faqTitle: t.hfrFaqTitle,
    faq: [
      { q: t.hfrFaq1Q, a: t.hfrFaq1A },
      { q: t.hfrFaq2Q, a: t.hfrFaq2A },
      { q: t.hfrFaq3Q, a: t.hfrFaq3A },
      { q: t.hfrFaq4Q, a: t.hfrFaq4A },
      { q: t.hfrFaq5Q, a: t.hfrFaq5A },
      { q: t.hfrFaq6Q, a: t.hfrFaq6A },
    ],
  };
}

function formLabels(t: Dictionary): StayRequestLabels {
  return {
    name: t.hfrFormName,
    email: t.hfrFormEmail,
    phone: t.hfrFormPhone,
    optional: t.hfrFormOptional,
    area: t.hfrFormArea,
    areaAny: t.hfrFormAreaAny,
    checkIn: t.hfrFormCheckIn,
    checkOut: t.hfrFormCheckOut,
    bedrooms: t.hfrFormBedrooms,
    budget: t.hfrFormBudget,
    budgetHint: t.hfrFormBudgetHint,
    foundVia: t.hfrFormFoundVia,
    foundViaHint: t.hfrFormFoundViaHint,
    message: t.hfrFormMessage,
    messageHint: t.hfrFormMessageHint,
    required: t.hfrFormRequired,
    send: t.hfrFormSend,
    sending: t.hfrFormSending,
    sentTitle: t.hfrFormSentTitle,
    sentBody: t.hfrFormSentBody,
    error: t.hfrFormError,
    consent: t.hfrFormConsent,
    privacy: t.hfrFormPrivacy,
  };
}

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return pageMeta({
    title: t.hfrMetaTitle,
    description: t.hfrMetaDesc,
    path: PATH,
    locale,
    image: routeOgImage(locale, PATH, ogAlt),
  });
}

export default async function HouseForRentPage({ params }: PageProps<"/[locale]">) {
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
          labels={formLabels(t)}
          areas={AREAS.map((area) => area.name)}
          page={PATH}
          privacyHref={href("/privacy-policy")}
        />
      </section>

      <p className="mt-6 max-w-[600px] text-[14px] leading-relaxed text-muted">
        {COPY.haveBody}{" "}
        <Link href={href("/properties")} className="font-semibold underline hover:text-primary">
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
