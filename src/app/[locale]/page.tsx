import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { heroPhoto, pickPhoto } from "@/lib/photos";
import { HeroSearch } from "@/components/hero-search";
import { LOTUS_HOUSE, propertyArea } from "@/lib/property";
import {
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  languageAlternates,
} from "@/lib/site";

// The homepage keeps an absolute title rather than the layout's "%s | AgentSiam" template,
// so the brand name is not repeated twice in the tab and in search results.
export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const title = `${SITE_NAME} | Short-term rental management in Chiang Mai`;

  return {
    title: { absolute: title },
    description: SITE_DESCRIPTION,
    alternates: {
      canonical: absoluteUrl(locale, "/"),
      languages: languageAlternates("/"),
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: absoluteUrl(locale, "/"),
      title,
      description: SITE_DESCRIPTION,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: SITE_DESCRIPTION,
      images: [OG_IMAGE],
    },
  };
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);
  const property = LOTUS_HOUSE;
  const area = propertyArea(property);
  // The gallery's first photo doubles as the card image, so the two cannot disagree.
  const cardPhoto = heroPhoto(property.slug);
  // The fork panels take a photo each or neither. The guest side wants somewhere you would
  // want to be rather than the hero again; the owner side wants a face, which is what
  // src/photos/team/ is for. Drop a portrait in there and both panels light up together.
  const guestForkPhoto =
    pickPhoto(property.slug, "20250413_100343") ?? cardPhoto;
  // Deliberately not a team portrait: those are ~480px square avatars, and this slot is a
  // wide 16:9 band that would crop heads and upscale them. It wants a landscape photo --
  // the team at a property, a street, a site visit. Drop one in src/photos/team-wide/.
  const ownerForkPhoto = heroPhoto("team-wide");
  const forkPhotos =
    guestForkPhoto && ownerForkPhoto
      ? { guest: guestForkPhoto, owner: ownerForkPhoto }
      : null;

  // The three staircase cards. Fills rotate through the brand palette, as in the design.
  const staircase = [
    { n: "1", title: t.stair1Title, body: t.stair1Body, fill: "bg-teal" },
    { n: "2", title: t.stair2Title, body: t.stair2Body, fill: "bg-secondary" },
    { n: "3", title: t.stair3Title, body: t.stair3Body, fill: "bg-sand" },
  ];

  const why = [
    { title: t.whyA, body: t.whyABody },
    { title: t.whyB, body: t.whyBBody },
    { title: t.whyC, body: t.whyCBody },
  ];

  return (
    <div>
      {/* -- Hero. Ink panel inset from the viewport, blue and gold stripes on the right
             quarter. The stripes drop below 900px, where they would squeeze the copy. */}
      <section className="px-5">
        <div className="relative mx-auto mt-4 max-w-(--container-chrome) overflow-hidden rounded-panel bg-ink px-6 py-12 sm:px-12 sm:py-13">
          <div className="absolute inset-y-0 right-0 hidden w-[30%] bg-primary min-[900px]:block" />
          <div className="absolute inset-y-0 right-[30%] hidden w-[8%] bg-sand min-[900px]:block" />

          <div className="relative min-[900px]:max-w-[min(640px,calc(58%-24px))]">
            <span className="eyebrow inline-block rounded-full bg-linear-to-b from-white/95 to-white/70 px-4.5 py-2 text-ink">
              {t.heroEyebrow}
            </span>
            <h1 className="mt-4.5 font-headline text-[clamp(28px,5.4vw,42px)] font-extrabold leading-[1.09] tracking-[-0.03em] text-white">
              {t.heroTitleA}
              <br />
              {t.heroTitleB}
            </h1>
            <p className="mt-4 max-w-[470px] text-[15.5px] leading-relaxed text-white/80">
              {t.heroSub}
            </p>

            {/* The search bar is the hero's only action. No CTA pair beside it: a button
                here would be a second primary, and the owner path is stated properly in
                the fork band immediately below rather than crammed in up here. */}
          </div>

          <div className="relative mt-8">
            <HeroSearch t={t} locale={locale} />
          </div>
        </div>
      </section>

      {/* -- Fork band. Two panels, equal weight, where a visitor self-identifies.
             Both are secondary tier on purpose: the hero's search already holds primary,
             and two solid pills here would recreate the competing-primaries problem the
             design forbids. The fork sorts people; it does not ask them to convert. */}
      <section className="mx-auto mt-9 grid max-w-(--container-chrome) gap-5 px-5 sm:grid-cols-2">
        <div className="rounded-panel bg-surface px-7 py-8">
          <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
            {t.forkGuestTitle}
          </h2>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-body">{t.forkGuestBody}</p>
          <Link
            href={href("/properties")}
            className="mt-4 inline-block text-[14.5px] font-semibold underline underline-offset-4 hover:text-primary"
          >
            {t.forkGuestLink}
          </Link>
        </div>
        <div className="rounded-panel bg-wash-gold px-7 py-8">
          <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
            {t.forkOwnerTitle}
          </h2>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-body">{t.forkOwnerBody}</p>
          <Link
            href={href("/how-it-works")}
            className="mt-4 inline-block text-[14.5px] font-semibold underline underline-offset-4 hover:text-primary"
          >
            {t.forkOwnerLink}
          </Link>
        </div>
      </section>

      {/* -- The audience fork. Guests left, owners right, both low-key panels rather than
             competing buttons.

             The two panels carry a photo only when *both* have one, so the pair always
             reads as a matched set. Guests see the house; owners see the people who run it.
             Until a portrait exists in src/photos/team/, both stay flat colour, which is
             the handoff's own treatment -- one panel with a photo and one without leaves a
             hole where the second image should be. */}
      <section className="mx-auto max-w-(--container-chrome) px-5 pt-14">
        <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(270px,1fr))]">
          {[
            {
              key: "guests",
              photo: forkPhotos?.guest,
              fill: "bg-teal",
              eyebrow: <span className="eyebrow text-ink">{t.forGuests}</span>,
              title: "text-ink",
              body: "text-ink/85",
              link: "text-ink",
              heading: t.guestPanelTitle,
              copy: t.guestPanelBody,
              href: href(`/${property.slug}`),
              label: t.viewProperty,
            },
            {
              key: "owners",
              photo: forkPhotos?.owner,
              fill: "bg-primary",
              eyebrow: (
                <span className="eyebrow text-white/80">{t.forOwners}</span>
              ),
              title: "text-white",
              body: "text-white/85",
              link: "text-white",
              heading: t.ownerPanelTitle,
              copy: t.ownerPanelBody,
              href: href("/how-it-works"),
              label: t.ownerPanelLink,
            },
          ].map((panel) => (
            <div
              key={panel.key}
              className={`flex flex-col overflow-hidden rounded-panel ${panel.fill}`}
            >
              {panel.photo ? (
                // Photo above the copy rather than behind it: text over an image needs a
                // scrim to stay legible, and a scrim over a brand panel is two treatments
                // fighting. The colour keeps doing its job underneath.
                <div className="relative aspect-16/9">
                  <Image
                    src={panel.photo.src}
                    alt={panel.photo.alt}
                    placeholder="blur"
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col gap-2.5 px-7 pb-6.5 pt-6">
                {panel.eyebrow}
                <h2
                  className={`font-display text-[22px] font-bold tracking-[-0.015em] ${panel.title}`}
                >
                  {panel.heading}
                </h2>
                <p className={`text-sm leading-relaxed ${panel.body}`}>
                  {panel.copy}
                </p>
                <Link
                  href={panel.href}
                  className={`mt-1 text-sm font-semibold underline underline-offset-4 ${panel.link}`}
                >
                  {panel.label}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -- The property. One tile, using the same component shape a results grid would. */}
      <section className="mx-auto max-w-(--container-chrome) px-5 pt-14">
        <h2 className="font-display text-2xl font-bold tracking-[-0.015em]">
          {t.featuredTitle}
        </h2>
        <p className="mt-1.5 text-sm text-muted">{t.featuredSub}</p>

        {/* Capped rather than full-bleed: the design's featured row is four tiles across
            1440px, and one tile stretched to that width reads as a page that failed to
            load the other three. */}
        <Link
          href={href(`/${property.slug}`)}
          className="group mt-5.5 grid max-w-[900px] gap-6 rounded-panel border border-hairline p-4 sm:grid-cols-[minmax(0,320px)_1fr] sm:items-center"
        >
          {/* The first photo, once one exists. Until then the brand fill carries the
              title, so the tile reads as designed rather than as a failed image. */}
          {cardPhoto ? (
            <div className="relative aspect-4/3 overflow-hidden rounded-box">
              <Image
                src={cardPhoto.src}
                alt={cardPhoto.alt || property.title}
                placeholder="blur"
                fill
                sizes="(min-width: 640px) 320px, 100vw"
                className="object-cover"
              />
            </div>
          ) : (
            /* aria-hidden: this is the fill doing graphic work, and the real heading is
               in the column beside it. Without this a screen reader reads the name twice. */
            <div
              aria-hidden="true"
              className={`flex aspect-4/3 flex-col justify-end rounded-box ${property.fill} p-5`}
            >
              <span
                className={`font-headline text-xl font-extrabold tracking-[-0.03em] ${property.onFill}`}
              >
                {property.title}
              </span>
              <span className={`text-[13px] ${property.onFill} opacity-80`}>
                {area?.name}
              </span>
            </div>
          )}

          <div className="px-1 pb-3 sm:pb-0 sm:pr-5">
            <h3 className="font-display text-xl font-bold tracking-[-0.015em]">
              {property.title}
            </h3>
            <span className="eyebrow mt-1.5 block">{area?.vibe}</span>
            <p className="mt-2.5 text-[15px] leading-relaxed text-body">
              {property.tagline}
            </p>
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
              {property.facts.map((fact) => (
                <div key={fact.label} className="flex gap-1.5">
                  <dt>{fact.label}</dt>
                  <dd className="font-semibold text-text">{fact.value}</dd>
                </div>
              ))}
            </dl>
            <span className="mt-5 inline-block text-sm font-semibold text-primary group-hover:text-secondary">
              {t.viewProperty} →
            </span>
          </div>
        </Link>
      </section>

      {/* -- Why book direct. */}
      <section className="mx-auto max-w-(--container-chrome) px-5 pt-15">
        <div className="grid gap-6.5 rounded-panel bg-surface px-8 py-7.5 sm:grid-cols-[repeat(auto-fit,minmax(230px,1fr))]">
          {why.map((item) => (
            <div key={item.title}>
              <h3 className="text-[15px] font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-normal text-muted">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* -- Social proof. The handoff's rail carries eight review cards; we have the
             reviews we actually have. A rail of one is a quote. */}
      <section className="mx-auto max-w-(--container-chrome) px-5 pt-14">
        <h2 className="font-display text-2xl font-bold tracking-[-0.015em]">
          {t.guestReviews}
        </h2>
        <div className="mt-5 flex gap-4 overflow-x-auto pb-1">
          {property.reviews.map((review) => (
            <figure
              key={review.quote}
              className="flex min-h-[200px] w-[300px] shrink-0 flex-col gap-3 rounded-panel bg-pink p-5.5"
            >
              <blockquote className="text-[14.5px] leading-relaxed text-ink">
                {review.quote}
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3 border-t border-ink/12 pt-3.5 text-[12px] text-ink/75">
                {t.guestReviewSource} · {property.title}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* -- Owner band. The cross-audience fork, given real weight here because owners are
             the business's paying side, but kept below the guest content. */}
      <section className="mx-auto max-w-(--container-chrome) px-5 pt-16">
        <div className="relative overflow-hidden rounded-panel bg-ink p-8 sm:p-12">
          <div className="absolute inset-y-0 right-0 hidden w-[22%] bg-primary min-[900px]:block" />

          <div className="relative flex flex-wrap items-end justify-between gap-8">
            <div className="min-[900px]:max-w-[min(620px,calc(70%-24px))]">
              <span className="eyebrow text-gold-on-ink">{t.forOwners}</span>
              <h2 className="mt-3.5 font-headline text-[clamp(26px,4vw,34px)] font-extrabold leading-[1.12] tracking-[-0.03em] text-white">
                {t.ownerBandTitle}
              </h2>
              <p className="mt-3 max-w-[520px] text-[15.5px] leading-relaxed text-white/80">
                {t.ownerBandSub}
              </p>
            </div>
            <Link
              href={href("/contact")}
              className="whitespace-nowrap rounded-full bg-white px-6.5 py-3.5 text-[14.5px] font-semibold text-ink hover:bg-sand"
            >
              {t.bookStudy}
            </Link>
          </div>

          <div className="relative mt-8 grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
            {staircase.map((step) => (
              <Link
                key={step.n}
                href={href("/how-it-works")}
                className={`group flex min-h-[210px] flex-col gap-2.5 rounded-panel ${step.fill} p-6.5`}
              >
                <span className="eyebrow text-ink/65">
                  {t.step} {step.n}
                </span>
                <h3 className="font-display text-xl font-bold tracking-[-0.015em] text-ink">
                  {step.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-ink/80">
                  {step.body}
                </p>
                <span className="mt-auto flex h-8.5 w-8.5 items-center justify-center rounded-full bg-ink text-white group-hover:bg-primary">
                  →
                </span>
              </Link>
            ))}
          </div>

          <p className="relative mt-5.5 text-[13px] text-white/55">
            {t.ownerBandFoot}{" "}
            <Link
              href={href("/how-it-works")}
              className="text-gold-on-ink underline underline-offset-[3px]"
            >
              {t.checkQualify} →
            </Link>
          </p>
        </div>
      </section>

      {/* -- Closing. One CTA per audience, and the guest one is the plain link because the
             page is guest-led: the owner CTA is the conversion this page is asking for. */}
      <section className="mx-auto max-w-(--container-chrome) px-5 pb-17 pt-14">
        <div className="grid gap-7 border-t border-hairline pt-7.5 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
          <div>
            <h2 className="font-display text-[19px] font-bold tracking-[-0.015em]">
              {t.closingGuest}
            </h2>
            <Link
              href={href(`/${property.slug}`)}
              className="mt-2.5 inline-block text-[14.5px] font-semibold underline underline-offset-4 hover:text-primary"
            >
              {t.viewProperty}
            </Link>
          </div>
          <div>
            <h2 className="font-display text-[19px] font-bold tracking-[-0.015em]">
              {t.closingOwner}
            </h2>
            <Link href={href("/contact")} className="pill-primary mt-3">
              {t.bookStudy}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
