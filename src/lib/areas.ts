/**
 * The Chiang Mai neighbourhoods AgentSiam covers.
 *
 * These are real places, and the coordinates and one-line descriptions come from the
 * design handoff's own `AS_AREAS`. That matters: the handoff's 50 properties are invented
 * and were deliberately not imported, but the areas are not invented, so an area page can
 * carry honest content long before there is a single property in it.
 *
 * Which is the whole reason these pages can exist ahead of inventory. `/destinations/nimman`
 * saying "here is what Nimman is like, we do not manage anything here yet" is true and
 * useful. A property tile claiming a house we do not manage would not be.
 *
 * The city is a separate axis. The handoff's search offers three cities where only one is
 * live, on the argument that naming a city you cannot yet serve is a deliberate signal of
 * intent -- but only if the resulting page says so plainly rather than returning nothing.
 */

export type Area = {
  slug: string;
  name: string;
  /** One line on what the neighbourhood is actually like. Shown under the name. */
  vibe: string;
  /** Centre point, for the map and for distance-from-centre badges. */
  lat: number;
  lng: number;
  /** Rough radius in degrees, used to frame the map on this area. */
  radius: number;
};

export const AREAS: Area[] = [
  {
    slug: "nimman",
    name: "Nimman",
    vibe: "cafés, co-working and the city's design district",
    lat: 18.7963,
    lng: 98.9673,
    radius: 0.01,
  },
  {
    slug: "old-city",
    name: "Old City",
    vibe: "inside the moat, temples and the Sunday walking street",
    lat: 18.7883,
    lng: 98.9853,
    radius: 0.008,
  },
  {
    slug: "santitham",
    name: "Santitham",
    vibe: "local markets, quieter streets, walkable to Nimman",
    lat: 18.8005,
    lng: 98.979,
    radius: 0.008,
  },
  {
    slug: "chang-khlan",
    name: "Chang Khlan",
    vibe: "Night Bazaar, riverside restaurants, close to everything",
    lat: 18.7808,
    lng: 98.999,
    radius: 0.008,
  },
  {
    slug: "riverside",
    name: "Riverside",
    vibe: "along the Ping, slower pace, garden houses",
    lat: 18.79,
    lng: 99.002,
    radius: 0.01,
  },
  {
    slug: "hang-dong",
    name: "Hang Dong",
    vibe: "pool villas, space and mountain views south of town",
    lat: 18.689,
    lng: 98.921,
    radius: 0.03,
  },
  {
    slug: "mae-rim",
    name: "Mae Rim",
    vibe: "valley resorts and rice fields north of the city",
    lat: 18.916,
    lng: 98.894,
    radius: 0.035,
  },
  {
    slug: "san-sai",
    name: "San Sai",
    vibe: "suburban, family houses, near the international schools",
    lat: 18.858,
    lng: 99.045,
    radius: 0.03,
  },
];

export function areaBySlug(slug: string): Area | undefined {
  return AREAS.find((area) => area.slug === slug);
}

/** Tha Phae Gate. The handoff measures "distance to the centre" from here. */
export const CITY_CENTRE = { lat: 18.7876, lng: 98.9931 };

/**
 * Straight-line kilometres between two points.
 *
 * Deliberately the crow-flies figure, not a routed one. A tile badge saying "1.2 km to the
 * centre" is answering "roughly where is this", and pulling a routing service in to make
 * that one number slightly truer would be a network call per tile for no real gain.
 */
export function distanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const EARTH_RADIUS_KM = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(a));
}

// -- cities ----------------------------------------------------------------------
//
// The search's "Where" is city-level. Only Chiang Mai returns results; the other two are
// selectable and land on a page that names what is coming and offers one action. The
// handoff is explicit that an unexplained empty result would read as a broken site, so a
// city that is not live must never silently return nothing.

export type City = {
  slug: string;
  name: string;
  live: boolean;
};

export const CITIES: City[] = [
  { slug: "chiang-mai", name: "Chiang Mai", live: true },
  { slug: "bangkok", name: "Bangkok", live: false },
  { slug: "phuket", name: "Phuket", live: false },
];

export function cityBySlug(slug: string): City | undefined {
  return CITIES.find((city) => city.slug === slug);
}

export const DEFAULT_CITY = CITIES[0];
