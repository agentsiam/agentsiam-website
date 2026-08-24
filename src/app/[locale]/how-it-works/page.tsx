import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/faq";
import { SampleReport } from "@/components/sample-report";
import { TeamRow } from "@/components/team-row";
import { TranslationNote } from "@/components/translation-note";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { pickPhotos } from "@/lib/photos";
import { LOTUS_HOUSE } from "@/lib/property";
import { pageMeta } from "@/lib/site";
import { Qualifier } from "./qualifier";

/**
 * The owner conversion page. This is where the design does its real work, and the block
 * order below is the handoff's, unchanged: hero → staircase → what the fee buys → the two
 * gates → the qualifier → included/not included → TM30 → FAQ → closing CTA → guest link.
 *
 * Two rules from the handoff hold this page together and should survive any edit:
 *
 * - No prices anywhere. Prices live in the internal price book, and a rate card here would
 *   turn a scoped study into a menu item.
 * - Exclusions are printed next to inclusions, every time. The "Not included" box on each
 *   step is not a disclaimer to be shrunk; it is the reason the inclusions are credible.
 *
 * The long-form English copy is the design's own. It is not translated -- the handoff
 * leaves owner-register long-form for a human translator -- so Thai and Chinese carry the
 * pending-translation note at the top.
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

const STEPS = [
  {
    n: "1",
    fill: "bg-teal",
    body: "One site visit, a written analysis and an hour on a call going through it with you. We model your property against real local comparables and give you a straight recommendation at the end.",
    gets: [
      "Market and demand analysis — location, competition, achievable nightly rate, seasonality",
      "Property assessment and positioning, including which feature to lead on",
      "Operating cost modelling",
      "Business case across up to three scenarios: rate, occupancy, revenue, NOI, breakeven, ROI",
      "A direct comparison against simply renting it long-term",
      "A written Go or No-Go recommendation",
    ],
    limit:
      "A projection is not a promise. Occupancy moves with the season, the economy and the platforms, so we show you the conservative case and judge on that one.",
  },
  {
    n: "2",
    fill: "bg-secondary",
    body: "Short-stay letting in Thailand is governed by the Hotel Act and the non-hotel accommodation framework. We assess what your property is actually allowed to do, prepare the documents, and file under power of attorney.",
    gets: [
      "Legal feasibility assessment against the Hotel Act framework",
      "Building and safety equipment requirements review",
      "Full document preparation",
      "Submission and follow-up under power of attorney",
    ],
    limit:
      "Government fees, and any fire safety remediation the inspection turns up, are not included. And we handle the application — we cannot guarantee the government's decision.",
  },
  {
    n: "3",
    fill: "bg-sand",
    body: "Listings, pricing, guests and compliance, run by the team here in Chiang Mai. We arrange the cleaning and the maintenance and supervise the quality; you pay those suppliers directly.",
    gets: [
      "Listing creation and management across the main OTA channels",
      "A direct booking website, so not every night pays platform commission",
      "Channel and rate management in Beds24",
      "Guest communication across the whole stay",
      "Review, Superhost and Guest Favourite management",
      "Compliance upkeep on the permission, and TM30 guest reporting",
    ],
    limit:
      "The cost of cleaning, laundry, maintenance and vendors sits with you — we arrange and supervise, you pay the supplier. Insurance, photography, furnishing and renovation are also outside the fee.",
  },
];

const INCLUDED = [
  "Listings across the main OTA channels, plus testing secondary ones",
  "A direct booking website",
  "Channel and rate management in Beds24",
  "Guest communication for the full stay, with automation behind it",
  "Review, Superhost and Guest Favourite management",
  "Arranging cleaning and turnover — scheduling and quality control",
  "Arranging maintenance and vendor visits",
  "Compliance upkeep once the permission is granted",
  "TM30 foreign guest reporting to Immigration",
];

const EXCLUDED = [
  "The cost of cleaning, laundry, maintenance and vendors — you pay the supplier",
  "Insurance. We will help you find a policy but we do not arrange or advise on one",
  "Professional photography. We write the brief and recommend the photographer",
  "Capital works, renovation and furnishing",
  "Long-term tenancy, and property sale or valuation",
  "Legal representation — we coordinate with counsel rather than advising",
  "Your tax filing",
  "Your own personal-use admin and your own guests",
];

const FAQ = [
  {
    q: "What do you charge?",
    a: "A percentage of booking revenue for management, plus fixed fees for the feasibility and permission steps. The percentage depends on how much of the work you want us to carry. Exact figures come in your feasibility report, priced against your property rather than a rate card.",
  },
  {
    q: "Am I locked into a contract?",
    a: "No minimum term on management. You give notice, we hand over the listings and calendars, and we do not hold your channel accounts hostage.",
  },
  {
    q: "What happens if a guest damages something?",
    a: "Every booking carries a deposit held through the channel. We inspect after checkout, document anything found, and pursue the claim ourselves. Above the deposit ceiling it becomes an insurance question — which is why we ask about your policy in step 2.",
  },
  {
    q: "Can I still use the property myself?",
    a: "Yes. You block the dates and we work around them. Frequent owner use lowers projected revenue, and the feasibility report will show you by how much.",
  },
  {
    q: "Do you handle tax?",
    a: "We provide the revenue reporting your accountant needs. We are not tax advisers and will not file on your behalf.",
  },
  {
    q: "My condo says short lets are not allowed. Is that final?",
    a: "Usually, yes. Most Thai condo buildings prohibit stays under 30 days and the juristic person has to permit it in writing. Where a building refuses, we say so rather than list it and hope.",
  },
];

export default async function HowItWorksPage({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);

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

  const steps = [
    { ...STEPS[0], title: t.step1Name, meta: t.step1Meta },
    { ...STEPS[1], title: t.step2Name, meta: t.step2Meta },
    { ...STEPS[2], title: t.step3Name, meta: t.step3Meta },
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
      <TranslationNote locale={locale} />

      {/* -- Hero. Blue panel, gold stripe on the right quarter. */}
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
                {t.bookStudy}
              </Link>
              <a
                href="#qualify"
                className="text-[14.5px] text-white underline underline-offset-4"
              >
                {t.checkQualify}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* -- The staircase. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.staircaseTitle}
        </h2>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted">
          Each step qualifies you for the next. You can stop after any of them,
          and some owners should. Most managers open at step three and skip step
          two entirely.
        </p>

        <div className="mt-7 flex flex-col gap-4.5">
          {steps.map((step) => (
            <article
              key={step.n}
              className="overflow-hidden rounded-panel border border-hairline"
            >
              <div className="grid min-[900px]:grid-cols-[230px_1fr]">
                <div
                  className={`flex flex-col gap-1.5 ${step.fill} px-6.5 py-7`}
                >
                  <span className="eyebrow text-ink/65">
                    {t.step} {step.n}
                  </span>
                  <h3 className="font-display text-[21px] font-bold leading-tight tracking-[-0.015em] text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-0.5 text-[12.5px] text-ink/70">
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
      </section>

      {/* -- The report. Step one's deliverable, shown rather than described. It sits
             directly after the staircase because that is where step one is explained, and
             the single most common owner objection -- "what do I actually get for the fee"
             -- is answered by looking at it. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.reportTitle}
        </h2>
        <p className="mt-2 max-w-[700px] text-[15px] leading-relaxed text-muted">
          {t.reportBody}
        </p>
        <div className="mt-6">
          <SampleReport />
        </div>
      </section>

      {/* -- What the fee buys. Every claim here is checkable; keep it that way. */}
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
          {t.bookStudy} →
        </Link>
      </section>

      <TeamRow heading={t.meetTheTeam} />

      {/* -- The two gates. This block is what makes the No-Go credible. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-15">
        <div className="rounded-panel bg-ink px-6 py-9 sm:px-10">
          <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-white">
            {t.gatesTitle}
          </h2>
          <p className="mt-2.5 max-w-[700px] text-[15px] leading-relaxed text-white/80">
            Otherwise it is a sales document with a fee attached. Two things
            have to be true before we will manage a property, and they are
            different questions:
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
            <div className="rounded-box bg-white/7 px-6 py-5.5">
              <h3 className="eyebrow text-gold-on-ink">Gate one · your side</h3>
              <p className="mt-2 text-base font-semibold leading-snug text-white">
                At cautious occupancy, short-let has to beat renting it
                long-term.
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                Not at the optimistic case — at the conservative one. We pull a
                real local long-term comparable at the time of the study rather
                than assuming one, because that number is what decides the
                verdict.
              </p>
            </div>
            <div className="rounded-box bg-white/7 px-6 py-5.5">
              <h3 className="eyebrow text-gold-on-ink">Gate two · our side</h3>
              <p className="mt-2 text-base font-semibold leading-snug text-white">
                The property has to be worth managing properly.
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                Below a certain size the fee does not fund the attention the
                property needs, and doing it badly helps nobody. This gate
                applies to management only — anyone can buy the study.
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-[760px] text-[13.5px] leading-relaxed text-white/60">
            If your case works but we are not the right size of manager for it,
            we will say that too, and point you somewhere better.
          </p>
        </div>
      </section>

      {/* -- The qualifier. */}
      <section
        id="qualify"
        className="mx-auto max-w-(--container-prose) scroll-mt-24 px-5 pt-16"
      >
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.qualifyTitle}
        </h2>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted">
          Four questions. This is the same shape as our intake, so you get the
          honest answer now rather than after a site visit.
        </p>
        <Qualifier t={t} contactHref={href("/contact")} />
      </section>

      {/* -- Included / not included, side by side. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.mgmtTitle}
        </h2>
        <p className="mt-2 max-w-[700px] text-[15px] leading-relaxed text-muted">
          We arrange the work and supervise it. You pay the suppliers directly.
          That is a different product from fully hands-off, and it is better
          that you know which one you are buying now.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          <div className="rounded-panel border border-hairline px-6.5 py-6">
            <h3 className="eyebrow text-deep-green">{t.weDo}</h3>
            <ul className="mt-3.5 flex flex-col gap-2.5">
              {INCLUDED.map((item) => (
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
              {EXCLUDED.map((item) => (
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

      {/* -- TM30. Gold panel: the obligation most contracts hand back to the owner. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-14">
        <div className="rounded-panel bg-linear-to-b from-sand from-20% to-white to-62% px-6 py-8 sm:px-8.5">
          <h2 className="eyebrow text-ink/65">
            The bit most managers leave with you
          </h2>
          <p className="mt-2 font-display text-[23px] font-bold tracking-[-0.02em] text-ink">
            TM30 reporting is included.
          </p>
          <p className="mt-2 max-w-[700px] text-[15px] leading-relaxed text-ink/85">
            Every foreign guest has to be reported to Immigration. It is a legal
            obligation on the property, it is tedious, and most management
            contracts quietly hand it back to the owner. Ours does not. Keeping
            the permission compliant once it is granted is part of the same job.
          </p>
        </div>
      </section>

      {/* -- FAQ. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-15">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.faqTitle}
        </h2>
        <Faq items={FAQ} />
      </section>

      {/* -- Proof. The page has just spent 2,000 words claiming we run properties here; this
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
            className="mt-4 inline-block text-sm font-semibold text-primary hover:text-secondary"
          >
            {LOTUS_HOUSE.title} →
          </Link>
        </section>
      ) : null}

      {/* -- Closing CTA, then the cross-audience link as plain text one tier below it. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-14">
        <div className="flex flex-wrap items-center justify-between gap-7 rounded-panel bg-ink px-6 py-9 sm:px-10">
          <div className="max-w-[560px]">
            <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-white">
              {t.startNumbers}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-white/75">
              One site visit, a written analysis, an hour on a call walking you
              through it, and a straight Go or No-Go at the end. No management
              contract attached.
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

      <section className="mx-auto flex max-w-(--container-prose) flex-wrap items-center gap-2.5 px-5 pb-17 pt-8.5">
        <span className="text-sm text-muted">{t.lookingToStay}</span>
        <Link
          href={href(`/${LOTUS_HOUSE.slug}`)}
          className="text-sm font-semibold text-primary hover:text-secondary"
        >
          {t.viewProperty} →
        </Link>
      </section>
    </div>
  );
}
