import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
 * All six services are named. The page listed three and said nothing about the other
 * three, which reads as a shorter offering rather than as the same one: the three that
 * run alongside management are here at lower weight, under their own heading, and without
 * an exclusion box, because they answer S3's limits rather than adding to them.
 *
 * Every string is a dictionary key, including the honest-scope block and the fee line.
 * They were hardcoded English and shipped verbatim on /th and /zh, which the per-key
 * fallback cannot catch. There is no literal in the JSX below and there should not be one
 * after your edit either, which is also why the page no longer renders TranslationNote.
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

export default async function ManagementCityPage({
  params,
}: PageProps<"/[locale]/management/[city]">) {
  const { locale, city: slug } = await params;
  if (!isLocale(locale)) notFound();
  const city = managementCityBySlug(slug);
  if (!city) notFound();

  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);

  // The three that travel out of Chiang Mai on their own, at full weight. Service codes
  // are fixed and never renumbered, so these stay 1, 2 and 3.
  const core = [
    { n: 1, title: t.step1Name, body: t.mgmt2Svc1Body },
    { n: 2, title: t.step2Name, body: t.mgmt2Svc2Body },
    { n: 3, title: t.step3Name, body: t.mgmt2Svc3Body },
  ];

  // The three that run alongside management. Shorter here than on /how-it-works on
  // purpose: this page's job is to say they exist and where they sit, not to sell them.
  const alongside = [
    { n: 4, title: t.step4Name, body: t.mgmt2Svc4Body },
    { n: 5, title: t.step5Name, body: t.mgmt2Svc5Body },
    { n: 6, title: t.step6Name, body: t.mgmt2Svc6Body },
  ];

  return (
    <div>
      {/* shape: hero -- Hero. Same blue panel and gold stripe as the owner page. */}
      <section className="px-5">
        <div className="relative mx-auto mt-4 max-w-(--container-chrome) overflow-hidden rounded-panel bg-primary px-6 py-13 sm:px-12 sm:py-14">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 hidden w-[24%] bg-sand min-[900px]:block"
          />
          <div className="relative min-[900px]:max-w-[min(660px,calc(64%-24px))]">
            <span className="eyebrow inline-block rounded-full bg-linear-to-b from-white/95 to-white/70 px-4.5 py-2 text-ink">
              {t.mgmtEyebrow}
            </span>
            <h1 className="mt-4.5 font-headline text-[clamp(28px,5vw,42px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
              {t.mgmtHeroTitle.replace("{city}", city.name)}
            </h1>
            <p className="mt-4 max-w-[540px] text-base leading-relaxed text-white/85">
              {t.mgmt2HeroSub.replace("{city}", city.name)}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5.5">
              <Link
                href={href("/contact")}
                className="rounded-full bg-ink px-6.5 py-3.5 text-[14.5px] font-semibold text-white hover:bg-white hover:text-ink"
              >
                {t.talkToUs}
              </Link>
              <Link
                href={href("/how-it-works")}
                className="hit inline-block text-[14.5px] text-white underline underline-offset-4"
              >
                {t.mgmtHowLink}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* shape: service-card-stack -- The services. The same six as /how-it-works. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.mgmtServicesTitle}
        </h2>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted">
          {t.mgmt2ServicesIntro}
        </p>
        <ol className="mt-8 space-y-7">
          {core.map((service) => (
            <li key={service.n} className="flex gap-5">
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-sand font-display text-[15px] font-bold text-ink"
              >
                {service.n}
              </span>
              <div>
                <h3 className="font-display text-[17px] font-bold tracking-[-0.01em]">
                  {service.title}
                </h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
                  {service.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* shape: service-card-stack -- The three that sit alongside management. Lower weight
          and no exclusion box: they answer what management does not cover rather than
          adding limits to it. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-12">
        <h2 className="font-display text-[21px] font-bold tracking-[-0.02em]">
          {t.addServicesTitle}
        </h2>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted">
          {t.mgmt2AlsoIntro}
        </p>
        <ol className="mt-6 space-y-5">
          {alongside.map((service) => (
            <li key={service.n} className="flex gap-5">
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-surface font-display text-[15px] font-bold text-ink"
              >
                {service.n}
              </span>
              <div>
                <h3 className="font-display text-[16px] font-bold tracking-[-0.01em]">
                  {service.title}
                </h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">
                  {service.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-[15px] leading-relaxed text-muted">
          {t.mgmt2Fees}{" "}
          <Link
            href={href("/how-it-works")}
            className="underline underline-offset-4"
          >
            {t.mgmtHowLink}
          </Link>
          .
        </p>
      </section>

      {/* shape: honest-section -- The honest-scope block. The reason this page can exist
          ahead of depth. Do not soften it. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16 pb-4">
        <div className="rounded-panel bg-wash-gold px-6 py-7 sm:px-8">
          <h2 className="font-display text-[20px] font-bold tracking-[-0.02em]">
            {t.mgmtScopeTitle.replace("{city}", city.name)}
          </h2>
          <p className="mt-2.5 text-[15px] leading-relaxed text-body">
            {t.mgmt2Scope1.replaceAll("{city}", city.name)}
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-body">
            {t.mgmt2Scope2.replaceAll("{city}", city.name)}
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-body">
            {t.mgmt2Scope3}
          </p>
        </div>
      </section>

      {/* shape: closing-cta -- Close. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-10">
        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
          {t.mgmtCtaTitle.replace("{city}", city.name)}
        </h2>
        <p className="mt-2 max-w-[620px] text-[15px] leading-relaxed text-muted">
          {t.mgmt2CtaBody}
        </p>
        <Link
          href={href("/contact")}
          className="mt-6 inline-block rounded-full bg-ink px-6.5 py-3.5 text-[14.5px] font-semibold text-white hover:bg-primary"
        >
          {t.talkToUs}
        </Link>
      </section>

      {/* shape: cross-audience-link -- The guest route out, plain text a full tier below
          the owner CTA. It points at Chiang Mai because that is where the properties are,
          which is the same admission the honest-scope block makes. */}
      <section className="mx-auto flex max-w-(--container-prose) flex-wrap items-center gap-2.5 px-5 pt-8.5 pb-20">
        <span className="text-sm text-muted">{t.lookingToStay}</span>
        <Link
          href={href("/properties")}
          className="hit text-sm font-semibold text-primary hover:text-secondary"
        >
          {t.mgmt2GuestLink}
        </Link>
      </section>
    </div>
  );
}
