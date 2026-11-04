import type { Metadata } from "next";
import { getImageProps } from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { pickPhoto } from "@/lib/photos";
import { LOTUS_HOUSE, PROPERTIES } from "@/lib/property";
import { PropertyTile } from "@/components/property-tile";
import { areaVibe } from "@/i18n/area-vibe";
import { AREAS } from "@/lib/areas";
import { areaName } from "@/lib/area-content";
import heroPortrait from "@/photos/lotushouse/_hero/lotus_living_room_portrait.jpg";
import {
  OG_IMAGE,
  OG_LOCALE,
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
  const t = getDictionary(locale);
  const title = t.metaHomeTitle;

  return {
    title: { absolute: title },
    description: t.metaHomeDesc,
    alternates: {
      canonical: absoluteUrl(locale, "/"),
      languages: languageAlternates("/"),
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      // A page-level openGraph replaces the layout's outright, so this object has to
      // carry everything the layout would have: the homepage published no og:locale at
      // all, in any language, because this one was hand-built for the absolute title.
      locale: OG_LOCALE[locale],
      url: absoluteUrl(locale, "/"),
      title,
      description: t.metaHomeDesc,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: t.metaHomeDesc,
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
  // The homepage is for renters in every language (Paul, 03/11/2026). Owners are sent to
  // /how-it-works, which carries the services, so this page signposts it once and no more.
  // The audience fork and the three service cards that used to sit here are gone with that.

  // Three ways in, by length of stay, replacing the destination and date search, which
  // offered three cities and one bookable house. The monthly facts in the second choice are
  // the same ones /house-for-rent-chiang-mai states (hfrAns2A), not new claims.
  const choices = [
    {
      key: "nights",
      title: t.homeChoiceNightsTitle,
      body: t.homeChoiceNightsBody,
      cta: t.homeChoiceNightsCta,
      href: href(`/${property.slug}`),
    },
    {
      key: "month",
      title: t.homeChoiceMonthTitle,
      body: t.homeChoiceMonthBody,
      cta: t.homeChoiceMonthCta,
      href: href(`/${property.slug}`),
    },
    {
      key: "find",
      title: t.homeChoiceFindTitle,
      body: t.homeChoiceFindBody,
      cta: t.areaFaqMonthLink,
      href: href("/house-for-rent-chiang-mai#request"),
    },
  ];

  // The hero ground. Paul, 24/08/2026: the hero should carry a photograph rather than the
  // flat ink panel. The migration plan's original shot list asked for "one Chiang Mai
  // context frame for the homepage hero" and this is it -- sunset over the mountains, shot
  // from the Lotus House terrace, so it is real, ours, and actually of Chiang Mai.
  //
  // Deliberately not IMG_4991, the terrace-at-sunset frame: the 18/08 QA pass ruled it out
  // of lead roles because it shows a man in the tub and a beer on the table, and it is the
  // uncovered tub the rooftop-bathtub disclosure exists for. Fine as gallery photo nine,
  // wrong as the front door.
  //
  // Falls back to the flat ink panel if the file is ever renamed, so the hero cannot break.
  //
  // Paul, 03/11/2026: the sunset was replaced by the roof terrace itself, tub and loungers,
  // because a sky reads as anywhere and the terrace is this house. Centred rather than
  // bottom-cropped: the subject sits in the middle of the frame, not on a ridge line.
  //
  // Paul, later the same day: the living room instead, because the headline promises a home
  // for a week or a year and a bathing terrace promises an amenity. Two of the three cards
  // below now sell stays of a month or more, and the living room is the room those guests
  // are buying. It also carries its subject across the whole frame, where the terrace corner
  // had one white object against a blank wall, so both crops below keep a readable scene
  // rather than throwing the subject away.
  const heroGround = pickPhoto(property.slug, "20240411_052358");

  // Art direction. The panel's height is set by the text stack, so at 375 it is a 0.34 ratio
  // box, and object-fit cover on a 4:3 frame keeps only about a quarter of its width at that
  // shape, whatever the frame is of. Phones get the 9:16 crop that
  // scripts/crop-hero-portrait.mjs cuts, and the wide frame is held back for 900px and up,
  // where the panel is wide enough to carry it.
  //
  // One <picture> built from getImageProps rather than two <Image> elements, because a
  // hidden <img> is still fetched and two components would mean two hero downloads. The cost
  // is the blur placeholder, which this API cannot carry (next/image docs, getImageProps);
  // the panel's own bg-ink stands in as the ground, so the photo still resolves over brand
  // ink rather than over white.
  const heroImage = { alt: "", sizes: "(min-width: 1440px) 1400px, 100vw", priority: true };
  const heroWide = heroGround
    ? getImageProps({ ...heroImage, src: heroGround.src }).props
    : null;
  const heroTall = getImageProps({ ...heroImage, src: heroPortrait }).props;
  const why = [
    { title: t.whyA, body: t.whyABody },
    { title: t.whyB, body: t.whyBBody },
    { title: t.whyC, body: t.whyCBody },
  ];

  return (
    <div>
      {/* shape: hero
          -- Hero. Ink panel inset from the viewport, carrying a photograph of Chiang Mai
             behind the copy. Until 24/08/2026 this was flat ink with a blue and gold stripe
             on the right quarter; the stripes came out with the photo, because a photograph
             plus two colour blocks is three treatments competing in one panel.

             One scrim, and it runs left to right rather than top to bottom. The design
             system's .on-photo scrim (design-system.html line 219) is vertical, because it
             is built for cards whose text sits at the bottom. This hero's text sits
             top-left, so a vertical scrim darkens the wrong half: it dims the sunset and
             still leaves the headline on bright sky. Stacking both was tried first and the
             two compounded into near-black, which is the flat panel again with extra steps.

             So: a single horizontal scrim at 900px and up, using the system's own
             rgba(10,8,20,...) ink, opaque enough to hold the text column and releasing
             almost entirely by the right edge so the terrace actually reads.

             Below 900px that scrim turns vertical after all, because the layout does. The
             copy stacks across the full panel width with the three cards beneath it, so
             there is no text column for a horizontal scrim to hold and its clear right end
             lands under the headline instead.

             Held at 0.88 down to 40 percent, which is the whole text block, because what
             sits behind the copy in the portrait crop is white wall: measured on
             the running site, the standfirst's own white/80 lands at about 4.1 to 1 against
             a 0.80 scrim there and about 5.4 to 1 against this one. It then releases to a
             floor of 0.20, so the sofa and the horseshoe chair read in the gutters beside
             the three cards, which is the only place on a phone the photograph can be seen at
             all: the cards are opaque and cover the lower two thirds of the panel.

             The photo stays decorative: alt="" and aria-hidden, because the h1 immediately
             below already says what this section is, and a screen reader announcing a
             sunset before the headline is noise rather than information. */}
      <section className="px-5">
        <div className="relative mx-auto mt-4 max-w-(--container-chrome) overflow-hidden rounded-panel bg-ink px-6 py-12 sm:px-12 sm:py-13">
          {heroGround ? (
            <>
              <picture className="absolute inset-0">
                <source media="(min-width: 900px)" srcSet={heroWide?.srcSet} />
                <img
                  {...heroTall}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover object-[50%_50%] min-[900px]:object-[50%_42%]"
                />
              </picture>
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,8,20,0.90)_0%,rgba(10,8,20,0.88)_40%,rgba(10,8,20,0.42)_62%,rgba(10,8,20,0.20)_100%)] min-[900px]:bg-[linear-gradient(90deg,rgba(10,8,20,0.88)_0%,rgba(10,8,20,0.72)_30%,rgba(10,8,20,0.28)_58%,rgba(10,8,20,0.06)_100%)]"
              />
            </>
          ) : (
            <>
              <div className="absolute inset-y-0 right-0 hidden w-[30%] bg-primary min-[900px]:block" />
              <div className="absolute inset-y-0 right-[30%] hidden w-[8%] bg-sand min-[900px]:block" />
            </>
          )}

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

          </div>

          {/* Three choices rather than one search bar. White cards on the scrim so the
              photograph still reads between them; each is one link, so the whole card is
              the target on a phone. */}
          <ul className="relative mt-8 grid gap-3 min-[900px]:grid-cols-3">
            {choices.map((choice) => (
              <li key={choice.key}>
                <Link
                  href={choice.href}
                  className="group flex h-full flex-col gap-1.5 rounded-box bg-white/95 px-5.5 py-5 text-ink transition-colors hover:bg-white"
                >
                  <span className="font-display text-[17px] font-bold tracking-[-0.015em]">
                    {choice.title}
                  </span>
                  <span className="text-[13.5px] leading-relaxed text-body">
                    {choice.body}
                  </span>
                  <span className="mt-auto pt-2 text-[13.5px] font-semibold text-primary underline-offset-4 group-hover:underline">
                    {choice.cta} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* shape: property-tile -- Every listed property, as the same tiles /properties
          shows, so the homepage and the results grid cannot describe a house two ways.
          Two then three columns, not auto-fill: three tiles in an auto-fill grid at 1440px
          left a fourth, empty column. Both breakpoints are written in px: `sm:` is in rem and
          sorted after `min-[900px]:` in the built CSS, so the two-column rule won. */}
      <section className="mx-auto max-w-(--container-chrome) px-5 pt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-[-0.015em]">
              {t.featuredTitle}
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              {t.featuredSub.replace("{n}", String(PROPERTIES.length))}
            </p>
          </div>
          <Link
            href={href("/properties")}
            className="text-sm font-semibold text-primary hover:text-secondary"
          >
            {t.allProperties} →
          </Link>
        </div>
        <div className="mt-5.5 grid gap-6 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3">
          {PROPERTIES.map((item) => (
            <PropertyTile
              key={item.slug}
              property={item}
              t={t}
              href={href(`/${item.slug}`)}
              locale={locale as Locale}
            />
          ))}
        </div>
      </section>

      {/* shape: value-glyph-grid -- Why book direct. */}
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


      {/* shape: value-glyph-grid
          -- Where in Chiang Mai. The eight neighbourhood pages carry real content as of
             06/09/2026 and the homepage pointed at none of them: they were reachable from
             the nav and the footer and from nothing in the body of any page. The spec names
             three routes into them and this is the missing one.

             Drawn as an index rather than eight cards: a colour fade per card carried no
             information, and the names and one line each are the content. */}
      <section className="mx-auto max-w-(--container-chrome) px-5 pt-15">
        <h2 className="font-display text-2xl font-bold tracking-[-0.015em]">
          {t.homeAreasTitle}
        </h2>
        <p className="mt-1.5 max-w-[620px] text-sm leading-relaxed text-muted">
          {t.homeAreasSub}
        </p>

        <ul className="mt-5.5 grid border-t border-hairline sm:grid-cols-2 sm:gap-x-10">
          {AREAS.map((area) => (
            <li key={area.slug} className="border-b border-hairline">
              <Link
                href={href(`/destinations/${area.slug}`)}
                className="group flex items-baseline justify-between gap-4 py-4"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="font-display text-[16px] font-bold tracking-[-0.015em] group-hover:text-primary">
                    {areaName(t, area.slug)}
                  </span>
                  <span className="text-[13.5px] leading-normal text-muted">
                    {areaVibe(t, area)}
                  </span>
                </span>
                <span aria-hidden="true" className="text-muted group-hover:text-primary">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href={href("/destinations")}
          className="hit mt-5 inline-block text-[14.5px] font-semibold underline underline-offset-4 hover:text-primary"
        >
          {t.homeAreasLink}
        </Link>
      </section>

      {/* shape: proof-block
          -- Social proof. The handoff's rail carries eight review cards; we have the
             reviews we actually have, and its own comment already said "a rail of one is a
             quote". It was still drawn as a rail: one 300px card in a 1,400px row, with
             three quarters of the band empty, which reads as seven cards that failed to
             load rather than as one quote we stand behind.

             Restyled 04/11/2026, Paul's direction, after Lodgify's own reviews page: a soft
             panel with a generous radius and 44px of padding, the heading centred and set
             40px/700 uppercase as on the owner page. Two of its parts are deliberately left
             out. Its card carries a 5/5 chip, and no rating is on file here. And it splits
             each quote into a bold lead and a lighter body, which this one cannot do
             honestly: the stored quote is already cut off with an ellipsis, so there is no
             second half to set differently. Its radius is 51px and this is 28px, the figure
             used across the owner page, rather than a third rounding on the site.

             So one review is drawn as a quote at full measure and more than one goes back
             to the rail. Nothing here states a count or an average, because neither is on
             file: the figure a reader could check has to come off the platform, and a
             number nobody verified is worse than no number. */}
      <section className="mx-auto max-w-(--container-chrome) px-5 pt-14">
        <h2 className="mx-auto max-w-[816px] text-center font-display text-[clamp(26px,4.4vw,40px)] leading-[1.2] font-bold uppercase">
          {t.guestReviews}
        </h2>

        {property.reviews.length === 1 ? (
          <figure className="mx-auto mt-10 max-w-[720px] rounded-[28px] bg-pink px-7 py-8 sm:px-11 sm:py-11">
            <blockquote
              lang={property.reviews[0].lang}
              className="font-display text-[clamp(18px,2.4vw,23px)] font-semibold leading-[1.45] tracking-[-0.01em] text-ink"
            >
              {property.reviews[0].quote}
            </blockquote>
            <figcaption className="mt-5 border-t border-ink/12 pt-4 text-[12.5px] text-ink/75">
              {t.guestReviewSource} · {property.title}
            </figcaption>
          </figure>
        ) : (
          <div className="mt-5 flex gap-4 overflow-x-auto pb-1">
            {property.reviews.map((review) => (
              <figure
                key={review.quote}
                className="flex min-h-[200px] w-[300px] shrink-0 flex-col gap-3 rounded-panel bg-pink p-5.5"
              >
                <blockquote
                  lang={review.lang}
                  className="text-[14.5px] leading-relaxed text-ink"
                >
                  {review.quote}
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-3 border-t border-ink/12 pt-3.5 text-[12px] text-ink/75">
                  {t.guestReviewSource} · {property.title}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      {/* shape: audience-fork
          -- Owner signpost. One line and one link to /how-it-works in the visitor's
             language, which is where owners are sent from every page. */}
      <section className="mx-auto max-w-(--container-chrome) px-5 pt-16">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-panel bg-ink px-8 py-8 sm:px-12">
          <div className="max-w-[620px]">
            <span className="eyebrow text-gold-on-ink">{t.forOwners}</span>
            <h2 className="mt-3 font-display text-[clamp(22px,3vw,26px)] font-bold tracking-[-0.015em] text-white">
              {t.ownerBandTitle}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-white/80">
              {t.ownerPanelBody}
            </p>
          </div>
          <Link
            href={href("/how-it-works")}
            className="pill-light whitespace-nowrap"
          >
            {t.ownerPanelLink}
          </Link>
        </div>
      </section>

      {/* shape: closing-cta
          -- Closing, renters only. The two ways to stay, at equal weight. */}
      <section className="mx-auto max-w-(--container-chrome) px-5 pb-17 pt-14">
        <div className="border-t border-hairline pt-7.5">
          <h2 className="font-display text-[19px] font-bold tracking-[-0.015em]">
            {t.closingGuest}
          </h2>
          <div className="mt-3.5 flex flex-wrap gap-3">
            <Link href={href(`/${property.slug}`)} className="pill-primary">
              {t.viewProperty}
            </Link>
            <Link
              href={href("/house-for-rent-chiang-mai#request")}
              className="pill-outline"
            >
              {t.areaFaqMonthLink}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
