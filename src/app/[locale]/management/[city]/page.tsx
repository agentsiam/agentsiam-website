import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TranslationNote } from "@/components/translation-note";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, LOCALES, type Locale } from "@/i18n/config";
import {
  MANAGEMENT_CITIES,
  managementCityBySlug,
} from "@/lib/management-cities";
import { pageMeta } from "@/lib/site";

/**
 * One opportunistic market, owner-facing.
 *
 * This page exists because the homepage title says "in Chiang Mai", which is correct
 * positioning and also tells a search engine the site serves one city. Nothing on the site
 * could rank for a Phuket or Bangkok management query before this.
 *
 * The honest-scope block is the important part, the same way the empty state is the
 * important part of an area page. AgentSiam has no operational depth in these cities yet,
 * so the page says so in its own section rather than implying otherwise by omission. No
 * city photography either: publishing a Phuket exterior would imply we already operate
 * there.
 *
 * No prices. `price-book.md` is still `status: proposed` and unagreed, so nothing here
 * quotes a fee. No licensing outcome is promised either: the non-hotel exemption position
 * is a working summary that counsel has not confirmed, so the copy describes the step
 * AgentSiam runs and stops there.
 *
 * Body copy is English in every locale, with the pending-translation note at the top. That
 * is the site's existing rule: chrome and headings translate, long-form body waits for a
 * human rather than a machine.
 */

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    MANAGEMENT_CITIES.map((city) => ({ locale, city: city.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/management/[city]">): Promise<Metadata> {
  const { locale, city: slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const city = managementCityBySlug(slug);
  if (!city) notFound();

  return pageMeta({
    title: t.metaMgmtTitle.replace("{city}", city.name),
    description: t.metaMgmtDesc.replace("{city}", city.name),
    path: `/management/${city.slug}`,
    locale,
  });
}

const SERVICES = [
  {
    key: "study",
    body: "A site visit, a written analysis and an hour on a call going through it. We model the property against real comparables and end on a straight Go or No-Go. A projection is not a promise, so we show you the conservative case and judge on that one.",
  },
  {
    key: "permission",
    body: "Short-stay letting in Thailand is governed by the Hotel Act and the non-hotel accommodation framework. We assess what the property is allowed to do, prepare the documents and file under power of attorney. We handle the application. We cannot guarantee the government's decision, and the route differs for a condominium, where the building's own written permission is the basis rather than the exemption.",
  },
  {
    key: "management",
    body: "Listings across the main OTA channels, a direct booking site so not every night pays commission, channel and rate management, guest communication, review management, and compliance upkeep including TM30 reporting.",
  },
];

export default async function ManagementCityPage({
  params,
}: PageProps<"/[locale]/management/[city]">) {
  const { locale, city: slug } = await params;
  if (!isLocale(locale)) notFound();
  const city = managementCityBySlug(slug);
  if (!city) notFound();

  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);

  return (
    <div>
      <TranslationNote locale={locale} />

      {/* -- Hero. Same blue panel and gold stripe as the owner page. */}
      <section className="px-5">
        <div className="relative mx-auto mt-4 max-w-(--container-chrome) overflow-hidden rounded-panel bg-primary px-6 py-13 sm:px-12 sm:py-14">
          <div className="absolute inset-y-0 right-0 hidden w-[24%] bg-sand min-[900px]:block" />
          <div className="relative min-[900px]:max-w-[min(660px,calc(64%-24px))]">
            <span className="eyebrow inline-block rounded-full bg-linear-to-b from-white/95 to-white/70 px-4.5 py-2 text-ink">
              {t.mgmtEyebrow}
            </span>
            <h1 className="mt-4.5 font-headline text-[clamp(28px,5vw,42px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
              {t.mgmtHeroTitle.replace("{city}", city.name)}
            </h1>
            <p className="mt-4 max-w-[540px] text-base leading-relaxed text-white/85">
              {t.mgmtHeroSub.replace("{city}", city.name)}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5.5">
              <Link
                href={href("/contact")}
                className="rounded-full bg-ink px-6.5 py-3.5 text-[14.5px] font-semibold text-white hover:bg-white hover:text-ink"
              >
                {t.bookStudy}
              </Link>
              <Link
                href={href("/how-it-works")}
                className="text-[14.5px] text-white underline underline-offset-4"
              >
                {t.mgmtHowLink}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* -- The three services. Same staircase as /how-it-works, stated short. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.mgmtServicesTitle}
        </h2>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted">
          The same three services we run in Chiang Mai, sold as a staircase rather
          than a menu. Each step qualifies you for the next, and you can stop
          after any of them.
        </p>
        <ol className="mt-8 space-y-7">
          {SERVICES.map((service, i) => (
            <li key={service.key} className="flex gap-5">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-sand font-display text-[15px] font-bold text-ink">
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-[17px] font-bold tracking-[-0.01em]">
                  {[t.step1Name, t.step2Name, t.step3Name][i]}
                </h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
                  {service.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-[15px] leading-relaxed text-muted">
          Fees are quoted per property, after the study.{" "}
          <Link
            href={href("/how-it-works")}
            className="underline underline-offset-4"
          >
            {t.mgmtHowLink}
          </Link>
          .
        </p>
      </section>

      {/* -- The honest-scope block. The reason this page can exist ahead of depth. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16 pb-4">
        <div className="rounded-panel bg-wash-gold px-6 py-7 sm:px-8">
          <h2 className="font-display text-[20px] font-bold tracking-[-0.02em]">
            {t.mgmtScopeTitle.replace("{city}", city.name)}
          </h2>
          <p className="mt-2.5 text-[15px] leading-relaxed text-body">
            Our home market is Chiang Mai. That is where the team, the District
            Office relationship and the properties we run are. We take work in{" "}
            {city.name} when it comes, and it is delivered from Chiang Mai.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-body">
            So we do not claim local area knowledge here yet, we have no{" "}
            {city.name} property to show you, and we have not published market
            data for this city. If what you need is a manager with people on the
            ground in {city.name} this week, we are not that yet, and it is
            cheaper for both of us to say so now.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-body">
            What travels is the work itself: the feasibility model, the licensing
            route, the channel and rate management, the compliance upkeep. That
            is most of it, and the study will tell you honestly whether the
            numbers work before you commit to anything.
          </p>
        </div>
      </section>

      {/* -- Close. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-10 pb-20">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
          {t.mgmtCtaTitle.replace("{city}", city.name)}
        </h2>
        <p className="mt-2 max-w-[620px] text-[15px] leading-relaxed text-muted">
          Start with the study. It ends in a Go or a No-Go, and a No-Go is a real
          outcome we are willing to hand you.
        </p>
        <Link
          href={href("/contact")}
          className="mt-6 inline-block rounded-full bg-ink px-6.5 py-3.5 text-[14.5px] font-semibold text-white hover:bg-primary"
        >
          {t.bookStudy}
        </Link>
      </section>
    </div>
  );
}
