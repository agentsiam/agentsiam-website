import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingPanel } from "@/components/booking-panel";
import { PhotoGallery } from "@/components/photo-gallery";
import { TranslationNote } from "@/components/translation-note";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { PHOTOS } from "@/lib/photos.generated";
import { alt as ogAlt } from "./opengraph-image";
import { LOTUS_HOUSE, propertyArea } from "@/lib/property";
import { pageMeta, routeOgImage } from "@/lib/site";

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

  const breadcrumb = (
    <nav aria-label="Breadcrumb" className="eyebrow">
      <Link href={href("/")} className="hover:text-primary">
        AgentSiam
      </Link>{" "}
      · Chiang Mai · {area?.name}
    </nav>
  );

  return (
    <div>
      <TranslationNote locale={locale} />

      {photos.length > 0 ? (
        <section className="mx-auto max-w-(--container-chrome) px-5 pt-9">
          {breadcrumb}
          <h1 className="mt-3 font-headline text-[clamp(28px,5vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
            {property.title}
          </h1>
          <p className="mt-2.5 max-w-[560px] text-base leading-relaxed text-body">
            {property.tagline}
          </p>
          <div className="mt-4.5">
            <PhotoGallery
              photos={photos}
              labels={{
                showAll: t.showAllPhotos,
                close: t.close,
                photosOf: t.photosOf,
                propertyName: property.title,
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
            <nav aria-label="Breadcrumb" className="eyebrow text-white/75">
              <Link href={href("/")} className="hover:text-white">
                AgentSiam
              </Link>{" "}
              · Chiang Mai · {area?.name}
            </nav>
            <h1 className="mt-3.5 font-headline text-[clamp(28px,5vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
              {property.title}
            </h1>
            <p className="mt-3.5 max-w-[560px] text-base leading-relaxed text-white/85">
              {property.tagline}
            </p>
          </div>
        </section>
      )}

      <div className="mx-auto grid max-w-(--container-chrome) items-start gap-11 px-5 pb-18 pt-11 min-[900px]:grid-cols-[1fr_372px]">
        {/* -- Left column: the content sequence. */}
        <div className="max-w-[720px]">
          <dl className="flex flex-wrap gap-x-8 gap-y-3 border-b border-hairline pb-6">
            {property.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="eyebrow">{fact.label}</dt>
                <dd className="mt-1 font-display text-lg font-bold tracking-[-0.015em]">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 space-y-4 text-[15px] leading-relaxed text-body">
            {property.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {/* -- The honest section. What this place is not, printed at full size next to
                 what it is. This is the block that makes the rest of the page credible;
                 it does not get shrunk or moved below the fold. */}
          <section className="mt-8 rounded-panel bg-wash-red px-6 py-5.5">
            <h2 className="eyebrow text-deep-red">{t.whatThisPlaceIsNot}</h2>

            {/* The `three-storey-child-safety` disclosure from the property profile,
                severity `safety`, surfaced to `listing`. It leads this section rather
                than joining the list below because it is the only entry here that is a
                hazard rather than a limitation, and because the profile's own rule is
                that a `safety` disclosure missing from the listing is a mis-sold
                booking. The booking panel asks the guest to acknowledge it. */}
            <p className="mt-3 text-sm font-semibold leading-normal text-deep-red">
              {t.childSafetyHeading}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-body">{t.childSafetyNote}</p>

            <ul className="mt-4 flex flex-col gap-2 border-t border-deep-red/15 pt-4">
              {property.houseRules.map((rule) => (
                <li key={rule} className="flex gap-2.5 text-sm leading-normal text-body">
                  <span aria-hidden="true" className="font-bold text-deep-red">
                    ·
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </section>

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
                {[area?.name, "Chiang Mai"].filter(Boolean).join(", ")}
              </p>
              <p className="mt-1.5 text-[13px] text-muted">{area?.vibe}</p>
              <p className="mt-1.5 text-[13px] text-muted">{t.addressAfterBooking}</p>
            </div>
          </section>

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
                    <blockquote className="text-[14.5px] leading-relaxed text-body">
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
        </div>

        {/* -- Right column: the booking panel.

               Deliberately not sticky. The design pins the booking panel on a property
               page, but that assumes a ~400px panel; a calendar plus a request form
               pinned to the viewport traps the rest of the page on any short screen,
               which the handoff's own responsive rule rules out. */}
        <BookingPanel
          t={t}
          locale={locale}
          contactHref={href("/contact")}
          privacyHref={href("/privacy-policy")}
        />
      </div>
    </div>
  );
}
