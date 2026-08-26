import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyTile } from "@/components/property-tile";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, LOCALES, type Locale } from "@/i18n/config";
import { AREAS, areaBySlug, CITY_CENTRE, distanceKm } from "@/lib/areas";
import { propertiesInArea } from "@/lib/property";
import { searchToQuery } from "@/lib/search";
import { pageMeta } from "@/lib/site";
import { areaVibe } from "@/i18n/area-vibe";

/**
 * One neighbourhood.
 *
 * Prerendered for every area in every language, because these are the pages organic search
 * is meant to land on -- "where to stay in Nimman" is a question people type, and the
 * answer should be a served HTML page rather than something a crawler has to run
 * JavaScript to see.
 *
 * The empty state is the important part of this page today. Seven of the eight areas have
 * nothing in them, and a page that just stops would read as broken. So an empty area still
 * carries its own description, says plainly that we manage nothing there yet, and offers
 * the two things that are actually useful: everything we do have, and a way to ask.
 */

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => AREAS.map((area) => ({ locale, area: area.slug })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/destinations/[area]">): Promise<Metadata> {
  const { locale, area: slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const area = areaBySlug(slug);
  if (!area) notFound();

  return pageMeta({
    title: t.metaAreaTitle.replace("{area}", area.name),
    description: t.metaAreaDesc.replace("{area}", area.name).replace("{vibe}", areaVibe(t, area)),
    path: `/destinations/${area.slug}`,
    locale,
  });
}

export default async function AreaPage({
  params,
}: PageProps<"/[locale]/destinations/[area]">) {
  const { locale, area: slug } = await params;
  if (!isLocale(locale)) notFound();
  const area = areaBySlug(slug);
  if (!area) notFound();

  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);
  const properties = propertiesInArea(area.slug);
  const km = distanceKm(CITY_CENTRE, { lat: area.lat, lng: area.lng });

  return (
    <div className="mx-auto max-w-(--container-chrome) px-5 pb-18 pt-9">
      <nav aria-label="Breadcrumb" className="eyebrow">
        <Link href={href("/destinations")} className="hover:text-primary">
          {t.navDestinations}
        </Link>{" "}
        · Chiang Mai
      </nav>

      <h1 className="mt-3 font-headline text-[clamp(28px,5vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
        {area.name}
      </h1>
      <p className="mt-2.5 max-w-[560px] text-base leading-relaxed text-body">
        {areaVibe(t, area)}
      </p>
      <p className="mt-2 text-[13px] text-muted">
        {t.kmToCentre.replace("{n}", km < 10 ? km.toFixed(1) : String(Math.round(km)))}
      </p>

      {properties.length > 0 ? (
        <section className="mt-9">
          <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
            {properties.length === 1
              ? t.oneProperty
              : t.nProperties.replace("{n}", String(properties.length))}
          </h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {properties.map((property) => (
              <PropertyTile
                key={property.slug}
                property={property}
                t={t}
                href={href(`/${property.slug}`)}
              />
            ))}
          </div>
        </section>
      ) : (
        /* Honest, not apologetic, and never a dead end. */
        <section className="mt-9 rounded-panel border border-hairline px-7 py-9">
          <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
            {t.areaEmptyTitle.replace("{area}", area.name)}
          </h2>
          <p className="mt-2.5 max-w-[520px] text-[15px] leading-relaxed text-body">
            {t.areaEmptyBody}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={href("/properties")} className="pill-primary">
              {t.seeEverything}
            </Link>
            <Link
              href={href("/contact")}
              className="rounded-full border-[1.5px] border-ink px-6 py-3.5 text-[15px] font-semibold hover:bg-ink hover:text-white"
            >
              {t.tellUsWhatYouNeed}
            </Link>
          </div>
        </section>
      )}

      {/* The other neighbourhoods, so this page is a junction rather than a cul-de-sac. */}
      <section className="mt-14 border-t border-hairline pt-8">
        <h2 className="font-display text-lg font-bold tracking-[-0.015em]">
          {t.otherAreas}
        </h2>
        <ul className="mt-3.5 flex flex-wrap gap-2">
          {AREAS.filter((other) => other.slug !== area.slug).map((other) => (
            <li key={other.slug}>
              <Link
                href={href(`/destinations/${other.slug}`)}
                className="inline-block rounded-full border-[1.5px] border-hairline px-3.5 py-2 text-[12.5px] hover:border-ink"
              >
                {other.name}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={href("/properties") + searchToQuery({ areas: [area.slug] })}
              className="inline-block rounded-full bg-surface px-3.5 py-2 text-[12.5px] hover:bg-surface-2"
            >
              {t.searchThisArea.replace("{area}", area.name)}
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
