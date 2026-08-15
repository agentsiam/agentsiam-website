/**
 * The properties AgentSiam manages, as one source.
 *
 * The design handoff insists the host and review data behind the homepage rail and the
 * property page come from a single source so the two cannot drift apart. This is that
 * source. It ships with real data for the one property that exists; the handoff's 50
 * Chiang Mai listings are invented and are deliberately not imported -- the design's whole
 * argument is that nothing on the site is a claim a reader could not check.
 *
 * Nothing here is a rating, a price or a photograph, because none of those exist yet as
 * verified data. Add them when they do, rather than filling the shape.
 */

import { AREAS, type Area } from "@/lib/areas";

export type Property = {
  slug: string;
  title: string;
  tagline: string;
  /** Area slug, resolved against src/lib/areas.ts. One spelling of a neighbourhood. */
  areaSlug: string;
  /**
   * Which city, so search can filter without guessing from the address. Only Chiang Mai
   * is live; see CITIES.
   */
  citySlug: string;
  /** Where the pin goes, and what the distance-to-centre badge is measured from. */
  lat: number;
  lng: number;
  /**
   * Property type, from the handoff's filter vocabulary: apartment, townhouse, house or
   * villa. English is the key, so filtering stays language-independent.
   */
  type: "apartment" | "townhouse" | "house" | "villa";
  bedrooms: number;
  bathrooms: number;
  /**
   * Nightly rate floor, for the "from ฿x" on a tile. A guide only: the real number for a
   * real stay comes from Beds24 via /api/booking/quote, and nothing here is ever shown as
   * a total.
   */
  fromPrice: number | null;
  /** Filterable amenities, English keys for the same reason as `type`. */
  features: string[];
  /**
   * Beds24's own identifiers for this property. Not secrets -- the property ID is in the
   * public booking-page URL -- so they live here with the rest of the property's facts
   * rather than in an env var. The refresh token is the secret, and that is the only
   * Beds24 value that is one.
   */
  beds24: { propertyId: number; roomId: number };
  /** ISO 4217, as configured on the Beds24 property. Prices are quoted in it. */
  currency: string;
  /** Occupancy and stay rules, mirroring the Beds24 room so the UI can validate early. */
  maxGuests: number;
  minStay: number;
  /** Tailwind background class for the tile fill. Solid brand colour, not a photo. */
  fill: string;
  /** Text colour that meets contrast on `fill`. */
  onFill: string;
  facts: { label: string; value: string }[];
  description: string[];
  address: string;
  checkIn: string;
  checkOut: string;
  houseRules: string[];
  reviews: { quote: string; source: string }[];
};

export const LOTUS_HOUSE: Property = {
  slug: "lotushouse",
  title: "Lotus House",
  tagline: "Your base for adventure and local living in Chiang Mai",
  areaSlug: "chang-khlan",
  citySlug: "chiang-mai",
  // The Beds24 property record carries these; copied here so a map pin and a distance
  // badge do not need an API call.
  lat: 18.769995,
  lng: 98.992787,
  type: "townhouse",
  bedrooms: 2,
  bathrooms: 2,
  fromPrice: 3400,
  features: ["rooftop", "kitchen", "wifi", "smart-tv", "parking", "safe", "soaking-tub"],
  // Room "2 Bed Room / 3-floor Entire Townhouse". One room type, one unit.
  beds24: { propertyId: 275645, roomId: 576144 },
  currency: "THB",
  // Both read off the Beds24 room. They are duplicated here so the panel can reject an
  // impossible stay before spending an API call, not so the site can decide the rules:
  // Beds24 still has the final say on every quote and every request.
  maxGuests: 4,
  minStay: 2,
  fill: "bg-primary",
  onFill: "text-white",
  facts: [
    { label: "Guests", value: "4+" },
    { label: "Bedrooms", value: "2" },
    { label: "Beds", value: "2 king" },
    { label: "Bathrooms", value: "2" },
    { label: "Kitchen", value: "1" },
    { label: "Rooftop", value: "1" },
  ],
  description: [
    "Lotus House is your base for adventure and local living in Chiang Mai. Tucked on a quiet street among friendly neighbors, this three-story home blends comfort with character, offering spacious rooms and a rooftop terrace to relax after exploring the city's vibrant markets, temples, and nightlife.",
    "Lotus House features two king bedrooms, a back bedroom with patio, three dining spaces (indoor table, kitchen island, and rooftop terrace), a fully equipped kitchen, and a rooftop soaking tub. Fast Wi-Fi, smart TV, and a safety box are included. Garage parking and motorbike rental are available, with a 7/11 just a 5-minute walk away.",
  ],
  address:
    "42 Soi 1, Tambon Chang Khlan, Amphoe Mueang Chiang Mai, Chang Wat Chiang Mai 50100, Thailand",
  checkIn: "15:00",
  checkOut: "12:00",
  houseRules: [
    "Pets not allowed",
    "Not suitable for individuals with limited mobility",
    "Wheelchair inaccessible",
  ],
  reviews: [
    {
      quote:
        "This was hands down one of the best Airbnbs my husband and I have ever stayed in. From the moment we walked in, it felt like home…",
      source: "Airbnb guest review",
    },
  ],
};

export const PROPERTIES: Property[] = [LOTUS_HOUSE];

/**
 * The area a property sits in.
 *
 * Returns the Area object rather than a name so callers get the vibe line, the
 * coordinates and the slug together -- and so a neighbourhood is spelled in exactly one
 * place. Undefined only if a property names an area that does not exist, which is a data
 * error worth surfacing rather than papering over with a fallback string.
 */
export function propertyArea(property: Property): Area | undefined {
  return AREAS.find((area) => area.slug === property.areaSlug);
}

/** Properties in a given area. Empty is a normal answer, not an error. */
export function propertiesInArea(areaSlug: string): Property[] {
  return PROPERTIES.filter((property) => property.areaSlug === areaSlug);
}
