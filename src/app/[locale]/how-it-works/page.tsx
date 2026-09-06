import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/faq";
import { Icon } from "@/components/icon";
import { JsonLd } from "@/components/json-ld";
import { SampleReport } from "@/components/sample-report";
import { TeamRow } from "@/components/team-row";
import { type Dictionary, getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { pickPhotos } from "@/lib/photos";
import { LOTUS_HOUSE } from "@/lib/property";
import { pageMeta } from "@/lib/site";
import { faqSchema } from "@/lib/structured-data";
import { Qualifier } from "./qualifier";

/**
 * The owner conversion page. Block order: hero → routes → menu → what the fee buys → the
 * two gates → the qualifier → included/not included → TM30 → FAQ → closing CTA → guest link.
 *
 * Restructured 25/08/2026 from "a staircase, not a menu" to a menu. The services no longer
 * run in a fixed order: the study applies where there is no occupancy record to read, and
 * the permission applies to owners who do not already hold one. The routes block above the
 * menu is what keeps that from becoming a list the owner has to sort for themselves.
 *
 * Three rules hold this page together and should survive any edit:
 *
 * - No prices anywhere. Prices live in the internal price book, and a rate card here would
 *   turn a scoped study into a line item. Confirmed again 25/08/2026.
 * - Exclusions are printed next to inclusions on the three core services. The "Not included"
 *   box is not a disclaimer to be shrunk; it is the reason the inclusions are credible. The
 *   three alongside-management services deliberately have no such box -- they answer S3's
 *   limits rather than adding to them, and introducing them through an exclusion is exactly
 *   what the 25/08/2026 review asked us to stop doing.
 * - The permission is offered, never demanded. Owners who choose not to apply are still
 *   served, and the page says nothing that implies otherwise.
 *
 * The long-form copy is the design's own and is unchanged in English. It was English on
 * every locale until 06/09/2026, when the CORE, EXTRAS, INCLUDED, EXCLUDED and FAQ arrays,
 * every inline sentence in the markup, the qualifier and the sample report were all moved
 * into the dictionaries. The FAQ array also feeds faqSchema(), so that fixed the structured
 * data at the same time.
 *
 * <TranslationNote> went with them. It named "property descriptions, legal pages and the
 * detailed owner sections below", and the last of those is no longer true of this page, so
 * the note would have been a false statement a reader could check in one scroll. The pages
 * it does describe still render it. What is still English here is the alt text on the three
 * proof photographs and the five portraits, which comes from the generated photo manifest
 * (the captions are the image files' own metadata) rather than from any string in this
 * repository, and is English on every page of the site rather than this one.
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return pageMeta({
    title: t.metaHowTitle,
    description: t.metaHowDesc,
    path: "/how-it-works",
    locale,
  });
}

const CORE = [
  { n: "1", fill: "bg-teal" },
  { n: "2", fill: "bg-secondary" },
  { n: "3", fill: "bg-sand" },
];

/**
 * The three that sit alongside management rather than in front of it. Deliberately no
 * "Not included" box: these are the answer to S3's limits, not more limits, and framing
 * them as exclusions is what the 25/08/2026 review asked us to stop doing.
 */
const EXTRAS = [
  { n: "4", fill: "bg-wash-green" },
  { n: "5", fill: "bg-wash-gold" },
  { n: "6", fill: "bg-wash-red" },
];

/**
 * The four route glyphs moved to src/components/icon.tsx on 06/09/2026, when the property
 * page wanted amenity icons and a second private set would have been two systems on one
 * site. The spec's own instruction is to extend the existing set rather than start another
 * one, so that file is now the set. Route cards read from it by name below.
 */

/**
 * The routes. This is the "tailored" half of a menu -- six services in a list is not a
 * tailored offering, six services with a recommended starting point per situation is.
 * Ordered by how often we see them, not by service number.
 */
const ROUTES = [
  { icon: "trend", grad: "grad-sand" },
  { icon: "search", grad: "grad-blue" },
  { icon: "house", grad: "grad-teal" },
  { icon: "transfer", grad: "grad-vermilion" },
];

/**
 * The included / not included split, and the FAQ. Built per locale from the dictionary
 * rather than held as module-scope literals: the FAQ array is also what feeds faqSchema(),
 * so an English literal here published English structured data on /th and /zh as well as
 * English text on the page.
 *
 * Two of the nine inclusions are the same sentences as the management card's bullets, so
 * they read from the same keys rather than a second spelling of the same promise.
 */
function includedList(t: Dictionary): string[] {
  return [
    t.hwInc1,
    t.hwInc2,
    t.hwCore3Get3,
    t.hwInc4,
    t.hwCore3Get5,
    t.hwInc6,
    t.hwInc7,
    t.hwInc8,
    t.hwInc9,
  ];
}

function excludedList(t: Dictionary): string[] {
  return [t.hwExc1, t.hwExc2, t.hwExc3, t.hwExc4, t.hwExc5, t.hwExc6, t.hwExc7];
}

function faqList(t: Dictionary): { q: string; a: string }[] {
  return [
    { q: t.hwFaq1Q, a: t.hwFaq1A },
    { q: t.hwFaq2Q, a: t.hwFaq2A },
    { q: t.hwFaq3Q, a: t.hwFaq3A },
    { q: t.hwFaq4Q, a: t.hwFaq4A },
    { q: t.hwFaq5Q, a: t.hwFaq5A },
    { q: t.hwFaq6Q, a: t.hwFaq6A },
    { q: t.hwFaq7Q, a: t.hwFaq7A },
    { q: t.hwFaq8Q, a: t.hwFaq8A },
  ];
}

export default async function HowItWorksPage({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);

  const included = includedList(t);
  const excluded = excludedList(t);
  const faq = faqList(t);

  // Three shots that show the work rather than the mood: the terrace we maintain, the
  // kitchen we turn over, the street we operate on. Falls back to the top of the set if any
  // of these are renamed, and the whole block disappears if there are no photos.
  //
  // Not lotus_exterior_1: that file is a portrait shot padded with blurred bars to fake a
  // landscape crop, and the bars show up the moment it is cropped to 4:3.
  //
  // The third slot used to ask for 20240402_053731, the carport, as "the front door we hand
  // keys at". That file was pulled on 18/08/2026 for showing the house number and a legible
  // licence plate, so the fragment had been resolving to nothing and pickPhotos was silently
  // topping the slot up from the front of the set. See _excluded/README.md.
  const proofPhotos = pickPhotos(LOTUS_HOUSE.slug, [
    "IMG_5359",
    "IMG_5724",
    "mainstree_exterior_lotushouse",
  ]);

  const routes = [
    { ...ROUTES[0], when: t.route1When, take: t.route1Take, why: t.route1Why },
    { ...ROUTES[1], when: t.route2When, take: t.route2Take, why: t.route2Why },
    { ...ROUTES[2], when: t.route3When, take: t.route3Take, why: t.route3Why },
    { ...ROUTES[3], when: t.route4When, take: t.route4Take, why: t.route4Why },
  ];

  const core = [
    {
      ...CORE[0],
      title: t.step1Name,
      meta: t.step1Meta,
      body: t.hwCore1Body,
      limit: t.hwCore1Limit,
      gets: [
        t.hwCore1Get1,
        t.hwCore1Get2,
        t.hwCore1Get3,
        t.hwCore1Get4,
        t.hwCore1Get5,
        t.hwCore1Get6,
      ],
    },
    {
      ...CORE[1],
      title: t.step2Name,
      meta: t.step2Meta,
      body: t.hwCore2Body,
      limit: t.hwCore2Limit,
      gets: [t.hwCore2Get1, t.hwCore2Get2, t.hwCore2Get3, t.hwCore2Get4],
    },
    {
      ...CORE[2],
      title: t.step3Name,
      meta: t.step3Meta,
      body: t.hwCore3Body,
      limit: t.hwCore3Limit,
      gets: [
        t.hwCore3Get1,
        t.hwCore3Get2,
        t.hwCore3Get3,
        t.hwCore3Get4,
        t.hwCore3Get5,
        t.hwCore3Get6,
      ],
    },
  ];

  const extras = [
    {
      ...EXTRAS[0],
      title: t.step4Name,
      meta: t.step4Meta,
      body: t.hwExtra4Body,
      gets: [t.hwExtra4Get1, t.hwExtra4Get2, t.hwExtra4Get3, t.hwExtra4Get4],
    },
    {
      ...EXTRAS[1],
      title: t.step5Name,
      meta: t.step5Meta,
      body: t.hwExtra5Body,
      gets: [t.hwExtra5Get1, t.hwExtra5Get2, t.hwExtra5Get3, t.hwExtra5Get4],
    },
    {
      ...EXTRAS[2],
      title: t.step6Name,
      meta: t.step6Meta,
      body: t.hwExtra6Body,
      gets: [t.hwExtra6Get1, t.hwExtra6Get2, t.hwExtra6Get3, t.hwExtra6Get4],
    },
  ];

  const valueProps = [
    {
      title: t.vp1Title,
      body: t.vp1Body,
      tile: "bg-sand",
      glyph: "§",
      onTile: "text-ink",
    },
    {
      title: t.vp2Title,
      body: t.vp2Body,
      tile: "bg-teal",
      glyph: "◉",
      onTile: "text-ink",
    },
    {
      title: t.vp3Title,
      body: t.vp3Body,
      tile: "bg-primary",
      glyph: "±",
      onTile: "text-white",
    },
    {
      title: t.vp4Title,
      body: t.vp4Body,
      tile: "bg-secondary",
      glyph: "⇄",
      onTile: "text-white",
    },
  ];

  return (
    <div>
      {/* shape: hero -- Hero. Blue panel, gold stripe on the right quarter. */}
      <section className="px-5">
        <div className="relative mx-auto mt-4 max-w-(--container-chrome) overflow-hidden rounded-panel bg-primary px-6 py-13 sm:px-12 sm:py-14">
          <div className="absolute inset-y-0 right-0 hidden w-[24%] bg-sand min-[900px]:block" />
          <div className="relative min-[900px]:max-w-[min(660px,calc(64%-24px))]">
            <span className="eyebrow inline-block rounded-full bg-linear-to-b from-white/95 to-white/70 px-4.5 py-2 text-ink">
              {t.ownerHeroEyebrow}
            </span>
            <h1 className="mt-4.5 font-headline text-[clamp(28px,5vw,42px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
              {t.ownerHeroTitle}
            </h1>
            <p className="mt-4 max-w-[540px] text-base leading-relaxed text-white/85">
              {t.ownerHeroSub}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5.5">
              <Link
                href={href("/contact")}
                className="rounded-full bg-ink px-6.5 py-3.5 text-[14.5px] font-semibold text-white hover:bg-white hover:text-ink"
              >
                {t.talkToUs}
              </Link>
              <a
                href="#qualify"
                className="hit inline-block text-[14.5px] text-white underline underline-offset-4"
              >
                {t.checkQualify}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* shape: route-grid
          -- The routes. Before the menu, deliberately: a list of six services asks the owner
             to work out which ones apply to them, which is the job we are supposed to do. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.routeTitle}
        </h2>
        <p className="mt-2 max-w-[660px] text-[15px] leading-relaxed text-muted">
          {t.routeBody}
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {routes.map((route) => (
            <div
              key={route.when}
              className="rounded-panel bg-surface-2 p-3.5"
            >
              <div className="flex h-full flex-col overflow-hidden rounded-box bg-bg">
                <div className="flex items-center gap-3 px-5 pt-5">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sand text-ink"
                  >
                    <Icon name={route.icon} className="size-[18px]" />
                  </span>
                  <h3 className="font-display text-[16px] font-bold leading-snug tracking-[-0.015em]">
                    {route.when}
                  </h3>
                </div>

                {/* Image slot. The abstract gradient ground is the correct current-state
                    treatment, not a stopgap: zero active photos exist and the guardrails
                    forbid dropping in stock "just for now". Swap for real photography
                    once something clears intake.

                    The hue per route is deliberately NOT matched to its sentiment. Teal is
                    the positive-verdict token here and vermilion the negative one, so the
                    obvious assignment -- teal on "doing well", vermilion on "not coming" --
                    reads as a good/bad rating of the owner's situation. It is not one. */}
                <div
                  aria-hidden="true"
                  className={`mx-5 mt-4 h-[156px] rounded-lg ${route.grad}`}
                />

                <div className="flex flex-col gap-2 px-5 pt-4 pb-5.5">
                  <p className="text-[14px] font-semibold leading-snug text-primary">
                    {route.take}
                  </p>
                  <p className="text-[13.5px] leading-relaxed text-body">
                    {route.why}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* shape: service-card-stack -- The menu. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.menuTitle}
        </h2>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted">
          {t.hwMenuIntro}
        </p>

        <div className="mt-7 flex flex-col gap-4.5">
          {core.map((step) => (
            <article
              key={step.n}
              className="overflow-hidden rounded-panel border border-hairline"
            >
              <div className="grid min-[900px]:grid-cols-[230px_1fr]">
                <div
                  className={`flex flex-col gap-1.5 ${step.fill} px-6.5 py-7`}
                >
                  <h3 className="font-display text-[21px] font-bold leading-tight tracking-[-0.015em] text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-0.5 text-[12.5px] text-ink">
                    {step.meta}
                  </p>
                </div>

                <div className="flex flex-col gap-4 px-7 py-6.5">
                  <p className="text-[15px] leading-relaxed text-body">
                    {step.body}
                  </p>

                  <div>
                    <h4 className="eyebrow">{t.whatYouGet}</h4>
                    <ul className="mt-2.5 grid gap-x-5.5 gap-y-1.5 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
                      {step.gets.map((get) => (
                        <li
                          key={get}
                          className="flex gap-2.5 text-[13.5px] leading-normal"
                        >
                          <span className="font-bold text-primary">·</span>
                          <span>{get}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-box bg-wash-red px-4 py-3.5">
                    <h4 className="eyebrow text-deep-red">{t.notIncluded}</h4>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-body">
                      {step.limit}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* -- The three that sit alongside management. Same card, no "Not included" box:
               these answer S3's limits rather than adding to them. */}
        <h3 className="mt-12 font-display text-[21px] font-bold tracking-[-0.02em]">
          {t.addServicesTitle}
        </h3>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted">
          {t.hwExtrasIntro}
        </p>

        <div className="mt-6 flex flex-col gap-4.5">
          {extras.map((extra) => (
            <article
              key={extra.n}
              className="overflow-hidden rounded-panel border border-hairline"
            >
              <div className="grid min-[900px]:grid-cols-[230px_1fr]">
                <div
                  className={`flex flex-col gap-1.5 ${extra.fill} px-6.5 py-7`}
                >
                  <h3 className="font-display text-[21px] font-bold leading-tight tracking-[-0.015em] text-ink">
                    {extra.title}
                  </h3>
                  <p className="mt-0.5 text-[12.5px] text-ink">
                    {extra.meta}
                  </p>
                </div>

                <div className="flex flex-col gap-4 px-7 py-6.5">
                  <p className="text-[15px] leading-relaxed text-body">
                    {extra.body}
                  </p>

                  <div>
                    <h4 className="eyebrow">{t.whatYouGet}</h4>
                    <ul className="mt-2.5 grid gap-x-5.5 gap-y-1.5 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
                      {extra.gets.map((get) => (
                        <li
                          key={get}
                          className="flex gap-2.5 text-[13.5px] leading-normal"
                        >
                          <span className="font-bold text-primary">·</span>
                          <span>{get}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* shape: report-preview
          -- The report. The study's deliverable, shown rather than described. It sits
             directly after the menu because that is where the study is explained, and the
             single most common owner objection -- "what do I actually get for the fee"
             -- is answered by looking at it. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.reportTitle}
        </h2>
        <p className="mt-2 max-w-[700px] text-[15px] leading-relaxed text-muted">
          {t.reportBody}
        </p>
        <div className="mt-6">
          <SampleReport t={t} />
        </div>
      </section>

      {/* shape: value-glyph-grid -- What the fee buys. Every claim here is checkable; keep it that way. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.vpTitle}
        </h2>
        <div className="mt-7 grid gap-x-6.5 gap-y-8 sm:grid-cols-[repeat(auto-fit,minmax(215px,1fr))]">
          {valueProps.map((prop) => (
            <div key={prop.title} className="flex flex-col gap-3.5">
              <div
                className={`flex h-11.5 w-11.5 items-center justify-center rounded-box ${prop.tile}`}
              >
                {/* Typographic glyphs, as in the handoff. An icon set has not been chosen;
                    aria-hidden because these are decoration, not content. */}
                <span
                  aria-hidden="true"
                  className={`text-xl font-semibold ${prop.onTile}`}
                >
                  {prop.glyph}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold leading-tight tracking-[-0.015em]">
                {prop.title}
              </h3>
              <p className="text-sm leading-relaxed text-body">{prop.body}</p>
            </div>
          ))}
        </div>
        <Link href={href("/contact")} className="pill-primary mt-8">
          {t.talkToUs} →
        </Link>
      </section>

      {/* shape: team-row -- The people. Rendered from a component, so the page declares it here. */}
      <TeamRow t={t} heading={t.meetTheTeam} />

      {/* shape: gates-block -- The two gates. This block is what makes the No-Go credible. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-15">
        <div className="rounded-panel bg-ink px-6 py-9 sm:px-10">
          <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-white">
            {t.gatesTitle}
          </h2>
          <p className="mt-2.5 max-w-[700px] text-[15px] leading-relaxed text-white/80">
            {t.hwGatesBody}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
            <div className="rounded-box bg-white/7 px-6 py-5.5">
              <h3 className="eyebrow text-gold-on-ink">{t.hwGate1Label}</h3>
              <p className="mt-2 text-base font-semibold leading-snug text-white">
                {t.hwGate1Title}
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                {t.hwGate1Body}
              </p>
            </div>
            <div className="rounded-box bg-white/7 px-6 py-5.5">
              <h3 className="eyebrow text-gold-on-ink">{t.hwGate2Label}</h3>
              <p className="mt-2 text-base font-semibold leading-snug text-white">
                {t.hwGate2Title}
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                {t.hwGate2Body}
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-[760px] text-[13.5px] leading-relaxed text-white/60">
            {t.hwGatesFoot}
          </p>
        </div>
      </section>

      {/* shape: qualifier -- The qualifier. */}
      <section
        id="qualify"
        className="mx-auto max-w-(--container-prose) scroll-mt-24 px-5 pt-16"
      >
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.qualifyTitle}
        </h2>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted">
          {t.hwQualifyIntro}
        </p>
        <Qualifier t={t} contactHref={href("/contact")} />
      </section>

      {/* shape: included-split -- Included / not included, side by side. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.mgmtTitle}
        </h2>
        <p className="mt-2 max-w-[700px] text-[15px] leading-relaxed text-muted">
          {t.hwMgmtIntro}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          <div className="rounded-panel border border-hairline px-6.5 py-6">
            <h3 className="eyebrow text-deep-green">{t.weDo}</h3>
            <ul className="mt-3.5 flex flex-col gap-2.5">
              {included.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-normal">
                  <span aria-hidden="true" className="font-bold text-teal">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-panel bg-surface px-6.5 py-6">
            <h3 className="eyebrow text-deep-red">{t.weDont}</h3>
            <ul className="mt-3.5 flex flex-col gap-2.5">
              {excluded.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-normal">
                  <span aria-hidden="true" className="font-bold text-deep-red">
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* shape: highlight-panel -- TM30. Gold panel: the obligation most contracts hand back to the owner. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-14">
        <div className="rounded-panel bg-linear-to-b from-sand from-20% to-white to-62% px-6 py-8 sm:px-8.5">
          <h2 className="eyebrow text-ink/65">{t.hwTm30Eyebrow}</h2>
          <p className="mt-2 font-display text-[23px] font-bold tracking-[-0.02em] text-ink">
            {t.hwTm30Title}
          </p>
          <p className="mt-2 max-w-[700px] text-[15px] leading-relaxed text-ink/85">
            {t.hwTm30Body}
          </p>
        </div>
      </section>

      {/* shape: faq-rows -- FAQ. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-15">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.faqTitle}
        </h2>
        <Faq items={faq} />
        {/* Same questions and answers as the accordion renders, from the same array. */}
        <JsonLd data={faqSchema(faq)} />
      </section>

      {/* shape: proof-block
          -- Proof. The page has just spent 2,000 words claiming we run properties here; this
             is the one we run. Photographs of the actual house, not atmosphere.

             The link out is plain text, never a button: it crosses audiences (owner page ->
             guest page) and the design's CTA rule puts those a full tier below the primary.
             Renders nothing at all if the photo set is empty. */}
      {proofPhotos.length > 0 ? (
        <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
          <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
            {t.proofTitle}
          </h2>
          <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted">
            {t.proofBody}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {proofPhotos.map((photo) => (
              <div
                key={photo.file}
                className="relative aspect-4/3 overflow-hidden rounded-box"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt || LOTUS_HOUSE.title}
                  placeholder="blur"
                  fill
                  sizes="(min-width: 640px) 340px, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <Link
            href={href(`/${LOTUS_HOUSE.slug}`)}
            className="hit mt-4 inline-block text-sm font-semibold text-primary hover:text-secondary"
          >
            {LOTUS_HOUSE.title} →
          </Link>
        </section>
      ) : null}

      {/* shape: closing-cta -- Closing CTA, then the cross-audience link as plain text one tier below it. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-14">
        <div className="flex flex-wrap items-center justify-between gap-7 rounded-panel bg-ink px-6 py-9 sm:px-10">
          <div className="max-w-[560px]">
            <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-white">
              {t.startNumbers}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-white/75">
              {t.hwClosingBody}
            </p>
          </div>
          <Link
            href={href("/contact")}
            className="whitespace-nowrap rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-ink hover:bg-sand"
          >
            {t.bookStudy}
          </Link>
        </div>
      </section>

      {/* shape: cross-audience-link -- The guest route out, one tier below the owner CTA. */}
      <section className="mx-auto flex max-w-(--container-prose) flex-wrap items-center gap-2.5 px-5 pb-17 pt-8.5">
        <span className="text-sm text-muted">{t.lookingToStay}</span>
        <Link
          href={href(`/${LOTUS_HOUSE.slug}`)}
          className="hit text-sm font-semibold text-primary hover:text-secondary"
        >
          {t.viewProperty} →
        </Link>
      </section>
    </div>
  );
}
