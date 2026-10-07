import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoGallery } from "@/components/photo-gallery";
import { TranslationNote } from "@/components/translation-note";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { PHOTOS } from "@/lib/photos.generated";
import { AREAS } from "@/lib/areas";
import { COSMOS_HOUSE_PREVIEW } from "@/lib/property";
import { CONTACT_EMAIL, pageMeta, SITE_NAME } from "@/lib/site";

/**
 * Cosmos House, before allotment. The Lotus House page's title and gallery band, its fact
 * strip, and an enquiry block where the booking panel would be. Nothing else from that
 * page carries over until the walkthrough has put the facts behind it into the profile.
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

  const facts = [
    { label: t.guests, value: String(property.maxGuests) },
    { label: t.bedrooms, value: String(property.bedrooms) },
    { label: t.bathrooms, value: String(property.bathrooms) },
  ];

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

          <section className="mt-8">
            <h2 className="eyebrow">{t.whereYoullBe}</h2>
            <p className="mt-2 text-sm leading-relaxed text-body">
              {[area?.name, t.homeCity].filter(Boolean).join(", ")}
            </p>
            <p className="mt-1.5 text-[13px] text-muted">{t.addressAfterBooking}</p>
          </section>
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
