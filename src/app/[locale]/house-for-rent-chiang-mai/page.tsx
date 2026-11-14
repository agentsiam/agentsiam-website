import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/faq";
import { JsonLd } from "@/components/json-ld";
import { StayRequestForm } from "@/components/stay-request-form";
import { getDictionary, type Dictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { AREAS } from "@/lib/areas";
import { pageMeta, routeOgImage } from "@/lib/site";
import { stayRequestLabels } from "@/lib/stay-request-copy";
import { alt as ogAlt } from "./opengraph-image";
import { breadcrumbSchema, faqSchema, type Crumb } from "@/lib/structured-data";

/**
 * Monthly house rental in Chiang Mai: the template for the guest-demand pages.
 *
 * Target query: "house for rent chiang mai" (Search Console, www property, 31/07 to
 * 30/10/2026: 31 variants, 101 impressions, average position 7.6, 0 clicks).
 *
 * Block order: hero (the search's own question, one button to the form) -> the four
 * answers every long-stay guest asks, as cards -> the numbered steps after a request ->
 * the request form -> the FAQ that carries the FAQPage markup -> the neighbourhoods ->
 * the houses we run ourselves. Lotus House is a link, not a tile: the page answers the
 * search, it is not a listing.
 *
 * Built from the same named shapes as the rest of the site rather than as a prose
 * document, which is what it was. The hero's right-hand block is the abstract ground the
 * guardrails call the empty image slot: no generated frame is approved for this page, and
 * the ground is the correct treatment until one is.
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
    formBody: t.srFormIntro,
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
    <div>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />
      <JsonLd data={faqSchema(COPY.faq.map((item) => ({ q: item.q, a: item.a })))} />

      {/* shape: hero -- the question the page answers, and the one button that answers it. */}
      <section className="px-5">
        <div className="relative mx-auto mt-4 max-w-(--container-chrome) overflow-hidden rounded-panel bg-primary px-6 py-13 sm:px-12 sm:py-14">
          {/* The abstract ground is the empty image slot, not a placeholder to feel bad
              about: no approved frame exists for this page yet. aria-hidden, and the hue
              carries no verdict. */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 hidden w-[24%] bg-sand min-[900px]:block"
          />
          <div className="relative min-[900px]:max-w-[min(680px,calc(70%-24px))]">
            <span className="eyebrow inline-block rounded-full bg-linear-to-b from-white/95 to-white/70 px-4.5 py-2 text-ink">
              {COPY.eyebrow}
            </span>
            <h1 className="mt-4.5 font-headline text-[clamp(28px,5vw,42px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
              {COPY.h1}
            </h1>
            <p className="mt-4 max-w-[560px] text-base leading-relaxed text-white/85">
              {COPY.intro}
            </p>
            <div className="mt-7">
              <a href="#request" className="pill-primary">
                {COPY.formTitle}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* shape: answer-grid -- the four questions both leads asked, each a card rather than
          a row of a definition list, so the first screen reads as four answers. */}
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

      {/* shape: step-band -- what happens after the request. The competitor baseline carries
          a visible numbered funnel on the page; this is ours, and it was an ordered list. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">{COPY.howTitle}</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 min-[900px]:grid-cols-4">
          {COPY.how.map((step, i) => (
            <li key={step} className="rounded-panel bg-surface px-5.5 py-5.5">
              <span aria-hidden="true" className="font-mono text-[13px] font-semibold text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2.5 text-[14.5px] leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* shape: contact-form -- the conversion, in a panel rather than loose on the page. */}
      <section id="request" className="mx-auto max-w-(--container-prose) scroll-anchor px-5 pt-16">
        <div className="rounded-panel border border-hairline px-6 py-9 sm:px-10">
          <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
            {COPY.formTitle}
          </h2>
          <p className="mt-2 mb-7 max-w-[600px] text-[15px] leading-relaxed text-muted">
            {COPY.formBody}
          </p>
          <StayRequestForm
            labels={stayRequestLabels(t)}
            areas={AREAS.map((area) => area.name)}
            page={PATH}
            locale={locale as Locale}
            privacyHref={href("/privacy-policy")}
          />
        </div>
      </section>

      {/* shape: faq-rows -- FAQ, carrying the FAQPage markup. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-15">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">{COPY.faqTitle}</h2>
        <Faq items={COPY.faq.map((item) => ({ q: item.q, a: item.a }))} />
      </section>

      {/* shape: area-chips -- the neighbourhoods, as the way out to the area pages. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[20px] font-bold tracking-[-0.015em]">
          {t.navDestinations}
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
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

      {/* shape: highlight-panel -- the houses we run ourselves, as the page's closing beat
          rather than a paragraph stranded under the form. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pb-18 pt-15">
        <div className="grad-sand rounded-panel px-6 py-8 sm:px-8.5">
          <p className="max-w-[700px] text-[15px] leading-relaxed text-ink/85">{COPY.haveBody}</p>
          <Link
            href={href("/properties")}
            className="hit mt-3.5 inline-block text-[15px] font-semibold text-ink underline underline-offset-4 hover:text-primary"
          >
            {COPY.haveLink} →
          </Link>
        </div>
      </section>
    </div>
  );
}
