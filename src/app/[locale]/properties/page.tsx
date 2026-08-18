import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyFilters } from "@/components/property-filters";
import { PropertyTile } from "@/components/property-tile";
import { ResultsMap } from "@/components/results-map";
import { getDictionary } from "@/i18n";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { AREAS, cityBySlug, DEFAULT_CITY } from "@/lib/areas";
import { approxLocation } from "@/lib/property";
import { activeFilters, loosestFilter, parseSearch, searchProperties } from "@/lib/search";
import { pageMeta } from "@/lib/site";

/**
 * Level 1 of the handoff: search results.
 *
 * Rendered on the server from the query string, which is the point -- the handoff wants
 * every search state to be a URL that is shareable, bookmarkable and *indexable*. A
 * client-side filter over a static list would look identical and be invisible to a
 * crawler, which would waste the one thing area-and-type pages are good for.
 *
 * The map is not here yet. The handoff's Level 1 is a split view with a sticky map beside
 * the list, and that is staged separately because it brings a mapping library and an
 * external tile host with it. The list works without it; the map is an addition, not a
 * prerequisite.
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return pageMeta({
    title: t.metaPropertiesTitle,
    description: t.metaPropertiesDesc,
    path: "/properties",
    locale,
  });
}

export default async function PropertiesPage({
  params,
  searchParams,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;

  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale as Locale, path);

  const state = parseSearch(query);
  const city = cityBySlug(state.city) ?? DEFAULT_CITY;

  // A city we do not serve yet gets a page that says so, never an empty result list. The
  // handoff is explicit: naming a city you cannot fulfil is a deliberate signal of intent,
  // and it only works if the page then earns it.
  if (!city.live) {
    return (
      <div className="mx-auto max-w-(--container-chrome) px-5 py-20">
        <div className="mx-auto max-w-[560px] rounded-panel bg-wash-gold px-8 py-11 text-center">
          <p className="eyebrow">{t.launchingSoon}</p>
          <h1 className="mt-3 font-headline text-[clamp(26px,4vw,34px)] font-extrabold leading-tight tracking-[-0.03em]">
            {t.cityComingTitle.replace("{city}", city.name)}
          </h1>
          <p className="mx-auto mt-3.5 max-w-[420px] text-[15px] leading-relaxed text-body">
            {t.cityComingBody.replace("{city}", city.name)}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={href("/properties")} className="pill-primary">
              {t.browseChiangMai}
            </Link>
            <Link
              href={href("/contact")}
              className="rounded-full border-[1.5px] border-ink px-6 py-3.5 text-[15px] font-semibold hover:bg-ink hover:text-white"
            >
              {t.tellUsWhatYouNeed}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const results = searchProperties(state);
  // Only what the map needs, and nothing that is not serialisable across the boundary.
  const pins = results.map((property) => ({
    slug: property.slug,
    title: property.title,
    // Approximate, never the real point. See approxLocation in src/lib/property.ts.
    lat: approxLocation(property).lat,
    lng: approxLocation(property).lng,
    price: property.fromPrice,
    currency: property.currency,
  }));
  const chips = activeFilters(state);
  const relaxable = results.length === 0 ? loosestFilter(state) : null;

  return (
    <div>
      <PropertyFilters t={t} locale={locale} state={state} resultCount={results.length} />

      {/* Split view: list left, map right and sticky. The handoff's one breakpoint at
          900px -- below it the split cannot hold, so the list takes the full width and the
          map becomes a toggle inside ResultsMap. */}
      <div className="mx-auto grid max-w-(--container-chrome) gap-9 px-5 pb-18 pt-7 min-[900px]:grid-cols-[1fr_minmax(360px,42%)] min-[900px]:items-start">
        <div>
        <h1 className="font-display text-2xl font-bold tracking-[-0.015em]">
          {results.length === 1
            ? t.oneProperty
            : t.nProperties.replace("{n}", String(results.length))}
          <span className="text-muted"> · {city.name}</span>
        </h1>

        {chips.length > 0 ? (
          <p className="mt-2 text-[13px] text-muted">
            {t.filteringBy} {chips.map((chip) => chipLabel(chip, t)).join(" · ")}
          </p>
        ) : null}

        {/* auto-fill, not auto-fit. The handoff specifies auto-fit, which is right at its
            assumed scale of hundreds of units -- but auto-fit collapses empty tracks, so a
            single result stretches to the full 1440px and reads as a page that failed to
            load the rest. auto-fill keeps the empty tracks and the tile keeps its column
            width; the two behave identically once the grid is full. */}
        {results.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {results.map((property) => (
              <PropertyTile
                key={property.slug}
                property={property}
                t={t}
                href={href(`/${property.slug}`)}
              />
            ))}
          </div>
        ) : (
          /* Never a bare "no results". Name what is too tight and offer the way out. */
          <div className="mt-6 rounded-panel border border-hairline px-7 py-9">
            <h2 className="font-display text-xl font-bold tracking-[-0.015em]">
              {t.noMatchTitle}
            </h2>
            <p className="mt-2.5 max-w-[520px] text-[15px] leading-relaxed text-body">
              {relaxable
                ? (relaxable.count === 1 ? t.noMatchRelaxOne : t.noMatchRelax)
                    .replace("{filter}", t[`filter_${relaxable.key}` as keyof typeof t] ?? "")
                    .replace("{n}", String(relaxable.count))
                : t.noMatchNothing}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={href("/properties")} className="pill-primary">
                {t.clearFilters}
              </Link>
              <Link
                href={href("/contact")}
                className="rounded-full border-[1.5px] border-ink px-6 py-3.5 text-[15px] font-semibold hover:bg-ink hover:text-white"
              >
                {t.tellUsWhatYouNeed}
              </Link>
            </div>
          </div>
        )}

        </div>

        {/* Right column. Renders nothing at all when there is nothing to pin. */}
        <ResultsMap pins={pins} t={t} />
      </div>

      <div className="mx-auto max-w-(--container-chrome) px-5 pb-18">
        {/* The areas, as a second way in. The handoff removed the homepage area row and
            said the landing pages are reached from the nav, the footer and organic search
            -- this keeps a route to them from the results page too, which is where
            someone who filtered too hard actually is. */}
        <section className="mt-14 border-t border-hairline pt-8">
          <h2 className="font-display text-lg font-bold tracking-[-0.015em]">
            {t.browseByArea}
          </h2>
          <ul className="mt-3.5 flex flex-wrap gap-2">
            {AREAS.map((area) => (
              <li key={area.slug}>
                <Link
                  href={href(`/destinations/${area.slug}`)}
                  className="inline-block rounded-full border-[1.5px] border-hairline px-3.5 py-2 text-[12.5px] hover:border-ink"
                >
                  {area.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/**
 * A filter chip's human label.
 *
 * Area slugs resolve against AREAS, everything else against the dictionary. Without this
 * the summary line prints raw slugs -- "Filtering by nimman" -- which is the sort of thing
 * that reads as a bug even when the filtering itself is correct.
 */
function chipLabel(chip: { key: string; value: string }, t: ReturnType<typeof getDictionary>) {
  if (chip.key === "area") {
    return AREAS.find((area) => area.slug === chip.value)?.name ?? chip.value;
  }
  const prefix = chip.key === "type" ? "type_" : chip.key === "features" ? "feature_" : "";
  if (!prefix) return chip.value;
  return t[`${prefix}${chip.value.replace(/-/g, "_")}` as keyof typeof t] ?? chip.value;
}
