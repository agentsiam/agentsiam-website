import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/faq";
import vpChannels from "@/illustrations/value-props/vp-channels.png";
import vpLegal from "@/illustrations/value-props/vp-legal.png";
import vpNumbers from "@/illustrations/value-props/vp-numbers.png";
import vpTeam from "@/illustrations/value-props/vp-team.png";
import { SampleReport } from "@/components/sample-report";
import { TeamRow } from "@/components/team-row";
import { getDictionary, type Dictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { pickPhoto, pickPhotos } from "@/lib/photos";
import { FEATURED_PROPERTY } from "@/lib/property";
import { pageMeta } from "@/lib/site";
import { Qualifier } from "../how-it-works/qualifier";
import { COMPOSED } from "./composed.generated";

/**
 * TEST PAGE. /how-it-works composed from the narrative record by selection only, to compare
 * against the live page. It does not replace /how-it-works and nothing links to it: it is
 * noindexed, absent from ROUTES and so from the sitemap, and absent from the navigation.
 *
 * Every narrative string comes from composed.generated.ts, which is GENERATED from the record
 * in agentsiam-consulting (as-work/2026-11-06-narrative-page-test/src/compose.py), and each
 * one prints the record slot it came from. Headings and button labels are the live page's own
 * dictionary keys, because they are chrome rather than argument, and they are marked so.
 *
 * English on every locale, deliberately: the record has no Thai. This page breaks the site's
 * dictionary rule on purpose and must never ship to main as it stands.
 *
 * Band order and shape markers are the live page's, so the two can be read side by side.
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return pageMeta({
    title: "How it works, composed from the record (test)",
    description: "Test page: /how-it-works composed from the narrative record.",
    path: "/how-it-works-composed",
    locale,
    placeholder: true,
  });
}

const ART = { numbers: vpNumbers, legal: vpLegal, channels: vpChannels, team: vpTeam } as const;

/** The record slot a line came from, printed under it. */
function Src({ s, dark = false }: { s: string; dark?: boolean }) {
  return (
    <span
      className={`mt-1 block font-mono text-[11px] tracking-normal ${dark ? "text-white/45" : "text-muted"}`}
    >
      record: {s}
    </span>
  );
}

/** Live-page chrome kept because the record carries no heading or label. */
function Chrome({ k, dark = false }: { k: string; dark?: boolean }) {
  return (
    <span
      className={`mt-1 block font-mono text-[11px] tracking-normal ${dark ? "text-white/45" : "text-muted"}`}
    >
      live chrome: {k}
    </span>
  );
}

function Gap({ what }: { what: string }) {
  return (
    <p className="mt-3 rounded-box border border-dashed border-hairline px-4 py-3 text-[13.5px] text-muted">
      No record source for {what}. The live page writes it; the record does not.
    </p>
  );
}

function label(t: Dictionary, key: string): string {
  return (t as unknown as Record<string, string>)[key] ?? key;
}

export default async function HowItWorksComposedPage({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);
  const c = COMPOSED;

  const heroPhoto = pickPhoto("team", "team-group-portrait");
  const proofPhotos = pickPhotos(FEATURED_PROPERTY.slug, [
    "IMG_5359",
    "IMG_5724",
    "mainstree_exterior_lotushouse",
  ]);
  const core = c.services.filter((s) => s.core);
  const extras = c.services.filter((s) => !s.core);

  return (
    <div lang="en">
      <div className="mx-auto max-w-(--container-prose) px-5 pt-4">
        <p className="rounded-box bg-wash-gold px-4 py-3 text-[13.5px] text-ink">
          Test page. This is /how-it-works composed only from the narrative record, for
          comparison with the live page. It is not linked anywhere and not indexed.
        </p>
      </div>

      {/* shape: hero -- Symptom, then the core claim as the misread, then the ask. */}
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
          ) : null}
          <div className="relative min-[900px]:max-w-[min(660px,calc(60%-24px))]">
            {c.hero.symptom ? (
              <p className="text-[15px] italic leading-relaxed text-white/80">
                “{c.hero.symptom.text}”
                <Src s={c.hero.symptom.source} dark />
              </p>
            ) : null}
            <h1 className="mt-4.5 font-headline text-[clamp(28px,5vw,42px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
              {c.hero.title.text}
            </h1>
            <p className="mt-4 max-w-[540px] text-base leading-relaxed text-white/85">
              {c.hero.sub.text}
            </p>
            <Src s={c.hero.title.source} dark />
            <div className="mt-7 flex flex-wrap items-center gap-5.5">
              <Link href={href(c.closing.ask.route)} className="pill-primary">
                {label(t, c.closing.ask.label_key)}
              </Link>
            </div>
            <Src s={`${c.closing.source}, label ${c.closing.ask.label_key}`} dark />
          </div>
        </div>
      </section>

      {/* shape: qualifier -- Management's fit, then the live interactive qualifier. */}
      <section id="qualify" className="mx-auto max-w-(--container-prose) scroll-mt-24 px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">{t.qualifyTitle}</h2>
        <Chrome k="qualifyTitle" />
        {c.fits.filter((f) => f.id === "S3").map((f) => (
          <p key={f.id} className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-body">
            {f.text}
            <Src s={f.source} />
          </p>
        ))}
        <Qualifier t={t} contactHref={href("/contact")} />
        <Chrome k="the Qualifier component, unchanged" />
      </section>

      {/* shape: route-grid -- Who each service is for. The record has fits, not routes. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <div className="overflow-hidden rounded-[28px] bg-ink px-5 py-14 sm:px-10 sm:py-20">
          <h2 className="mx-auto max-w-[762px] text-center font-display text-[clamp(26px,4.4vw,40px)] leading-[1.2] font-bold uppercase text-gold-on-ink">
            {t.routeTitle}
          </h2>
          <Chrome k="routeTitle" dark />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.fits.map((f) => (
              <div key={f.id} className="rounded-box bg-white/7 px-5 py-5">
                <h3 className="font-display text-[17px] font-semibold text-white">{f.name}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/75">{f.text}</p>
                <Src s={f.source} dark />
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[13.5px] text-white/60">
            The record carries who each service is for. It carries no routes: the four
            situations and their recommended order live on the live page only.
          </p>
        </div>
      </section>

      {/* shape: value-glyph-grid -- The misreads, one per tile. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="mx-auto max-w-[816px] text-center font-display text-[clamp(26px,4.4vw,40px)] leading-[1.2] font-bold uppercase">
          {t.vpTitle}
        </h2>
        <Chrome k="vpTitle" />
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {c.reframes.map((r) => (
            <div key={r.id}>
              <div className="grad-sand relative flex aspect-square items-center justify-center overflow-hidden rounded-[24px]">
                <Image
                  src={ART[r.art]}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(min-width: 1024px) 245px, (min-width: 640px) 320px, 45vw"
                  className="object-contain"
                />
              </div>
              <p className="mt-5 text-[15px] leading-[1.5] tracking-[-0.014em] text-body">{r.text}</p>
              <Src s={r.source} />
            </div>
          ))}
        </div>
      </section>

      {/* shape: proof-block -- What is checkable. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">{t.proofTitle}</h2>
        <Chrome k="proofTitle" />
        {c.proof.map((p) =>
          p ? (
            <p key={p.source} className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-body">
              {p.text}
              <Src s={p.source} />
            </p>
          ) : null,
        )}
        {proofPhotos.length > 0 ? (
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
        ) : null}
      </section>

      {/* shape: service-card-stack -- Scope and limit, for every service, from the record. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">{t.menuTitle}</h2>
        <Chrome k="menuTitle" />
        {[core, extras].map((group, gi) => (
          <div key={gi} className={`flex flex-col gap-4.5 ${gi ? "mt-12" : "mt-7"}`}>
            {gi ? (
              <h3 className="font-display text-[21px] font-bold tracking-[-0.02em]">{t.addServicesTitle}</h3>
            ) : null}
            {group.map((s) => (
              <article key={s.id} className="overflow-hidden rounded-panel border border-hairline">
                <div className="grid min-[900px]:grid-cols-[230px_1fr]">
                  <div className="flex flex-col gap-1.5 bg-surface px-6.5 py-7">
                    <h3 className="font-display text-[21px] font-bold leading-tight tracking-[-0.015em] text-ink">
                      {s.name}
                    </h3>
                    <p className="mt-0.5 text-[12.5px] text-ink">{s.oneLiner.text}</p>
                    <Src s={s.oneLiner.source} />
                  </div>
                  <div className="flex flex-col gap-4 px-7 py-6.5">
                    {s.scope ? (
                      <p className="text-[15px] leading-relaxed text-body">
                        {s.scope.text}
                        <Src s={s.scope.source} />
                      </p>
                    ) : (
                      <Gap what={`${s.id} scope`} />
                    )}
                    {s.limit ? (
                      <div className="rounded-box bg-wash-red px-4 py-3.5">
                        <h4 className="eyebrow text-deep-red">{t.notIncluded}</h4>
                        <p className="mt-1.5 text-[13.5px] leading-relaxed text-body">{s.limit.text}</p>
                        <Src s={s.limit.source} />
                      </div>
                    ) : (
                      <Gap what={`${s.id} limit`} />
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ))}
      </section>

      {/* shape: report-preview -- The study's evidence, and the live sample report. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <div className="overflow-hidden rounded-[28px] bg-ink px-5 py-14 sm:px-10 sm:py-20">
          <h2 className="mx-auto max-w-[816px] text-center font-display text-[clamp(26px,4.4vw,40px)] leading-[1.2] font-bold uppercase text-gold-on-ink">
            {t.reportTitle}
          </h2>
          <Chrome k="reportTitle" dark />
          {c.report ? (
            <p className="mx-auto mt-4 max-w-[675px] text-center text-[16px] leading-[1.5] text-white/75">
              {c.report.text}
              <Src s={c.report.source} dark />
            </p>
          ) : null}
          <div className="mt-10">
            <SampleReport t={t} />
          </div>
        </div>
      </section>

      {/* shape: team-row -- Unchanged component; the record's team story sits in the value tiles and the closing. */}
      <TeamRow t={t} heading={t.meetTheTeam} />

      {/* shape: gates-block -- The record carries the gates only as management's fit and the study's limit. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-15">
        <div className="rounded-panel bg-ink px-6 py-9 sm:px-10">
          <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-white">{t.gatesTitle}</h2>
          <Chrome k="gatesTitle" dark />
          {c.gates.map((g) =>
            g ? (
              <p key={g.source} className="mt-3 max-w-[700px] text-[15px] leading-relaxed text-white/80">
                {g.text}
                <Src s={g.source} dark />
              </p>
            ) : null,
          )}
          <p className="mt-4 text-[13.5px] text-white/60">
            No record source for the two gates themselves. They live in the service model and on
            the live page, not in the narrative record.
          </p>
        </div>
      </section>

      {/* shape: included-split -- Management's scope against the agreed exclusions. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-16">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">{t.mgmtTitle}</h2>
        <Chrome k="mgmtTitle" />
        <div className="mt-6 grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          <div className="rounded-panel border border-hairline px-6.5 py-6">
            <h3 className="eyebrow text-deep-green">{t.weDo}</h3>
            {c.included ? (
              <p className="mt-3.5 text-sm leading-normal">
                {c.included.text}
                <Src s={c.included.source} />
              </p>
            ) : null}
          </div>
          <div className="rounded-panel bg-surface px-6.5 py-6">
            <h3 className="eyebrow text-deep-red">{t.weDont}</h3>
            <ul className="mt-3.5 flex flex-col gap-2.5">
              {c.excluded.items.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-normal">
                  <span aria-hidden="true" className="font-bold text-deep-red">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Src s={c.excluded.source} />
            {c.excluded.note ? (
              <p className="mt-3 text-[13.5px] leading-relaxed text-body">
                {c.excluded.note.text}
                <Src s={c.excluded.note.source} />
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* shape: highlight-panel -- TM30, as far as the record carries it. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-14">
        <div className="grad-sand rounded-panel px-6 py-8 sm:px-8.5">
          <h2 className="eyebrow text-ink/65">{t.hwTm30Eyebrow}</h2>
          <Chrome k="hwTm30Eyebrow" />
          {c.tm30 ? (
            <p className="mt-2 max-w-[700px] text-[15px] leading-relaxed text-ink/85">
              {c.tm30.text}
              <Src s={`${c.tm30.source} (TM30 is one clause of it)`} />
            </p>
          ) : null}
          <p className="mt-2 text-[13.5px] text-ink/70">
            The record names TM30 inside management&apos;s scope and carries no panel of its own.
          </p>
        </div>
      </section>

      {/* shape: faq-rows -- Each answer is a limit or the price basis. No structured data: test page. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-15">
        <h2 className="font-display text-[26px] font-bold tracking-[-0.02em]">{t.faqTitle}</h2>
        <Chrome k="faqTitle; the questions are written here to frame each slot" />
        <Faq items={c.faq.map((f) => ({ q: f.q, a: `${f.text} [record: ${f.source}]` }))} />
      </section>

      {/* shape: closing-cta -- The study's ask, with the team's relevance line. */}
      <section className="mx-auto max-w-(--container-prose) px-5 pt-14">
        <div className="flex flex-wrap items-center justify-between gap-7 rounded-panel bg-ink px-6 py-9 sm:px-10">
          <div className="max-w-[560px]">
            <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-white">{t.startNumbers}</h2>
            <Chrome k="startNumbers" dark />
            <p className="mt-2 text-[15px] leading-relaxed text-white/75">
              {c.relevance.text}
              <Src s={c.relevance.source} dark />
            </p>
          </div>
          <div className="flex flex-col items-start gap-1">
            <Link href={href(c.closing.ask.route)} className="pill-light whitespace-nowrap">
              {label(t, c.closing.ask.label_key)}
            </Link>
            <Src s={c.closing.source} dark />
          </div>
        </div>
      </section>

      {/* shape: cross-audience-link -- The guest route out, from G1's ask. */}
      <section className="mx-auto flex max-w-(--container-prose) flex-wrap items-center gap-2.5 px-5 pb-17 pt-8.5">
        <span className="text-sm text-muted">{t.lookingToStay}</span>
        <Link
          href={href(c.guest.ask.route)}
          className="hit text-sm font-semibold text-primary hover:text-secondary"
        >
          {label(t, c.guest.ask.label_key)} →
        </Link>
        <Src s={c.guest.source} />
      </section>
    </div>
  );
}
