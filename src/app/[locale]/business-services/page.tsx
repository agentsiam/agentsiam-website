import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconChip } from "@/components/icon";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { CONTACT_EMAIL, pageMeta } from "@/lib/site";

/**
 * The secondary consulting line. It is linked from the footer only -- never promoted to
 * the primary nav -- because rental management is the day-to-day business. The four
 * pillars are AgentSiam's own, not the handoff's generic set.
 *
 * Three things hold this page together and should survive any edit:
 *
 * - Every string comes from the dictionary. The page shipped hardcoded English on /th and
 *   /zh, which is the one failure mode a per-key fallback cannot warn you about, so there
 *   is no literal in the JSX below and there should not be one after your edit either.
 * - Nothing here is priced. The price book is still marked proposed, and a consulting
 *   rate card would turn a scoped engagement into a line item.
 * - The gaps are visible on purpose. Each pillar carries a "Not published yet" line naming
 *   what will go there, and the engagement sequence stops at the point where the real
 *   process is not agreed. A fabricated capability on a real business page is worse than a
 *   gap a reader can see, so fill one of these only from a source, never from inference.
 *
 * No TranslationNote: unlike /how-it-works, this page has no untranslated long-form body
 * left to warn about. Reinstate it the day an English literal comes back.
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return pageMeta({
    title: t.metaBusinessTitle,
    description: t.metaBusinessDesc,
    path: "/business-services",
    locale,
  });
}

/**
 * The four pillars. Names, claim headlines and scope sentences are AgentSiam's own and are
 * not renamed; what was added is the deliverable list, the gap and the limit, all of them
 * read from the dictionary at render time so the copy lives in one place.
 *
 * The accent bar and the glyph are decoration. Both are aria-hidden, the glyph is literal
 * rather than metaphorical per the icon spec (a document for paperwork, a handover arrow
 * for goods moving, a globe for the platforms, a rising line for growth), and the accent
 * hue deliberately does not rank the pillars against each other.
 */
const PILLARS = [
  { accent: "bg-ink", icon: "document" },
  { accent: "bg-teal", icon: "transfer" },
  { accent: "bg-pink", icon: "globe" },
  { accent: "bg-secondary", icon: "trend" },
];

export default async function BusinessServicesPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);

  const pillars = [
    {
      ...PILLARS[0],
      hook: t.bsPillar1Hook,
      name: t.bsPillar1Name,
      body: t.bsPillar1Body,
      gets: [t.bsPillar1Get1, t.bsPillar1Get2, t.bsPillar1Get3],
      pending: t.bsPillar1Pending,
      limit: t.bsPillar1Limit,
    },
    {
      ...PILLARS[1],
      hook: t.bsPillar2Hook,
      name: t.bsPillar2Name,
      body: t.bsPillar2Body,
      gets: [t.bsPillar2Get1, t.bsPillar2Get2, t.bsPillar2Get3],
      pending: t.bsPillar2Pending,
      limit: t.bsPillar2Limit,
    },
    {
      ...PILLARS[2],
      hook: t.bsPillar3Hook,
      name: t.bsPillar3Name,
      body: t.bsPillar3Body,
      gets: [t.bsPillar3Get1, t.bsPillar3Get2, t.bsPillar3Get3],
      pending: t.bsPillar3Pending,
      limit: t.bsPillar3Limit,
    },
    {
      ...PILLARS[3],
      hook: t.bsPillar4Hook,
      name: t.bsPillar4Name,
      body: t.bsPillar4Body,
      gets: [t.bsPillar4Get1, t.bsPillar4Get2, t.bsPillar4Get3],
      pending: t.bsPillar4Pending,
      limit: t.bsPillar4Limit,
    },
  ];

  // Step three is the gap, not a step. It carries the pending label rather than a claim
  // about a process nobody has written down.
  const steps = [
    { title: t.bsStep1Title, body: t.bsStep1Body, pending: false },
    { title: t.bsStep2Title, body: t.bsStep2Body, pending: false },
    { title: t.bsStep3Title, body: t.bsStep3Body, pending: true },
  ];

  return (
    <div>
      {/* shape: hero -- Eyebrow, headline, subhead, CTA pair. Same container as the header
          above it and as every other page, so the left gutter lines up. */}
      <section className="mx-auto max-w-(--container-chrome) px-5 pt-14">
        <span className="eyebrow">{t.bsEyebrow}</span>
        <h1 className="mt-3.5 max-w-[660px] font-headline text-[clamp(26px,4.5vw,34px)] font-extrabold leading-[1.14] tracking-[-0.03em]">
          {t.bsHeroTitle}
        </h1>
        <p className="mt-4 max-w-[620px] text-[15.5px] leading-relaxed text-body">
          {t.bsHeroSub}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3.5">
          <Link href={href("/contact")} className="pill-primary">
            {t.bsCtaPrimary}
          </Link>
          <a href="#how-it-starts" className="pill-outline">
            {t.bsCtaSecondary}
          </a>
        </div>
        {/* The route out to the rental side. Plain text a full tier below the CTA pair,
            because it crosses to the other line of work. */}
        <p className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>{t.bsRentalNote}</span>
          <Link
            href={href("/how-it-works")}
            className="font-semibold text-primary hover:text-secondary"
          >
            {t.mgmtHowLink}
          </Link>
        </p>
      </section>

      {/* shape: pillar-bento -- The four pillars, two per row so the fourth does not orphan.
          Each card: claim, name, scope, deliverables, the gap, the limit. */}
      <section className="mx-auto max-w-(--container-chrome) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.bsPillarsTitle}
        </h2>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted">
          {t.bsPillarsIntro}
        </p>

        <div className="mt-8 grid max-w-(--container-prose) gap-4.5 min-[820px]:grid-cols-2">
          {pillars.map((pillar) => (
            <article
              key={pillar.name}
              className="flex flex-col overflow-hidden rounded-panel border border-hairline"
            >
              <div aria-hidden="true" className={`${pillar.accent} h-1.5 w-full`} />
              <div className="flex flex-1 flex-col gap-4 px-6 py-6 sm:px-7">
                <div className="flex items-start gap-3.5">
                  <IconChip name={pillar.icon} />
                  <div>
                    <h3 className="font-display text-lg font-bold leading-snug tracking-[-0.015em]">
                      {pillar.hook}
                    </h3>
                    <p className="mt-1 text-[13px] font-medium text-muted">
                      {pillar.name}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-body">{pillar.body}</p>

                <div>
                  <h4 className="eyebrow">{t.whatYouGet}</h4>
                  <ul className="mt-2.5 flex flex-col gap-1.5">
                    {pillar.gets.map((get) => (
                      <li
                        key={get}
                        className="flex gap-2.5 text-[13.5px] leading-normal"
                      >
                        <span aria-hidden="true" className="font-bold text-primary">
                          ·
                        </span>
                        <span>{get}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* The visible gap. Says what will go here rather than inventing it. */}
                <div className="rounded-box bg-surface px-4 py-3.5">
                  <h4 className="eyebrow">{t.bsPendingLabel}</h4>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                    {pillar.pending}
                  </p>
                </div>

                <div className="mt-auto rounded-box bg-wash-red px-4 py-3.5">
                  <h4 className="eyebrow text-deep-red">{t.bsLimitLabel}</h4>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-body">
                    {pillar.limit}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* shape: numbered-sequence -- How an engagement starts. Two real steps and one
          marked gap, which is the honest length of this list today. */}
      <section
        id="how-it-starts"
        className="mx-auto max-w-(--container-chrome) scroll-mt-24 px-5 pt-16"
      >
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.bsStartTitle}
        </h2>
        <ol className="mt-7 flex max-w-[720px] flex-col gap-6">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-5">
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-sand font-display text-[15px] font-bold text-ink"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-[17px] font-bold tracking-[-0.01em]">
                  {step.title}
                </h3>
                {step.pending ? (
                  <p className="eyebrow mt-1.5">{t.bsPendingLabel}</p>
                ) : null}
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-7 max-w-[620px] text-[15px] leading-relaxed text-muted">
          {t.bsPriceNote}
        </p>
      </section>

      {/* shape: closing-cta -- The ask, as a pair rather than a lone pill. */}
      <section className="mx-auto max-w-(--container-chrome) px-5 pt-14 pb-20">
        <div className="max-w-(--container-prose) rounded-panel bg-surface px-6 py-9 sm:px-10">
          <h2 className="font-display text-2xl font-bold tracking-[-0.02em]">
            {t.bsCloseTitle}
          </h2>
          <p className="mt-2.5 max-w-[620px] text-[15px] leading-relaxed text-body">
            {t.bsCloseBody}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3.5">
            <Link href={href("/contact")} className="pill-primary">
              {t.bsCtaPrimary}
            </Link>
            <a href={`mailto:${CONTACT_EMAIL}`} className="pill-outline">
              {t.bsEmailCta}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
