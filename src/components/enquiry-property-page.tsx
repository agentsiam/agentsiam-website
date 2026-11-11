import Link from "next/link";
import { Faq } from "@/components/faq";
import { IconChip } from "@/components/icon";
import { JsonLd } from "@/components/json-ld";
import { PhotoGallery } from "@/components/photo-gallery";
import { faqSchema } from "@/lib/structured-data";
import { getDictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";
import { areaVibe } from "@/i18n/area-vibe";
import { AREAS } from "@/lib/areas";
import { FEATURE_ICONS } from "@/lib/orientation";
import { PHOTOS } from "@/lib/photos.generated";
import { propertyFacts, type Property } from "@/lib/property";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";
import type { Dictionary } from "@/i18n";

/**
 * A property page for a house that is listed but not bookable: the Mae Rim House layout,
 * with an enquiry block where the booking panel would be.
 *
 * It exists because K. Mike's pool villas arrived five at a time. Lotus House, Cosmos House
 * and Mae Rim House each have a page of their own and are left alone; five more copies of
 * the same two hundred lines would have been five places to fix every future change to a
 * property page. The three older pages are not moved onto this, because each of them does
 * something the others do not (a booking panel, a local guide, measured driving times) and
 * folding those in would make this a switchboard rather than a layout.
 *
 * Every word comes from the dictionary and every fact from the Property, which mirrors the
 * unit's property profile in the consulting repo. Nothing is composed here.
 *
 * The page has two states, decided by whether src/photos/<slug>/ has anything in it. With
 * photos it leads with the gallery; without, the title block stands alone. Dropping the
 * files in and rerunning `npm run photos` switches it over with no change here.
 */
export function EnquiryPropertyPage({
  locale,
  property,
}: {
  locale: Locale;
  property: Property;
}) {
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale, path);
  const area = AREAS.find((item) => item.slug === property.areaSlug);
  const photos = PHOTOS[property.slug] ?? [];
  const facts = propertyFacts(t, property);
  const typeLabel = String(t[`type_${property.type}` as keyof Dictionary] ?? property.type);

  // As on the Lotus House page: a feature with no dictionary label is dropped rather than
  // printed as its own key.
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

  // The profile's `proximity` block, resolved. Absent where nothing has been measured, and
  // the section then does not render rather than printing a heading over nothing.
  const nearby = (property.nearby ?? []).map((place) => ({
    ...place,
    text: t[place.labelKey] as string,
  }));

  /**
   * Before you book. Five of these are the questions Lotus House answers, interpolated from
   * this property rather than copied, and three are the villas' own.
   *
   * The last one exists because several figures above it are estimates: it names which of
   * them are checked and which are read off the owner's material, and gives the route to a
   * confirmed answer. A page that guesses without saying so is the thing worth avoiding,
   * not the guess.
   */
  const guestFaq = [
    {
      q: t.gq1,
      a: t.ga1.replace("{in}", property.checkIn).replace("{out}", property.checkOut),
    },
    { q: t.gq2, a: t.villaFaqParkingA },
    { q: t.gq3, a: t.villaFaqPetsA },
    { q: t.gq4, a: t.ga4.replace("{n}", String(property.maxGuests)) },
    { q: t.gq5, a: t.ga5.replace("{n}", String(property.minStay)) },
    { q: t.gq6, a: t.ga6 },
    { q: t.villaFaqExactQ, a: t.villaFaqExactA },
  ];

  return (
    <div>
      <JsonLd data={faqSchema(guestFaq)} />
      <section className="mx-auto max-w-(--container-chrome) px-5 pt-9">
        <nav aria-label={t.breadcrumbLabel} className="eyebrow">
          <Link href={href("/")} className="hit hover:text-primary">
            {SITE_NAME}
          </Link>
          {area ? (
            <>
              {" · "}
              <Link
                href={href(`/destinations/${area.slug}`)}
                className="hit hover:text-primary"
              >
                {area.name}
              </Link>
            </>
          ) : null}
          {" · "}
          {property.title}
        </nav>
        <p className="eyebrow mt-2.5">{typeLabel}</p>
        <h1 className="mt-1.5 font-headline text-[clamp(28px,5vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
          {property.title}
        </h1>
        <p className="mt-2.5 max-w-[560px] text-base leading-relaxed text-body">
          {t[property.taglineKey]}
        </p>
        {photos.length > 0 ? (
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
        ) : null}
      </section>

      <div className="mx-auto grid max-w-(--container-chrome) items-start gap-11 px-5 pb-18 pt-11 min-[900px]:grid-cols-[1fr_372px]">
        <div className="max-w-[760px]">
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

          {/* The honest section, in the handoff's own order: after what the place has and
              before where it is. Every villa carries the pool line, which is the
              private-pool-supervision disclosure in its property profile. A safety
              disclosure belongs in the listing itself, before payment, never only in a
              message after it. */}
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
              {t.whatThisPlaceIsNot}
            </h2>
            <ul className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-body">
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-muted">
                  &middot;
                </span>
                <span>{t.villaPoolSupervision}</span>
              </li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="eyebrow">{t.whereYoullBe}</h2>
            <p className="mt-2 text-sm leading-relaxed text-body">
              {[area?.name, t.homeCity].filter(Boolean).join(", ")}
            </p>
            <p className="mt-1.5 text-[13px] text-muted">{areaVibe(t, area)}</p>
            <p className="mt-1.5 text-[13px] text-muted">{t.addressAfterBooking}</p>
          </section>

          {nearby.length > 0 ? (
            <section className="mt-8">
              <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
                {t.gettingAround}
              </h2>
              <p className="mt-1.5 text-[13px] text-muted">{t.villaGettingAroundBody}</p>
              <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
                {nearby.map((place) => (
                  <li key={place.labelKey} className="flex items-center gap-3.5 py-3">
                    <IconChip name="transfer" />
                    <span className="flex-1 text-[15px] text-body">{place.text}</span>
                    <span className="shrink-0 text-right text-[13px] text-muted">
                      {t.minDrive.replace("{n}", String(place.driveMinutes))} ·{" "}
                      {t.kmShort.replace("{n}", String(place.km))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-9">
            <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
              {t.guestFaqTitle}
            </h2>
            <Faq items={guestFaq} />
          </section>
        </div>

        <section className="rounded-panel bg-surface p-6">
          <h2 className="font-display text-lg font-bold tracking-[-0.015em]">
            {t.villaEnquireTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-body">{t.villaEnquireBody}</p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(property.title)}`}
            className="pill-primary mt-4"
          >
            {t.villaEnquire}
          </a>
        </section>
      </div>
    </div>
  );
}
