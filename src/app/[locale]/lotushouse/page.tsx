import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingPanel } from "@/components/booking-panel";
import { Faq } from "@/components/faq";
import { IconChip } from "@/components/icon";
import { JsonLd } from "@/components/json-ld";
import { PhotoGallery } from "@/components/photo-gallery";
import { TranslationNote } from "@/components/translation-note";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { GUIDE_DISTANCES, GUIDE_PLACES } from "@/lib/guide.generated";
import { FEATURE_ICONS, ORIENTATION_ANCHORS } from "@/lib/orientation";
import { PHOTOS } from "@/lib/photos.generated";
import { alt as ogAlt } from "./opengraph-image";
import {
  LOTUS_HOUSE,
  propertyArea,
  propertyFacts,
  propertyHouseRules,
} from "@/lib/property";
import { CONTACT_EMAIL, pageMeta, routeOgImage, SITE_NAME } from "@/lib/site";
import {
  breadcrumbSchema,
  faqSchema,
  propertySchema,
  type Crumb,
} from "@/lib/structured-data";
import type { Dictionary } from "@/i18n";
import { areaVibe } from "@/i18n/area-vibe";

/**
 * Property detail, in the handoff's block order: title and area → gallery → highlights →
 * description → the honest section → house rules and times → reviews → where you'll be,
 * with the booking panel in the right column.
 *
 * The page has two states, decided by whether src/photos/lotushouse/ has anything in it:
 *
 * - **With photos:** a plain title block over the gallery, which is the handoff's layout.
 * - **Without:** the title sits on a solid brand-fill panel instead. The handoff fills
 *   every empty image slot with a flat colour block, which is right for a prototype and
 *   wrong for a live page a guest is deciding on -- a flat colour where the photos should
 *   be reads as broken, not deliberate. A panel with the title on top is the same colour
 *   doing honest work.
 *
 * Nothing to change when the shoot lands: drop the files in and the page switches over.
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return pageMeta({
    title: t.metaLotusTitle,
    description: t.metaLotusDesc,
    path: "/lotushouse",
    locale,
    // The property's own card, not the site-wide owner pitch. See
    // src/app/[locale]/lotushouse/opengraph-image.tsx for why.
    image: routeOgImage(locale, "/lotushouse", ogAlt),
  });
}

export default async function LotusHousePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);
  const property = LOTUS_HOUSE;
  const area = propertyArea(property);
  const photos = PHOTOS[property.slug] ?? [];

  // Amenities. Rendered from property.features, which existed and reached nothing but the
  // JSON-LD until 06/09/2026: the heading string t.whatThisHas was written for this block
  // and had never been used. A feature with no dictionary label is dropped rather than
  // printed as its raw key, and three of the seven had no label at all, which is why they
  // were also silently missing from the markup.
  const amenities = property.features
    .map((feature) => ({
      key: feature,
      icon: FEATURE_ICONS[feature],
      label: t[`feature_${feature.replace(/-/g, "_")}` as keyof Dictionary] as
        | string
        | undefined,
    }))
    .filter((item): item is { key: string; icon: string; label: string } =>
      Boolean(item.label),
    );

  // Orientation. Every minute below is a routed figure out of GUIDE_DISTANCES, keyed by
  // this property, so the block states measured facts rather than a mood. An anchor whose
  // row has gone from the sheet drops out instead of rendering an empty line.
  const distances = GUIDE_DISTANCES[property.slug] ?? {};
  const anchors = ORIENTATION_ANCHORS.map((anchor) => ({
    ...anchor,
    text: t[anchor.label as keyof Dictionary] as string,
    distance: distances[anchor.place],
  })).filter((anchor) => anchor.distance);

  // The guest question set. Deliberately a different set from the eight on /how-it-works,
  // which are an owner's questions about a fee and a filing. Every answer here resolves to
  // a field on the property except the last, which says plainly that the policy does not
  // exist yet rather than filling the gap with boilerplate.
  // Neighbourhood and the exact property noun, which is the fastest thing on a page for
  // telling a townhouse from a condo. The area is dropped when the breadcrumb above
  // already names it, because that is the same fact twice on one screen.
  const typeLabel = String(
    t[`type_${property.type}` as keyof Dictionary] ?? property.type,
  );
  const propertyKind = area
    ? typeLabel
    : t.propertyEyebrow.replace("{area}", "").replace("{type}", typeLabel);

  // Locale-aware, unlike the four other places on this site that render a price with a
  // hardcoded "en-US". The separators happen to agree for th and zh today; the lock does
  // not, and it is next to a panel that formats currency properly.
  const money = new Intl.NumberFormat(
    locale === "th" ? "th-TH" : locale === "zh" ? "zh-Hans" : "en-GB",
    { style: "currency", currency: property.currency, maximumFractionDigits: 0 },
  );

  const facts = propertyFacts(t, property);
  const houseRules = propertyHouseRules(t, property);

  const guestFaq = [
    {
      q: t.gq1,
      a: t.ga1.replace("{in}", property.checkIn).replace("{out}", property.checkOut),
    },
    { q: t.gq2, a: t.ga2 },
    { q: t.gq3, a: t.ga3 },
    { q: t.gq4, a: t.ga4.replace("{n}", String(property.maxGuests)) },
    { q: t.gq5, a: t.ga5.replace("{n}", String(property.minStay)) },
    { q: t.gq6, a: t.ga6 },
    { q: t.gq7, a: t.ga7 },
  ];

  // One trail. The visible breadcrumb and the marked-up one are rendered from this array,
  // so they cannot drift apart, which is the whole reason a crawler is allowed to trust the
  // markup. The final crumb is the property itself and carries no URL.
  //
  // "Chiang Mai" used to sit between the brand and the neighbourhood. It is gone, because
  // every crumb but the last needs a URL and there is no Chiang Mai page to give it one.
  // The city is still named in the heading, the tagline and the description.
  const crumbs: Crumb[] = [
    { name: SITE_NAME, path: "/" },
    ...(area ? [{ name: area.name, path: `/destinations/${area.slug}` }] : []),
    { name: property.title },
  ];

  // Two renderings of the one trail: ink on the photo hero, light on the brand fill.
  const breadcrumb = (tone: "ink" | "onFill") => (
    <nav
      aria-label={t.breadcrumbLabel}
      className={tone === "ink" ? "eyebrow" : "eyebrow text-white/75"}
    >
      {crumbs.map((crumb, index) => (
        <span key={crumb.name}>
          {index > 0 ? " · " : null}
          {crumb.path ? (
            <Link
              href={href(crumb.path)}
              className={
                tone === "ink" ? "hit hover:text-primary" : "hit hover:text-white"
              }
            >
              {crumb.name}
            </Link>
          ) : (
            crumb.name
          )}
        </span>
      ))}
    </nav>
  );

  return (
    <div>
      <TranslationNote locale={locale} />
      <JsonLd data={propertySchema({ locale, t, property, photos })} />
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />
      <JsonLd data={faqSchema(guestFaq)} />

      {/* shape: hero -- One band, two renderings: the gallery when photography exists, the brand fill when it does not. */}
      {photos.length > 0 ? (
        <section className="mx-auto max-w-(--container-chrome) px-5 pt-9">
          {breadcrumb("ink")}
          {/* Neighbourhood and the exact property noun, above the name. The noun is the
              fastest thing on the page for telling a townhouse from a condo, and it was
              only reachable from the results tile until now. */}
          <p className="eyebrow mt-2.5">{propertyKind}</p>
          <h1 className="mt-1.5 font-headline text-[clamp(28px,5vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
            {property.title}
          </h1>
          <p className="mt-2.5 max-w-[560px] text-base leading-relaxed text-body">
            {t.lotusTagline}
          </p>
          <div className="mt-4.5">
            <PhotoGallery
              photos={photos}
              labels={{
                showAll: t.showAllPhotos,
                close: t.close,
                photosOf: t.photosOf,
                propertyName: property.title,
                openPhoto: t.openPhoto,
              }}
            />
          </div>
        </section>
      ) : (
        /* -- No photography yet: brand fill with the title on it, not a stand-in for a photo. */
        <section className="px-5">
          <div
            className={`mx-auto mt-4 max-w-(--container-chrome) rounded-panel ${property.fill} px-6 py-11 sm:px-12`}
          >
            {breadcrumb("onFill")}
            <p className="eyebrow mt-2.5 text-white/75">{propertyKind}</p>
            <h1 className="mt-1.5 font-headline text-[clamp(28px,5vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
              {property.title}
            </h1>
            <p className="mt-3.5 max-w-[560px] text-base leading-relaxed text-white/85">
              {t.lotusTagline}
            </p>
          </div>
        </section>
      )}

      {/* pb-28 below 900px leaves room for the sticky booking bar, which is fixed and
          would otherwise sit on top of the last section of the page. */}
      <div className="mx-auto grid max-w-(--container-chrome) items-start gap-11 px-5 pb-28 pt-11 min-[900px]:grid-cols-[1fr_372px] min-[900px]:pb-18">
        {/* -- Left column: the content sequence. */}
        <div className="max-w-[760px]">
          {/* shape: fact-grid -- The unit's facts, then what it is. */}
          <dl className="flex flex-wrap gap-x-8 gap-y-3 border-b border-hairline pb-6">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="eyebrow">{fact.label}</dt>
                <dd className="mt-1 font-display text-lg font-bold tracking-[-0.015em]">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 space-y-4 text-[15px] leading-relaxed text-body">
            {property.descriptionKeys.map((key) => (
              <p key={key}>{t[key]}</p>
            ))}
          </div>

          {/* shape: honest-section
              -- The honest section. What this place is not, printed at full size next to
                 what it is. This is the block that makes the rest of the page credible;
                 it does not get shrunk or moved below the fold. */}
          <section className="mt-8 rounded-panel bg-wash-red px-6 py-5.5">
            <h2 className="eyebrow text-deep-red">{t.whatThisPlaceIsNot}</h2>

            {/* `three-storey-child-safety` rides in this list as one line rather than
                as a block of its own. It is a standing recommendation, not an
                interrogation: most guests travel without toddlers, and the ones who do
                are capable of supervising them. See CLAUDE.md, guest-facing copy. */}
            <ul className="mt-3 flex flex-col gap-2">
              {[...houseRules, t.childSupervision].map((rule) => (
                <li key={rule} className="flex gap-2.5 text-sm leading-normal text-body">
                  <span aria-hidden="true" className="font-bold text-deep-red">
                    ·
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* shape: fact-grid
              -- What this place has. property.features reached the JSON-LD and nothing a
                 reader could see, so a guest comparing this house against a listing on a
                 channel had no amenity list at all on the page that asks for the booking.

                 Icons are the site's own set: stroke-only, currentColor, inside a chip,
                 aria-hidden. The label carries the meaning; the glyph only makes the list
                 scannable, which is the one thing an amenity list is for. */}
          {amenities.length > 0 ? (
            <section className="mt-8">
              <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
                {t.whatThisHas}
              </h2>
              <ul className="mt-4 grid gap-3.5 sm:grid-cols-2">
                {amenities.map((item) => (
                  <li key={item.key} className="flex items-center gap-3">
                    <IconChip name={item.icon} />
                    <span className="text-[15px] text-body">{item.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* shape: fact-grid -- Good to know, and where you will be. */}
          <section className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="eyebrow">{t.goodToKnow}</h2>
              <p className="mt-2 text-sm leading-relaxed text-body">
                {t.checkIn} {property.checkIn} · {t.checkOut} {property.checkOut}
              </p>
            </div>
            <div>
              <h2 className="eyebrow">{t.whereYoullBe}</h2>
              {/* Neighbourhood, not the street address. The exact address and pin are
                  booking-confirmation material: a listing anyone can find should not
                  publish where the house is, which is what Airbnb and Booking both do.
                  A booked guest still gets it, through the one-way-alley-arrival
                  disclosure on the property profile, which carries the Google Maps and
                  the Grab address because the two differ. */}
              <p className="mt-2 text-sm leading-relaxed text-body">
                {[area?.name, t.homeCity].filter(Boolean).join(", ")}
              </p>
              <p className="mt-1.5 text-[13px] text-muted">{areaVibe(t, area)}</p>
              <p className="mt-1.5 text-[13px] text-muted">{t.addressAfterBooking}</p>
            </div>
          </section>


          {/* shape: fact-grid
              -- Getting around. Six anchors, six different questions, and every minute is a
                 routed figure out of GUIDE_DISTANCES rather than a number written by hand.
                 The page had no distances at all before this: "close to everything" was the
                 whole of what it said about location, which is a claim and not a fact. */}
          {anchors.length > 0 ? (
            <section className="mt-8">
              <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
                {t.gettingAround}
              </h2>
              <p className="mt-1.5 text-[13px] text-muted">{t.gettingAroundBody}</p>
              <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
                {anchors.map((anchor) => (
                  <li
                    key={anchor.place}
                    className="flex items-center gap-3.5 py-3"
                  >
                    <IconChip name={anchor.icon} />
                    <span className="flex-1 text-[15px] text-body">{anchor.text}</span>
                    <span className="shrink-0 text-right text-[13px] text-muted">
                      {[
                        anchor.distance.walk !== null
                          ? t.minWalk.replace("{n}", String(anchor.distance.walk))
                          : null,
                        anchor.distance.drive !== null
                          ? t.minDrive.replace("{n}", String(anchor.distance.drive))
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* shape: proof-block -- Guest reviews, or nothing at all when there are none. */}
          {property.reviews.length > 0 ? (
            <section className="mt-8">
              <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
                {t.guestReviews}
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                {property.reviews.map((review) => (
                  <figure
                    key={review.quote}
                    className="rounded-panel border border-hairline px-6 py-5"
                  >
                    <blockquote
                      lang={review.lang}
                      className="text-[14.5px] leading-relaxed text-body"
                    >
                      {review.quote}
                    </blockquote>
                    <figcaption className="mt-3 text-xs text-muted">
                      — {review.source}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          {/* shape: faq
              -- The guest question set. A different set from the eight on /how-it-works,
                 which are an owner's questions about a fee and a filing. Marked up as its
                 own FAQPage, which is the second block the spec asks for and the site did
                 not have because this set did not exist. */}
          <section className="mt-9">
            <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
              {t.guestFaqTitle}
            </h2>
            <div className="mt-4">
              <Faq items={guestFaq} />
            </div>
          </section>

        </div>

        {/* shape: booking-panel
            -- Right column: the booking panel, and the two blocks that used to sit at the
               bottom of the left one.

               The panel is deliberately not sticky. The design pins the booking panel on a
               property page, but that assumes a ~400px panel; a calendar plus a request
               form pinned to the viewport traps the rest of the page on any short screen,
               which the handoff's own responsive rule rules out. The mobile answer is the
               slim bar at the foot of this file instead.

               The panel is roughly 350px tall in its resting state against a left column
               of two thousand, so above 900px this column was a 372px strip of white for
               nine tenths of the page. The guide card and the enquiry block moved here:
               both are secondary to the panel, both want to be found after someone has
               read the house, and neither belongs in the reading measure. */}
        <div className="flex flex-col gap-6">
          <BookingPanel
            t={t}
            locale={locale}
            contactHref={href("/contact")}
            privacyHref={href("/privacy-policy")}
          />

        {/* shape: cross-link
            -- The local guide. It had 109 places, walk and drive times from this door,
               and not one inbound link from anywhere on the site: reachable from the
               sitemap and from nothing a person could click. This is that link. */}
        <section className="mt-8 overflow-hidden rounded-panel bg-surface p-6">
          <h2 className="font-display text-lg font-bold tracking-[-0.015em]">
            {t.guideCardTitle}
          </h2>
          <p className="mt-2 max-w-[560px] text-sm leading-relaxed text-body">
            {t.guideCardBody.replace("{n}", String(GUIDE_PLACES.length))}
          </p>
          <Link href={href(`/${property.slug}/local-guide`)} className="pill-primary mt-4">
            {t.guideCardLink}
          </Link>
        </section>

        {/* shape: closing-cta
            -- Somewhere to put a question. A guest who has one and no dates had nowhere
               to go: the booking button needs dates before it does anything, and
               /contact sends guests back to this page, so the two pointed at each other
               and the path closed. Subordinate to the panel on purpose -- it is a link,
               not a second primary action. */}
        <section className="mt-9 border-t border-hairline pt-7">
          <h2 className="font-display text-lg font-bold tracking-[-0.015em]">
            {t.askTitle}
          </h2>
          <p className="mt-2 max-w-[520px] text-sm leading-relaxed text-body">
            {t.askBody}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(property.title)}`}
            className="hit mt-3 inline-block text-[14.5px] font-semibold underline underline-offset-4 hover:text-primary"
          >
            {t.askEmail}
          </a>

        </section>
        </div>
      </div>

      {/* shape: closing-cta
          -- The cross-audience link. Plain text, always secondary weight, never a second
             primary CTA, per the spec's one rule about these. Full width under both
             columns: inside the 372px right column the link alone wrapped onto two lines. */}
      <div className="mx-auto max-w-(--container-chrome) px-5 pb-16">
        <p className="border-t border-hairline pt-6 text-[13px] text-muted">
          {t.ownerReentry}{" "}
          <Link
            href={href("/how-it-works")}
            className="font-semibold text-text underline underline-offset-[3px] hover:text-primary"
          >
            {t.ownerReentryLink}
          </Link>
        </p>
      </div>

      {/* shape: closing-cta
          -- Below 900px the panel is the last thing on a 3,900px page: measured at 390px,
             a guest had to scroll 2.4 screens to reach a calendar and 3.1 to reach a
             price, on faith, with nothing on the way telling them what a night costs.
             This bar carries the floor price and a link to the panel. It is a link and a
             figure, not a second booking flow -- the panel is still where a stay is
             priced and taken. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-bg/97 px-5 py-3 backdrop-blur min-[900px]:hidden">
        <div className="flex items-center justify-between gap-4">
          {property.fromPrice ? (
            <p className="text-[13px] text-muted">
              {t.fromPrice}{" "}
              <span className="text-[15px] font-bold text-text">
                {money.format(property.fromPrice)}
              </span>{" "}
              {t.perNight}
            </p>
          ) : (
            <p className="text-[13px] text-muted">{t.checkDatesAndBook}</p>
          )}
          <a href="#booking" className="pill-primary shrink-0 py-3 text-[14px]">
            {t.checkAvailability}
          </a>
        </div>
      </div>
    </div>
  );
}
