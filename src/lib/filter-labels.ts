/**
 * The strings the results-page filter bar needs, rather than the dictionary it used to take.
 *
 * React serializes a client component's props into the RSC payload, so handing
 * `PropertyFilters` the whole `t` put all 778 keys into every `/properties` document. On
 * /th that was 190KB of a 266KB page, 71% of it, and it included every owner-facing string
 * on the site: the six service descriptions, the honest-scope block, and the Phuket and
 * Bangkok licensing paragraphs. A guest filtering by price downloaded the lot.
 *
 * `SearchLabels` in `src/components/hero-search.tsx` is the pattern and carries the same
 * measurement from the homepage. The difference here is that the filter bar also indexes
 * the dictionary dynamically, `type_villa`, `feature_pet_friendly`, `sort_price_asc`, so
 * the key list cannot be hand-written without going stale the first time a feature is
 * added. It is derived from the same arrays the component iterates, which is why this
 * lives beside them in `src/lib/` rather than in the component.
 *
 * Why its own module rather than the component file: `property-filters.tsx` is
 * `"use client"`, and a server render needs to CALL `filterLabels`, not hold a reference
 * to it. Only the type crosses the boundary, and types are erased.
 *
 * Adding a string to the filter bar means adding its key to `STATIC_KEYS`. Forgetting is a
 * typecheck failure at the component, not a blank label at runtime.
 */
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { CityNameKey } from "@/lib/areas";
import { FEATURES, PROPERTY_TYPES, SORTS } from "@/lib/search";

/**
 * Every key the bar reads by name. Ordered as the control order reads: the three fields,
 * the panel's own chrome, then the phone bar's summary line.
 */
const STATIC_KEYS = [
  "where",
  "checkIn",
  "checkOut",
  "guests",
  "any",
  "sort",
  "filters",
  "applyFilters",
  "clearFilters",
  "removeFilter",
  "close",
  "neighbourhood",
  "propertyType",
  "features",
  "bedrooms",
  "bathrooms",
  "launchingSoon",
  "oneProperty",
  "nProperties",
  "psAddDates",
  "psAnyGuests",
  "psClearAll",
  "psDateRange",
  "psGuestsN",
  "psSearchEdit",
  "psSearchGroup",
] as const;

/** "pet-friendly" names the amenity; "feature_pet_friendly" names its dictionary key. */
type Underscored<S extends string> = S extends `${infer Head}-${infer Tail}`
  ? `${Head}_${Underscored<Tail>}`
  : S;

/**
 * A key the filter bar may index. Narrow rather than `keyof Dictionary`, so the six
 * dynamic lookups in the component are checked against what this module actually ships
 * instead of against all 778 keys, which is what let the bar read a key nobody passed.
 */
export type FilterLabelKey =
  | (typeof STATIC_KEYS)[number]
  | `type_${(typeof PROPERTY_TYPES)[number]}`
  | `feature_${Underscored<(typeof FEATURES)[number]>}`
  | `sort_${Underscored<(typeof SORTS)[number]>}`
  // The "Where" control names the three cities, and `cityName` resolves them.
  | CityNameKey;

export type FilterLabels = Pick<Dictionary, FilterLabelKey>;

/** The bar's strings, picked out of the dictionary on the server. */
export function filterLabels(t: Dictionary): FilterLabels {
  const picked: Record<string, string> = {};
  for (const key of STATIC_KEYS) picked[key] = t[key];
  for (const type of PROPERTY_TYPES) picked[`type_${type}`] = t[`type_${type}`];
  for (const feature of FEATURES) {
    const key = `feature_${feature.replace(/-/g, "_")}` as FilterLabelKey;
    picked[key] = t[key];
  }
  for (const sort of SORTS) {
    const key = `sort_${sort.replace(/-/g, "_")}` as FilterLabelKey;
    picked[key] = t[key];
  }
  for (const key of ["homeCity", "cityPhuket", "cityBangkok"] as const) picked[key] = t[key];
  return picked as FilterLabels;
}
