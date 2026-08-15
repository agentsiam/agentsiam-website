import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/i18n";
import { propertyArea, type Property } from "@/lib/property";
import { PHOTOS } from "@/lib/photos.generated";
import { distanceToCentre } from "@/lib/search";

/**
 * One property, as a card. The single tile design in the system.
 *
 * The handoff insists the featured row and the results list use the same component, so
 * there is one card to design and one card to change. This is it -- the homepage, the
 * results page and the area pages all render this.
 *
 * The badge shows **distance to the centre in kilometres**, not a photo count. That is the
 * handoff's call and a good one: a guest scanning a list wants to know roughly where a
 * place is, and "12 photos" answers a question nobody asked.
 *
 * Prices are "from ฿x per night" and nothing more. The real number for real dates comes
 * from Beds24 on the property page, and a tile is not a quote.
 */
export function PropertyTile({
  property,
  t,
  href,
  /** Horizontal on the homepage's single featured tile, stacked in a results grid. */
  layout = "stacked",
}: {
  property: Property;
  t: Dictionary;
  href: string;
  layout?: "stacked" | "wide";
}) {
  const area = propertyArea(property);
  const photo = (PHOTOS[property.slug] ?? [])[0];
  const km = distanceToCentre(property);

  const wide = layout === "wide";

  return (
    <Link
      href={href}
      // The hook the results map binds hover and click behaviour to. The list stays
      // server-rendered HTML; see src/components/results-map.tsx for why.
      data-map-key={property.slug}
      className={`group grid gap-5 rounded-panel border border-hairline p-4 transition-shadow hover:border-ink ${
        wide ? "sm:grid-cols-[minmax(0,320px)_1fr] sm:items-center" : ""
      }`}
    >
      <div className="relative">
        {photo ? (
          <div className="relative aspect-4/3 overflow-hidden rounded-box">
            <Image
              src={photo.src}
              alt={photo.alt || property.title}
              placeholder="blur"
              fill
              sizes={wide ? "(min-width: 640px) 320px, 100vw" : "(min-width: 900px) 380px, 100vw"}
              className="object-cover"
            />
          </div>
        ) : (
          /* aria-hidden: the fill is doing graphic work and the real heading sits below
             it. Without this a screen reader reads the property name twice. */
          <div
            aria-hidden="true"
            className={`flex aspect-4/3 flex-col justify-end rounded-box ${property.fill} p-5`}
          >
            <span
              className={`font-headline text-xl font-extrabold tracking-[-0.03em] ${property.onFill}`}
            >
              {property.title}
            </span>
            <span className={`text-[13px] ${property.onFill} opacity-80`}>{area?.name}</span>
          </div>
        )}

        <span className="absolute left-2.5 top-2.5 rounded-full bg-bg/95 px-2.5 py-1 text-[11px] font-semibold">
          {km < 10 ? km.toFixed(1) : Math.round(km)} {t.kmToCentre}
        </span>
      </div>

      <div className={wide ? "px-1 pb-3 sm:pb-0 sm:pr-5" : "px-1 pb-2"}>
        <h3 className="font-display text-lg font-bold tracking-[-0.015em]">{property.title}</h3>
        <span className="eyebrow mt-1 block">{area?.name}</span>

        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
          <div className="flex gap-1.5">
            <dt className="sr-only">{t.propertyType}</dt>
            <dd className="font-semibold text-text">
              {t[`type_${property.type}` as keyof Dictionary] ?? property.type}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt>{t.maxGuests}</dt>
            <dd className="font-semibold text-text">{property.maxGuests}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>{t.bedrooms}</dt>
            <dd className="font-semibold text-text">{property.bedrooms}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>{t.bathrooms}</dt>
            <dd className="font-semibold text-text">{property.bathrooms}</dd>
          </div>
        </dl>

        {property.fromPrice !== null ? (
          <p className="mt-3 text-[15px]">
            <span className="text-muted">{t.fromPrice} </span>
            <span className="font-display font-bold">
              {property.currency}&nbsp;{property.fromPrice.toLocaleString("en-US")}
            </span>
            <span className="text-muted"> {t.perNight}</span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}
