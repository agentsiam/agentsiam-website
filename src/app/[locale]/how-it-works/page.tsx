import type { Metadata } from "next";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/faq";
import heroWideSrc from "@/illustrations/brand-character/hero-wide.jpg";
import heroMobileSrc from "@/illustrations/brand-character/hero-mobile.jpg";
import vpChannels from "@/illustrations/value-props/vp-channels.png";
import vpLegal from "@/illustrations/value-props/vp-legal.png";
import vpTeam from "@/illustrations/value-props/vp-team.png";
import { JsonLd } from "@/components/json-ld";
import { ChannelMarquee } from "@/components/channel-marquee";
import { TeamRow } from "@/components/team-row";
import { type Dictionary, getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { pickPhoto, pickPhotos } from "@/lib/photos";
import { FEATURED_PROPERTY } from "@/lib/property";
import { pageMeta } from "@/lib/site";
import { faqSchema } from "@/lib/structured-data";
import { ContactForm } from "../contact/contact-form";
import { RouteTabs } from "./route-tabs";

/**
 * The owner page: a management sales page, and the owner form at the foot of it.
 *
 * Restructured 06/11/2026, Paul's direction, from Concept 2 (hiw-concept2-1105) and the
 * narrative system's order: who it is for, the misread, what we do, the proof, the limits,
 * how it is charged, the ask. Management (S3) is the pitch; the other services sit below it.
 *
 * Block order: hero (management, then the core claim) -> two numbers (who sees it, who
 * books, what keeps it listed) -> what management runs -> the house we run and the team ->
 * where are you starting from -> the fit -> when you need them -> FAQ -> the owner form ->
 * guest link.
 *
 * The conversion is the owner form, the first ICP filter (decision 73 in the consulting
 * repo). It sits on this page as the last block, and every button here scrolls to it rather
 * than leaving for /contact. /contact renders the same component, so there is still one form
 * and one conversion to count.
 *
 * No price anywhere (decision 55). Airbnb-only management, the set-up fee waiver and the
 * founding-client offer are proposal-only (decision 79 and Nils's ruling) and never appear.
 */

const FORM = "#owner-form";

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
    { q: t.c2FaqSwitchQ, a: t.c2FaqSwitchA },
    { q: t.c2FaqNotListedQ, a: t.c2FaqNotListedA },
    { q: t.hwFaq4Q, a: t.hwFaq4A },
    { q: t.hwFaq6Q, a: t.hwFaq6A },
    { q: t.hwFaq8Q, a: t.hwFaq8A },
    { q: t.hwFaq5Q, a: t.hwFaq5A },
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
  const faq = faqList(t);

  // The hero photograph, in the homepage's treatment: one image behind the whole panel
  // with a scrim over it, rather than a photo boxed into a column beside the copy.
  const heroImage = { alt: "", sizes: "(min-width: 1440px) 1400px, 100vw", priority: true };
  const heroWide = getImageProps({ ...heroImage, src: heroWideSrc }).props;
  const proofPhotos = pickPhotos(FEATURED_PROPERTY.slug, [
    "IMG_5359",
    "IMG_5724",
    "mainstree_exterior_lotushouse",
  ]);

  const heroProof = [t.c2Proof1, t.c2Proof2, t.c2Proof3, t.c2Proof4];

  // The core claim, spelled out: the two numbers, and the permission under them.
  const why = [
    { title: t.c2Why1Title, body: t.c2Why1Body, art: vpChannels },
    { title: t.c2Why2Title, body: t.c2Why2Body, art: vpTeam },
    { title: t.c2Why3Title, body: t.c2Why3Body, art: vpLegal },
  ];

  // Same owner-narrative frames as before (decision 70), matched to the situation each shows.
  const routes = [
    { icon: "search", when: t.c2Route1When, take: t.c2Route1Take, why: t.c2Route1Why, photo: pickPhoto("routes", "route-3") },
    { icon: "house", when: t.c2Route2When, take: t.c2Route2Take, why: t.c2Route2Why, photo: pickPhoto("routes", "route-2") },
    { icon: "transfer", when: t.c2Route3When, take: t.c2Route3Take, why: t.c2Route3Why, photo: pickPhoto("routes", "route-4") },
  ];

  const included = [t.c2Inc1, t.c2Inc2, t.c2Inc3, t.c2Inc4, t.c2Inc5, t.c2Inc6, t.c2Inc7, t.c2Inc8];
  const excluded = [t.c2Exc1, t.c2Exc2, t.c2Exc3, t.c2Exc4, t.c2Exc6, t.c2Exc7, t.c2Exc5, t.c2Exc8];
  const housekeeping = [t.c2Hk1, t.c2Hk2, t.c2Hk3, t.c2Hk4];
  const needs = [
    { title: t.c2Need1Title, body: t.c2Need1Body },
    { title: t.c2Need2Title, body: t.c2Need2Body },
    { title: t.c2Need3Title, body: t.c2Need3Body },
    { title: t.c2Need4Title, body: t.c2Need4Body },
  ];
  const steps = [t.nextStep1, t.nextStep2, t.nextStep3];

  return (
    <div>
      {/* shape: hero -- management first, then the core claim, one button to the form. */}
      <section className="px-5">
        <div className="relative mx-auto mt-4 flex max-w-(--container-chrome) flex-col justify-center overflow-hidden rounded-panel bg-ink px-6 py-13 sm:px-12 sm:py-14 min-[900px]:min-h-[560px]">
          {/* The photograph fills the panel at 900px and up only, with a horizontal scrim
              holding the copy column. Below that it does not: this hero's copy is a six-line
              standfirst plus four chips, it fills a phone panel completely, and a scrim heavy
              enough to keep that text at AA takes any photograph behind it to near-black.
              Tested: a figure vanished, and so did a high-contrast curtain detail. The phone
              gets its own unscrimmed block under the copy instead, which is where the
              photograph can actually be seen. */}
          <picture className="absolute inset-0 hidden min-[900px]:block">
            <img
              {...heroWide}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover object-[58%_26%]"
            />
          </picture>
          <div
            aria-hidden="true"
            className="absolute inset-0 hidden min-[900px]:block bg-[linear-gradient(90deg,rgba(10,8,20,0.90)_0%,rgba(10,8,20,0.84)_42%,rgba(10,8,20,0.30)_70%,rgba(10,8,20,0.12)_100%)]"
          />
          <div className="relative min-[900px]:max-w-[min(660px,calc(60%-24px))]">
            <span className="eyebrow inline-block rounded-full bg-linear-to-b from-white/95 to-white/70 px-4.5 py-2 text-ink">
              {t.ownerHeroEyebrow}
            </span>
            <h1 className="mt-4.5 font-headline text-[clamp(28px,5vw,42px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
              {t.c2HeroTitle}
            </h1>
            <p className="mt-4 max-w-[560px] text-base leading-relaxed text-white/85">
              {t.c2HeroSub}
            </p>
            {/* pill-light, not pill-primary: the panel ground changed from blue to ink when
                the hero took a photograph, and an ink fill on ink is an invisible button. */}
            <div className="mt-7 flex flex-wrap items-center gap-5.5">
              <a href={FORM} className="pill-light">
                {t.c2CtaManage}
              </a>
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
          {/* The phone's photograph: the hand opening the curtain, with nothing over it. */}
          <div className="relative mt-8 aspect-4/5 overflow-hidden rounded-box min-[900px]:hidden">
            <Image
              src={heroMobileSrc}
              alt=""
              aria-hidden="true"
              placeholder="blur"
              fill
              sizes="(min-width: 900px) 0px, calc(100vw - 88px)"
              className="object-cover object-[46%_50%]"
            />
          </div>
        </div>
      </section>

      {/* shape: logo-strip -- the channels, running under the hero. */}
      <ChannelMarquee label={t.c2ChannelsLabel} />

      {/* shape: value-glyph-grid -- the core claim spelled out: who sees it, who books, what keeps it listed. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="mx-auto max-w-[816px] text-center font-display text-[clamp(26px,4.4vw,40px)] leading-[1.2] font-bold uppercase">
          {t.c2WhyTitle}
        </h2>
        <p className="mx-auto mt-4 max-w-[675px] text-center text-[16px] leading-[1.5] text-muted">
          {t.c2WhyBody}
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {why.map((card) => (
            <div key={card.title}>
              <div className="grad-sand relative flex aspect-square items-center justify-center overflow-hidden rounded-[24px]">
                <Image
                  src={card.art}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(min-width: 640px) 320px, 90vw"
                  className="object-contain"
                />
              </div>
              <h3 className="mt-5 font-display text-[20px] leading-[1.2] font-semibold">
                {card.title}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-[1.55] tracking-[-0.014em] text-muted">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* shape: included-split -- what management runs, what housekeeping adds, what neither includes. */}
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

      {/* shape: proof-block -- the house we run, then the people who run it. */}
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
            className="hit mt-4 inline-block text-sm font-semibold text-primary hover:text-ink"
          >
            {FEATURED_PROPERTY.title} →
          </Link>
        </section>
      ) : null}

      {/* shape: team-row -- The people. Rendered from a component, so the page declares it here. */}
      <TeamRow t={t} heading={t.meetTheTeam} />

      {/* shape: route-grid -- where are you starting from: three routes, each ending at the form. */}
      <section id="start" className="mx-auto max-w-(--container-prose) scroll-anchor px-5 pt-16">
        <div className="overflow-hidden rounded-[28px] bg-ink px-5 py-14 sm:px-10 sm:py-20">
          <div className="mx-auto max-w-[1040px]">
            <h2 className="mx-auto max-w-[762px] text-center font-display text-[clamp(26px,4.4vw,40px)] leading-[1.2] font-bold uppercase text-gold-on-ink">
              {t.c2RouteTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-[675px] text-center text-[16px] leading-[1.5] tracking-[-0.013em] text-white/75">
              {t.c2RouteBody}
            </p>
            <RouteTabs routes={routes} panelLabel={t.c2RouteTitle} />
            <div className="mt-10 text-center">
              <a href={FORM} className="pill-light">
                {t.c2CtaManage}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* shape: highlight-panel -- the fit, and the honest No. No figure. */}
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
            <a
              key={need.title}
              href={FORM}
              className="rounded-panel border border-hairline px-6.5 py-5.5 hover:border-ink"
            >
              <h3 className="font-display text-[18px] font-bold tracking-[-0.015em]">
                {need.title} →
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{need.body}</p>
            </a>
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

      {/* shape: contact-form -- the conversion: the owner form, on the page, with what happens next. */}
      <section id="owner-form" className="mx-auto max-w-(--container-prose) scroll-anchor px-5 pt-16">
        <div className="rounded-panel border border-hairline px-6 py-9 sm:px-10">
          <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">
            {t.c2CloseTitle}
          </h2>
          <p className="mt-2 max-w-[600px] text-[15px] leading-relaxed text-muted">
            {t.c2CloseBody}
          </p>
          <div className="mt-7 grid items-start gap-10 min-[900px]:grid-cols-[1fr_300px]">
            <ContactForm
              t={t}
              locale={locale}
              homeHref={href("/")}
              privacyHref={href("/privacy-policy")}
            />
            <aside className="rounded-panel bg-surface p-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                {t.whatHappensNext}
              </h3>
              <ol className="mt-3.5 flex flex-col gap-3.5">
                {steps.map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="font-mono font-semibold text-primary">{i + 1}</span>
                    <span className="text-sm leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </div>
      </section>

      {/* shape: cross-audience-link -- the guest route out, one tier below. */}
      <section className="mx-auto flex max-w-(--container-prose) flex-wrap items-center gap-2.5 px-5 pb-17 pt-8.5">
        <span className="text-sm text-muted">{t.lookingToStay}</span>
        <Link
          href={href(`/${FEATURED_PROPERTY.slug}`)}
          className="hit text-sm font-semibold text-primary hover:text-ink"
        >
          {t.seeHouse.replace("{name}", FEATURED_PROPERTY.title)} →
        </Link>
      </section>
    </div>
  );
}
