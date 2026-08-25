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

const CORE = [
  {
    n: "1",
    fill: "bg-teal",
    body: "One site visit, a written analysis and an hour on a call going through it with you. We model your property against real local comparables and give you a straight recommendation at the end. Worth taking when there is no occupancy record to read — an unlisted property, or one whose numbers are not telling you what you need to know.",
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
    body: "Short-stay letting in Thailand is governed by the Hotel Act and the non-hotel accommodation framework, and the rules are specific enough that most owners have never been told which ones apply to them. We work out what your property is actually allowed to do, prepare the documents, and file under power of attorney so you do not have to deal with the office yourself.",
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
    body: "Listings, pricing, guests and compliance, run by the team here in Chiang Mai. This is the service most owners come for, and the only one that runs continuously.",
    gets: [
      "Listing creation and management across the main OTA channels",
      "A direct booking website, so not every night pays platform commission",
      "Channel and rate management in Beds24",
      "Guest communication across the whole stay",
      "Review, Superhost and Guest Favourite management",
      "Compliance upkeep, and TM30 guest reporting",
    ],
    limit:
      "Insurance is outside the fee. We will help you find a policy but we do not arrange or advise on one. Housekeeping, photography and interior work are separate services rather than exclusions — they are below.",
  },
];

/**
 * The three that sit alongside management rather than in front of it. Deliberately no
 * "Not included" box: these are the answer to S3's limits, not more limits, and framing
 * them as exclusions is what the 25/08/2026 review asked us to stop doing.
 */
const EXTRAS = [
  {
    n: "4",
    fill: "bg-wash-green",
    body: "The turnover, the laundry and the upkeep, handled end to end so you are not managing suppliers from another country. Take it and the day-to-day stops being your problem; leave it and we still arrange and supervise the work, you just pay the suppliers yourself.",
    gets: [
      "Turnover cleaning to a written checklist, scheduled around arrivals",
      "Laundry on every turnover and mid-stay",
      "Consumables kept stocked",
      "Maintenance and vendor visits arranged, supervised and documented",
    ],
  },
  {
    n: "5",
    fill: "bg-wash-gold",
    body: "Photography is the single biggest lever on how a listing performs, and most owner-supplied photographs cost bookings rather than win them. We brief the shoot, direct it, and edit the set to the standard the channels reward.",
    gets: [
      "Interior and exterior shoot, styled and lit for short-stay listings",
      "Editing and colour work to a consistent house standard",
      "A set sized and cropped for every channel, plus the direct site",
      "Reshoots when the property changes",
    ],
  },
  {
    n: "6",
    fill: "bg-wash-red",
    body: "What a property earns is decided partly by what it is like to stay in. Where the numbers are held back by the house rather than the listing, we work out what to change, what it would cost, and whether the return justifies it — with the costing done properly rather than guessed.",
    gets: [
      "Advice on look, feel and the details guests actually book for",
      "What to add, what to replace, and what to leave alone",
      "Investment cost estimates against real supplier pricing",
      "The return on the spend, modelled the same way the study models the property",
    ],
  },
];

/**
 * Route icons. Four stroke glyphs, drawn here rather than pulled from an icon library so
 * nothing new lands in the dependency tree for four shapes. They inherit currentColor and
 * sit in the tinted chip on each route card.
 *
 * The design system carries no icon set. Paul authorised introducing one on 25/08/2026;
 * design-guardrails.md still says otherwise and is stale until that is recorded, which is a
 * Law 1 write and needs its own approval.
 *
 * They sit in a gold rounded-square chip on plain ground -- no card, no border. The routes
 * are the lightest block on the page and boxing them competes with the menu below, which is
 * the block that should carry the weight.
 */
const ICONS: Record<string, React.ReactNode> = {
  // earning already -- a rising line
  trend: (
    <>
      <polyline points="3 16.5 9.5 10 13.5 14 21 6.5" />
      <polyline points="15.5 6.5 21 6.5 21 12" />
    </>
  ),
  // listed but underperforming -- a question to diagnose
  search: (
    <>
      <circle cx="11" cy="11" r="6.25" />
      <line x1="15.6" y1="15.6" x2="20.5" y2="20.5" />
    </>
  ),
  // nothing yet -- the property itself
  house: (
    <>
      <path d="M3.75 10.75 12 4.25l8.25 6.5" />
      <path d="M5.75 12.4V19.25h12.5V12.4" />
    </>
  ),
  // held elsewhere -- a handover
  transfer: (
    <>
      <path d="M3.75 8.75h14.5" />
      <polyline points="15 5.5 18.25 8.75 15 12" />
      <path d="M20.25 15.25H5.75" />
      <polyline points="9 12 5.75 15.25 9 18.5" />
    </>
  ),
};

/**
 * The routes. This is the "tailored" half of a menu -- six services in a list is not a
 * tailored offering, six services with a recommended starting point per situation is.
 * Ordered by how often we see them, not by service number.
 */
const ROUTES = [
  {
    icon: "trend",
    grad: "grad-sand",
    when: "Already listed, and it is doing well",
    take: "Management. Permission too, if you do not hold one.",
    why: "Your own occupancy and rate history is better evidence than anything we could model, so there is nothing for a study to tell you. We read your numbers instead, and it costs you nothing.",
  },
  {
    icon: "search",
    grad: "grad-blue",
    when: "Listed, but the bookings are not coming",
    take: "Start with the study, then management.",
    why: "The question here is diagnostic rather than whether to begin: is it the listing, the pricing, the photographs — or the property. The study answers that against real local comparables instead of guessing, and it is the cheapest thing on this page.",
  },
  {
    icon: "house",
    grad: "grad-teal",
    when: "Not listed yet",
    take: "Study, then permission, then management.",
    why: "There is no history to read, so the numbers have to be modelled before anyone should commit money to it. This is the route the study was built for, and the one where a No-Go saves you the most.",
  },
  {
    icon: "transfer",
    grad: "grad-vermilion",
    when: "Already with another manager",
    take: "Bring us your numbers. Management when you are ready.",
    why: "We will look at what the property is actually doing before suggesting anything. If the study would not tell you more than your own statements already do, we will say so rather than sell it to you.",
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
  "The cost of cleaning, laundry, maintenance and vendors, unless you take housekeeping — you pay the supplier either way",
  "Insurance. We will help you find a policy but we do not arrange or advise on one",
  "The building work itself. We advise on it and cost it; we do not carry it out",
  "Long-term tenancy, and property sale or valuation",
  "Legal representation — we coordinate with counsel rather than advising",
  "Your tax filing",
  "Your own personal-use admin and your own guests",
];

const FAQ = [
  {
    q: "What do you charge?",
    a: "A percentage of booking revenue for management, plus fixed fees for the services you choose. The percentage depends on how much of the work you want us to carry — it is lower when we handle the housekeeping too. Exact figures are quoted against your property rather than read off a rate card.",
  },
  {
    q: "Do I have to take the study first?",
    a: "No. It is one service on the menu, not a gate. If your property is already listed and earning, your own numbers tell us more than a model would, and we will start from those instead. Where we think the study genuinely would change your decision, we will say so.",
  },
  {
    q: "What if I do not have a licence, and do not want to apply for one?",
    a: "Tell us and we will talk it through properly. The permission service exists because most owners have never been told which rules apply to their property, and a lot of them turn out to be straightforward. What we will not do is make the decision for you or pretend the question does not exist.",
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

  const core = [
    { ...CORE[0], title: t.step1Name, meta: t.step1Meta },
    { ...CORE[1], title: t.step2Name, meta: t.step2Meta },
    { ...CORE[2], title: t.step3Name, meta: t.step3Meta },
  ];

  const extras = [
    { ...EXTRAS[0], title: t.step4Name, meta: t.step4Meta },
    { ...EXTRAS[1], title: t.step5Name, meta: t.step5Meta },
    { ...EXTRAS[2], title: t.step6Name, meta: t.step6Meta },
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

      {/* -- The routes. Before the menu, deliberately: a list of six services asks the owner
             to work out which ones apply to them, which is the job we are supposed to do. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.routeTitle}
        </h2>
        <p className="mt-2 max-w-[660px] text-[15px] leading-relaxed text-muted">
          {t.routeBody}
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {ROUTES.map((route) => (
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
                    <svg
                      viewBox="0 0 24 24"
                      className="size-[18px]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {ICONS[route.icon]}
                    </svg>
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

      {/* -- The menu. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.menuTitle}
        </h2>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted">
          Six services, taken in whatever combination your property needs. Most
          owners take two or three. Nobody takes all six.
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
                  <span className="eyebrow text-ink/65">
                    {t.service} {step.n}
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

        {/* -- The three that sit alongside management. Same card, no "Not included" box:
               these answer S3's limits rather than adding to them. */}
        <h3 className="mt-12 font-display text-[21px] font-bold tracking-[-0.02em]">
          {t.addServicesTitle}
        </h3>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted">
          Take any of these with management, or on their own. Each is quoted for
          the property rather than sold at a standard rate.
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
                  <span className="eyebrow text-ink/65">
                    {t.service} {extra.n}
                  </span>
                  <h3 className="font-display text-[21px] font-bold leading-tight tracking-[-0.015em] text-ink">
                    {extra.title}
                  </h3>
                  <p className="mt-0.5 text-[12.5px] text-ink/70">
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

      {/* -- The report. The study's deliverable, shown rather than described. It sits
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
            different questions. A property that is already earning well answers
            both of them without a study:
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
                Our fee is a share of what the property earns, so below a certain
                level of revenue it does not fund the attention the property
                needs — and doing it badly helps nobody. A property with a real
                booking record answers this on its own numbers. This gate applies
                to management only.
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
