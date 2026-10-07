import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoGallery } from "@/components/photo-gallery";
import { TranslationNote } from "@/components/translation-note";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { IconChip } from "@/components/icon";
import { GUIDE_DISTANCES } from "@/lib/guide.generated";
import { FEATURE_ICONS, ORIENTATION_ANCHORS } from "@/lib/orientation";
import { PHOTOS } from "@/lib/photos.generated";
import { AREAS } from "@/lib/areas";
import { COSMOS_HOUSE_PREVIEW, type Property } from "@/lib/property";
import { CONTACT_EMAIL, pageMeta, SITE_NAME } from "@/lib/site";
import type { Dictionary } from "@/i18n";
import { areaVibe } from "@/i18n/area-vibe";

/**
 * Cosmos House, before allotment. The Lotus House page's layout with an enquiry block where
 * the booking panel would be. Every fact below is a field in COSMOS_HOUSE_PREVIEW, which
 * mirrors the property profile. Left out until they exist: reviews, the guest FAQ (its
 * answers are Lotus House's), a price and the booking panel.
 *
 * noindex, not in ROUTES, not in the sitemap and not linked from anywhere: reachable by
 * URL only, for the owner to see.
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return pageMeta({
    title: t.metaCosmosTitle,
    description: t.metaCosmosDesc,
    path: "/cosmoshouse",
    locale,
    placeholder: true,
  });
}

export default async function CosmosHousePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);
  const property = COSMOS_HOUSE_PREVIEW;
  const area = AREAS.find((item) => item.slug === property.areaSlug);
  const photos = PHOTOS[property.slug] ?? [];

  const facts = property.facts.map((fact: Property["facts"][number]) => ({
    label: t[fact.labelKey],
    value: fact.valueKey ? t[fact.valueKey] : (fact.value ?? ""),
  }));
  const houseRules = property.houseRuleKeys.map((key) => t[key]);
  const typeLabel = String(t[`type_${property.type}` as keyof Dictionary] ?? property.type);

  // As on the Lotus House page: a feature with no dictionary label is dropped.
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

  // Routed from the profile's pin by scripts/build-guide.mjs, as for Lotus House.
  const distances = GUIDE_DISTANCES[property.slug] ?? {};
  const anchors = ORIENTATION_ANCHORS.map((anchor) => ({
    ...anchor,
    text: t[anchor.label as keyof Dictionary] as string,
    distance: distances[anchor.place],
  })).filter((anchor) => anchor.distance);

  return (
    <div>
      <TranslationNote locale={locale} />

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
          {t.cosmosTagline}
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

          <section className="mt-8 rounded-panel bg-wash-red px-6 py-5.5">
            <h2 className="eyebrow text-deep-red">{t.whatThisPlaceIsNot}</h2>
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

          <section className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="eyebrow">{t.goodToKnow}</h2>
              <p className="mt-2 text-sm leading-relaxed text-body">
                {t.checkIn} {property.checkIn} · {t.checkOut} {property.checkOut}
              </p>
            </div>
            <div>
              <h2 className="eyebrow">{t.whereYoullBe}</h2>
              <p className="mt-2 text-sm leading-relaxed text-body">
                {[area?.name, t.homeCity].filter(Boolean).join(", ")}
              </p>
              <p className="mt-1.5 text-[13px] text-muted">{areaVibe(t, area)}</p>
              <p className="mt-1.5 text-[13px] text-muted">{t.addressAfterBooking}</p>
            </div>
          </section>

          {anchors.length > 0 ? (
            <section className="mt-8">
              <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
                {t.gettingAround}
              </h2>
              <p className="mt-1.5 text-[13px] text-muted">{t.gettingAroundBody}</p>
              <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
                {anchors.map((anchor) => (
                  <li key={anchor.place} className="flex items-center gap-3.5 py-3">
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
        </div>

        <section className="rounded-panel bg-surface p-6">
          <h2 className="font-display text-lg font-bold tracking-[-0.015em]">
            {t.cosmosNotOpenTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-body">{t.cosmosNotOpenBody}</p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(property.title)}`}
            className="pill-primary mt-4"
          >
            {t.cosmosEnquire}
          </a>
        </section>
      </div>
    </div>
  );
}
