import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/faq";
import { IconChip } from "@/components/icon";
import vpChannels from "@/illustrations/value-props/vp-channels.png";
import vpLegal from "@/illustrations/value-props/vp-legal.png";
import vpTeam from "@/illustrations/value-props/vp-team.png";
import { JsonLd } from "@/components/json-ld";
import { TeamRow } from "@/components/team-row";
import { type Dictionary, getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { pickPhoto, pickPhotos } from "@/lib/photos";
import { FEATURED_PROPERTY } from "@/lib/property";
import { pageMeta } from "@/lib/site";
import { faqSchema } from "@/lib/structured-data";
import { RouteTabs } from "./route-tabs";

/**
 * The owner page, Concept 2: a management sales page for every owner, built for Nils's
 * review on 05/11/2026 (English only; the th and zh dictionaries carry English on this
 * branch and it does not ship until they are written).
 *
 * Block order: hero with four proof chips -> "Where are you starting from?" (three routes)
 * -> what most managers leave out -> scope (management, housekeeping, Airbnb only) -> the
 * house we run and the team -> is it a fit -> when you need them -> FAQ -> closing.
 *
 * No price block. The only figure on the page is the "from 18%" in the FAQ answer, Nils's
 * wording. The set-up fee waiver and the founding offer belong in the client quote and are
 * never on the site.
 *
 * Every button goes to /contact, the one owner form, so there is one form to change and one
 * conversion to count.
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return pageMeta({
    title: t.metaHowTitle,
    description: t.c2HeroSub,
    path: "/how-it-works",
    locale,
  });
}

function faqList(t: Dictionary): { q: string; a: string }[] {
  return [
    { q: t.c2FaqChargeQ, a: t.c2FaqChargeA },
    { q: t.c2FaqCleanQ, a: t.c2FaqCleanA },
    { q: t.c2FaqBaseQ, a: t.c2FaqBaseA },
    { q: t.c2FaqSwitchQ, a: t.c2FaqSwitchA },
    { q: t.c2FaqNotListedQ, a: t.c2FaqNotListedA },
    { q: t.hwFaq4Q, a: t.hwFaq4A },
    { q: t.hwFaq8Q, a: t.hwFaq8A },
    { q: t.hwFaq5Q, a: t.hwFaq5A },
    { q: t.hwFaq6Q, a: t.hwFaq6A },
    { q: t.hwFaq7Q, a: t.hwFaq7A },
  ];
}

export default async function HowItWorksPage({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);
  const contact = href("/contact");
  const faq = faqList(t);

  const heroPhoto = pickPhoto("team", "team-group-portrait");
  const proofPhotos = pickPhotos(FEATURED_PROPERTY.slug, [
    "IMG_5359",
    "IMG_5724",
    "mainstree_exterior_lotushouse",
  ]);

  const heroProof = [t.c2Proof1, t.c2Proof2, t.c2Proof3, t.c2Proof4];

  // Same owner-narrative frames as before (decision 70), matched to the situation each shows.
  const routes = [
    { icon: "search", when: t.c2Route1When, take: t.c2Route1Take, why: t.c2Route1Why, photo: pickPhoto("routes", "route-3") },
    { icon: "house", when: t.c2Route2When, take: t.c2Route2Take, why: t.c2Route2Why, photo: pickPhoto("routes", "route-2") },
    { icon: "transfer", when: t.c2Route3When, take: t.c2Route3Take, why: t.c2Route3Why, photo: pickPhoto("routes", "route-4") },
  ] as const;

  const valueProps = [
    { title: t.c2Vp1Title, body: t.c2Vp1Body, icon: "globe", art: vpChannels },
    { title: t.c2Vp2Title, body: t.c2Vp2Body, icon: "document", art: null },
    { title: t.c2Vp3Title, body: t.c2Vp3Body, icon: "pin", art: null },
    { title: t.c2Vp4Title, body: t.c2Vp4Body, icon: "talk", art: vpTeam },
    { title: t.c2Vp5Title, body: t.c2Vp5Body, icon: "shield", art: vpLegal },
  ] as const;

  const included = [t.c2Inc1, t.c2Inc2, t.c2Inc3, t.c2Inc4, t.c2Inc5, t.c2Inc6, t.c2Inc7, t.c2Inc8];
  const excluded = [t.c2Exc1, t.c2Exc2, t.c2Exc3, t.c2Exc4, t.c2Exc6, t.c2Exc7, t.c2Exc5, t.c2Exc8];
  const housekeeping = [t.c2Hk1, t.c2Hk2, t.c2Hk3, t.c2Hk4];
  const needs = [
    { title: t.c2Need1Title, body: t.c2Need1Body },
    { title: t.c2Need2Title, body: t.c2Need2Body },
    { title: t.c2Need3Title, body: t.c2Need3Body },
    { title: t.c2Need4Title, body: t.c2Need4Body },
  ];

  return (
    <div>
      {/* shape: hero -- one offer for every owner, four proof chips. */}
      <section className="px-5">
        <div className="relative mx-auto mt-4 max-w-(--container-chrome) overflow-hidden rounded-panel bg-primary px-6 py-13 sm:px-12 sm:py-14">
          {heroPhoto ? (
            <div className="absolute inset-y-0 right-0 hidden w-[36%] min-[900px]:block">
              <Image
                src={heroPhoto.src}
                alt={heroPhoto.alt || t.meetTheTeam}
                lang="en"
                placeholder="blur"
                fill
                priority
                sizes="(min-width: 900px) 420px, 0px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="absolute inset-y-0 right-0 hidden w-[24%] bg-sand min-[900px]:block" />
          )}
          <div className="relative min-[900px]:max-w-[min(660px,calc(60%-24px))]">
            <span className="eyebrow inline-block rounded-full bg-linear-to-b from-white/95 to-white/70 px-4.5 py-2 text-ink">
              {t.ownerHeroEyebrow}
            </span>
            <h1 className="mt-4.5 font-headline text-[clamp(28px,5vw,42px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
              {t.c2HeroTitle}
            </h1>
            <p className="mt-4 max-w-[540px] text-base leading-relaxed text-white/85">
              {t.c2HeroSub}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5.5">
              <Link href={contact} className="pill-primary">
                {t.c2CtaManage}
              </Link>
              <a
                href="#start"
                className="hit inline-block text-[14.5px] text-white underline underline-offset-4"
              >
                {t.c2CtaStart}
              </a>
            </div>
            <ul className="mt-7 flex flex-wrap gap-2">
              {heroProof.map((item) => (
                <li
                  key={item}
                  className="rounded-full bg-white/12 px-3.5 py-1.5 text-[13px] font-semibold text-white"
                >
                  ✓ {item}
                </li>
              ))}
            </ul>
          </div>
          {heroPhoto ? (
            <div className="relative mt-8 aspect-16/10 overflow-hidden rounded-box min-[900px]:hidden">
              <Image
                src={heroPhoto.src}
                alt={heroPhoto.alt || t.meetTheTeam}
                lang="en"
                placeholder="blur"
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* shape: route-grid -- where are you starting from: three routes, one form. */}
      <section id="start" className="mx-auto max-w-(--container-prose) scroll-mt-24 px-5 pt-16">
        <div className="overflow-hidden rounded-[28px] bg-ink px-5 py-14 sm:px-10 sm:py-20">
          <div className="mx-auto max-w-[1040px]">
            <h2 className="mx-auto max-w-[762px] text-center font-display text-[clamp(26px,4.4vw,40px)] leading-[1.2] font-bold uppercase text-gold-on-ink">
              {t.c2RouteTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-[675px] text-center text-[16px] leading-[1.5] tracking-[-0.013em] text-white/75">
              {t.c2RouteBody}
            </p>
            <RouteTabs routes={[...routes]} panelLabel={t.c2RouteTitle} />
            <div className="mt-10 text-center">
              <Link href={contact} className="pill-light">
                {t.c2CtaManage}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* shape: value-glyph-grid -- what most managers leave out, five cards. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="mx-auto max-w-[816px] text-center font-display text-[clamp(26px,4.4vw,40px)] leading-[1.2] font-bold uppercase">
          {t.c2VpTitle}
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-5">
          {valueProps.map((prop) => (
            <div key={prop.title}>
              <div className="grad-sand relative flex aspect-square items-center justify-center overflow-hidden rounded-[24px]">
                {prop.art ? (
                  <Image
                    src={prop.art}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="(min-width: 1024px) 200px, (min-width: 640px) 320px, 45vw"
                    className="object-contain"
                  />
                ) : (
                  <span className="scale-150">
                    <IconChip name={prop.icon} tone="surface" />
                  </span>
                )}
              </div>
              <h3 className="mt-5 font-display text-[19px] leading-[1.2] font-semibold">
                {prop.title}
              </h3>
              <p className="mt-2.5 text-[14px] leading-[1.5] tracking-[-0.014em] text-muted">
                {prop.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* shape: included-split -- management, housekeeping, Airbnb only. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.c2ScopeTitle}
        </h2>
        <p className="mt-2 max-w-[700px] text-[15px] leading-relaxed text-muted">
          {t.c2ScopeIntro}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
          <div className="rounded-panel border border-hairline px-6.5 py-6">
            <h3 className="eyebrow text-deep-green">{t.c2IncTitle}</h3>
            <ul className="mt-3.5 flex flex-col gap-2.5">
              {included.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-normal">
                  <span aria-hidden="true" className="font-bold text-teal">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-panel border border-hairline px-6.5 py-6">
            <h3 className="eyebrow text-primary">{t.c2HkTitle}</h3>
            <ul className="mt-3.5 flex flex-col gap-2.5">
              {housekeeping.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-normal">
                  <span aria-hidden="true" className="font-bold text-teal">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <h3 className="eyebrow mt-6 text-primary">{t.c2BaseTitle}</h3>
            <p className="mt-2.5 text-sm leading-relaxed">{t.c2BaseBody}</p>
          </div>
          <div className="rounded-panel bg-surface px-6.5 py-6">
            <h3 className="eyebrow text-deep-red">{t.c2ExcTitle}</h3>
            <ul className="mt-3.5 flex flex-col gap-2.5">
              {excluded.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-normal">
                  <span aria-hidden="true" className="font-bold text-deep-red">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-5 max-w-[760px] text-[15px] font-semibold leading-relaxed">
          {t.c2SupplierLine}
        </p>
      </section>

      {/* shape: proof-block -- the house we run, then the people. */}
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
              <div key={photo.file} className="relative aspect-4/3 overflow-hidden rounded-box">
                <Image
                  src={photo.src}
                  alt={photo.alt || FEATURED_PROPERTY.title}
                  lang="en"
                  placeholder="blur"
                  fill
                  sizes="(min-width: 640px) 340px, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <Link
            href={href(`/${FEATURED_PROPERTY.slug}`)}
            className="hit mt-4 inline-block text-sm font-semibold text-primary hover:text-secondary"
          >
            {FEATURED_PROPERTY.title} →
          </Link>
        </section>
      ) : null}

      <TeamRow t={t} heading={t.meetTheTeam} />

      {/* shape: highlight-panel -- is it a fit. No figure. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-15">
        <div className="grad-sand rounded-panel px-6 py-8 sm:px-8.5">
          <p className="font-display text-[23px] font-bold tracking-[-0.02em] text-ink">
            {t.c2FitTitle}
          </p>
          <p className="mt-2 max-w-[700px] text-[15px] leading-relaxed text-ink/85">
            {t.c2FitBody}
          </p>
        </div>
      </section>

      {/* shape: service-list -- the services owners take when they need them. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.c2NeedTitle}
        </h2>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-muted">
          {t.c2NeedBody}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {needs.map((need) => (
            <Link
              key={need.title}
              href={contact}
              className="rounded-panel border border-hairline px-6.5 py-5.5 hover:border-ink"
            >
              <h3 className="font-display text-[18px] font-bold tracking-[-0.015em]">
                {need.title} →
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{need.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* shape: faq-rows -- FAQ. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-15">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
          {t.faqTitle}
        </h2>
        <Faq items={faq} />
        <JsonLd data={faqSchema(faq)} />
      </section>

      {/* shape: closing-cta -- one button to the owner form. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-14">
        <div className="flex flex-wrap items-center justify-between gap-7 rounded-panel bg-ink px-6 py-9 sm:px-10">
          <div className="max-w-[560px]">
            <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-white">
              {t.c2CloseTitle}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-white/75">{t.c2CloseBody}</p>
          </div>
          <Link href={contact} className="pill-light whitespace-nowrap">
            {t.c2CtaManage}
          </Link>
        </div>
      </section>

      {/* shape: cross-audience-link -- the guest route out, one tier below. */}
      <section className="mx-auto flex max-w-(--container-prose) flex-wrap items-center gap-2.5 px-5 pb-17 pt-8.5">
        <span className="text-sm text-muted">{t.lookingToStay}</span>
        <Link
          href={href(`/${FEATURED_PROPERTY.slug}`)}
          className="hit text-sm font-semibold text-primary hover:text-secondary"
        >
          {t.viewProperty} →
        </Link>
      </section>
    </div>
  );
}
