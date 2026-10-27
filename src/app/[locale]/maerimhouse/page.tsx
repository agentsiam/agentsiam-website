import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoGallery } from "@/components/photo-gallery";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { IconChip } from "@/components/icon";
import { FEATURE_ICONS } from "@/lib/orientation";
import { PHOTOS } from "@/lib/photos.generated";
import { AREAS } from "@/lib/areas";
import { MAE_RIM_HOUSE, propertyFacts } from "@/lib/property";
import { CONTACT_EMAIL, pageMeta, routeOgImage, SITE_NAME } from "@/lib/site";
import { alt as ogAlt } from "./opengraph-image";
import type { Dictionary } from "@/i18n";
import { areaVibe } from "@/i18n/area-vibe";

/** Same mapping as the property tile and the booking panel. */
const INTL_LOCALE: Record<Locale, string> = {
  en: "en-GB",
  th: "th-TH-u-ca-gregory",
  zh: "zh-Hans",
};

/**
 * Mae Rim House, offered on a monthly lease. The Cosmos House layout with lease terms where
 * check-in times would be and an enquiry block where the booking panel would be.
 *
 * Every fact is a field in MAE_RIM_HOUSE, which mirrors the property profile. Left out until
 * the profile has them: house rules, guest count, the travel times (the owner's are
 * unmeasured), the local guide (its times are routed from a pin this house does not have
 * yet) and the address line.
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return pageMeta({
    title: t.metaMaeRimTitle,
    description: t.metaMaeRimDesc,
    path: "/maerimhouse",
    locale,
    image: routeOgImage(locale, "/maerimhouse", ogAlt),
  });
}

export default async function MaeRimHousePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);
  const property = MAE_RIM_HOUSE;
  const lease = property.lease!;
  const area = AREAS.find((item) => item.slug === property.areaSlug);
  const photos = PHOTOS[property.slug] ?? [];
  const facts = propertyFacts(t, property);
  const typeLabel = String(t[`type_${property.type}` as keyof Dictionary] ?? property.type);

  const money = (amount: number) =>
    `${property.currency} ${new Intl.NumberFormat(INTL_LOCALE[locale as Locale], {
      maximumFractionDigits: 0,
    }).format(amount)}`;
  const terms = [
    t.leaseShort.replace("{price}", money(lease.monthlyShort)),
    t.leaseLong.replace("{price}", money(lease.monthlyLong)),
    t.leaseDeposit
      .replace("{d}", String(lease.depositMonths))
      .replace("{a}", String(lease.advanceMonths)),
    t.leaseGarden,
    t.leasePets,
  ];

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

  return (
    <div>
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
          {t.maeRimTagline}
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

          <section className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="eyebrow">{t.leaseTermsTitle}</h2>
              <ul className="mt-2 flex flex-col gap-1.5">
                {terms.map((term) => (
                  <li key={term} className="text-sm leading-relaxed text-body">
                    {term}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="eyebrow">{t.whereYoullBe}</h2>
              <p className="mt-2 text-sm leading-relaxed text-body">
                {[area?.name, t.homeCity].filter(Boolean).join(", ")}
              </p>
              <p className="mt-1.5 text-[13px] text-muted">{areaVibe(t, area)}</p>
            </div>
          </section>
        </div>

        <section className="rounded-panel bg-surface p-6">
          <h2 className="font-display text-lg font-bold tracking-[-0.015em]">
            {t.maeRimEnquireTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-body">{t.maeRimEnquireBody}</p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(property.title)}`}
            className="pill-primary mt-4"
          >
            {t.maeRimEnquire}
          </a>
        </section>
      </div>
    </div>
  );
}
