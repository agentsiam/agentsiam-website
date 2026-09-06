import { AREAS, CITY_CENTRE, DEFAULT_CITY, distanceKm } from "@/lib/areas";
import { PROPERTIES, type Property } from "@/lib/property";

/**
 * Search state, and the filtering that turns it into results.
 *
 * The handoff is emphatic that **every search state is a URL** -- shareable, bookmarkable,
 * indexable. So this module's job is to be the one place that knows how a query string
 * maps onto a set of properties, and it is deliberately pure: no fetching, no React, no
 * dates from the system clock. The page parses, filters and renders on the server, which
 * is what makes a filtered result crawlable rather than a client-side illusion.
 *
 * Availability is *not* filtered here. Dates ride along in the URL so they can be carried
 * into the property page and prefilled, but deciding whether a specific stay is free is
 * Beds24's job and happens per-property in the booking panel. Filtering a list by live
 * availability would mean an API call per property per search, and a cached answer that
 * says "available" is a promise this module is in no position to make.
 */

export const PROPERTY_TYPES = ["apartment", "townhouse", "house", "villa"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

/** Filterable amenities. English keys; the labels are translated in the dictionaries. */
export const FEATURES = [
  "pool",
  "rooftop",
  "kitchen",
  "wifi",
  "parking",
  "workspace",
  "washer",
  "pet-friendly",
] as const;

export const SORTS = ["area", "price-asc", "price-desc"] as const;
export type Sort = (typeof SORTS)[number];

/**
 * How many results a map has to have before it is worth drawing.
 *
 * The handoff is explicit that a map view earns its place at three or more properties. At
 * one pin it says nothing the tile has not already said -- the tile already carries the
 * neighbourhood and the distance to the centre -- and it costs a mapping library, an
 * external tile host and a second column to say it. Below this the results page renders no
 * map at all, and the "Show map" toggle in the filter bar goes with it rather than
 * remaining a control that does nothing.
 */
export const MAP_MIN_RESULTS = 3;

/**
 * The guest counts the filter bar offers by name. A larger number is still accepted from
 * the URL -- the homepage stepper goes to twelve -- and the select grows to include it, so
 * the control can never sit on "Any" while the search is filtering on twelve.
 */
export const GUEST_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export type SearchState = {
  city: string;
  areas: string[];
  types: PropertyType[];
  features: string[];
  bedrooms: number;
  bathrooms: number;
  guests: number;
  from: string;
  to: string;
  sort: Sort;
};

/** A query value that may arrive as a string, an array, or not at all. */
type Param = string | string[] | undefined;

function one(value: Param): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Splits `a,b,c` and keeps only values that are in the allowed set. */
function many(value: Param, allowed: readonly string[]): string[] {
  return one(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => allowed.includes(entry));
}

function count(value: Param, max = 20): number {
  const parsed = Number(one(value));
  return Number.isInteger(parsed) && parsed > 0 && parsed <= max ? parsed : 0;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reads search state out of a query string.
 *
 * Every unrecognised value is dropped rather than rejected. A search URL is something
 * people edit, share and truncate, and a hand-mangled `?beds=lots` should quietly show
 * everything rather than throw a 400 at someone who was only curious.
 */
export function parseSearch(params: Record<string, Param>): SearchState {
  return {
    city: one(params.city) || DEFAULT_CITY.slug,
    areas: many(
      params.area,
      AREAS.map((area) => area.slug),
    ),
    types: many(params.type, PROPERTY_TYPES) as PropertyType[],
    features: many(params.features, FEATURES),
    bedrooms: count(params.beds),
    bathrooms: count(params.baths),
    guests: count(params.guests),
    from: ISO_DATE.test(one(params.from)) ? one(params.from) : "",
    to: ISO_DATE.test(one(params.to)) ? one(params.to) : "",
    sort: (SORTS as readonly string[]).includes(one(params.sort))
      ? (one(params.sort) as Sort)
      : "area",
  };
}

/** Turns state back into a query string, omitting anything at its default. */
export function searchToQuery(state: Partial<SearchState>): string {
  const query = new URLSearchParams();
  if (state.city && state.city !== DEFAULT_CITY.slug) query.set("city", state.city);
  if (state.areas?.length) query.set("area", state.areas.join(","));
  if (state.types?.length) query.set("type", state.types.join(","));
  if (state.features?.length) query.set("features", state.features.join(","));
  if (state.bedrooms) query.set("beds", String(state.bedrooms));
  if (state.bathrooms) query.set("baths", String(state.bathrooms));
  if (state.guests) query.set("guests", String(state.guests));
  if (state.from) query.set("from", state.from);
  if (state.to) query.set("to", state.to);
  if (state.sort && state.sort !== "area") query.set("sort", state.sort);
  const string = query.toString();
  return string ? `?${string}` : "";
}

/** Which filters are actually narrowing the list, for the removable chips. */
export function activeFilters(state: SearchState): { key: string; value: string }[] {
  const active: { key: string; value: string }[] = [];
  for (const area of state.areas) active.push({ key: "area", value: area });
  for (const type of state.types) active.push({ key: "type", value: type });
  for (const feature of state.features) active.push({ key: "features", value: feature });
  if (state.bedrooms) active.push({ key: "beds", value: String(state.bedrooms) });
  if (state.bathrooms) active.push({ key: "baths", value: String(state.bathrooms) });
  // Guests narrows the list exactly as the others do, and leaving it out of here was how a
  // `?guests=12` search could empty the page while the summary line named no filter at all.
  if (state.guests) active.push({ key: "guests", value: String(state.guests) });
  return active;
}

function matches(property: Property, state: SearchState): boolean {
  if (property.citySlug !== state.city) return false;
  if (state.areas.length && !state.areas.includes(property.areaSlug)) return false;
  if (state.types.length && !state.types.includes(property.type)) return false;
  if (state.bedrooms && property.bedrooms < state.bedrooms) return false;
  if (state.bathrooms && property.bathrooms < state.bathrooms) return false;
  if (state.guests && property.maxGuests < state.guests) return false;
  if (state.features.length && !state.features.every((f) => property.features.includes(f))) {
    return false;
  }
  return true;
}

export function searchProperties(state: SearchState): Property[] {
  const results = PROPERTIES.filter((property) => matches(property, state));

  if (state.sort === "price-asc" || state.sort === "price-desc") {
    const direction = state.sort === "price-asc" ? 1 : -1;
    // Unpriced properties sort last either way: "from ฿—" at the top of a price sort is
    // noise, not a bargain.
    return [...results].sort((a, b) => {
      if (a.fromPrice === null) return 1;
      if (b.fromPrice === null) return -1;
      return (a.fromPrice - b.fromPrice) * direction;
    });
  }

  // Default: group by area, so the list reads as "the best of each neighbourhood" rather
  // than one area monopolising the fold.
  //
  // The handoff orders within each area by rating. There are no ratings yet -- property.ts
  // deliberately carries none, because none exist as verified data -- so within an area
  // this falls back to price. Swap it for rating when ratings are real, not before.
  const order = new Map(AREAS.map((area, index) => [area.slug, index]));
  return [...results].sort((a, b) => {
    const byArea = (order.get(a.areaSlug) ?? 99) - (order.get(b.areaSlug) ?? 99);
    if (byArea !== 0) return byArea;
    return (a.fromPrice ?? Infinity) - (b.fromPrice ?? Infinity);
  });
}

/**
 * When a search returns nothing, work out which single filter is doing the damage.
 *
 * The handoff forbids a bare "no results" and wants the page to name the culprit and
 * offer to relax it. This drops each filter in turn and reports the one that would bring
 * back the most, which is the cheapest honest version of that: it tells the guest what to
 * change rather than making them guess which of six controls is the problem.
 */
export function loosestFilter(
  state: SearchState,
): { key: keyof SearchState; count: number } | null {
  const candidates: (keyof SearchState)[] = [
    "areas",
    "types",
    "features",
    "bedrooms",
    "bathrooms",
    "guests",
  ];

  let best: { key: keyof SearchState; count: number } | null = null;
  for (const key of candidates) {
    const relaxed: SearchState = {
      ...state,
      ...(Array.isArray(state[key]) ? { [key]: [] } : { [key]: 0 }),
    };
    const found = searchProperties(relaxed).length;
    if (found > 0 && (!best || found > best.count)) best = { key, count: found };
  }
  return best;
}

/** Straight-line distance from Tha Phae Gate, for the tile badge. */
export function distanceToCentre(property: Property): number {
  return distanceKm(CITY_CENTRE, { lat: property.lat, lng: property.lng });
}
