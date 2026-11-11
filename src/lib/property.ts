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
import type { Dictionary } from "@/i18n";

export type Property = {
  slug: string;
  /**
   * Filename fragment of the photo a tile leads with, where the manifest's first photo is
   * wrong for a lead role. Unset means the manifest's first photo, as before.
   */
  coverPhoto?: string;
  title: string;
  /** Area slug, resolved against src/lib/areas.ts. One spelling of a neighbourhood. */
  areaSlug: string;
  /**
   * Which city, so search can filter without guessing from the address. Only Chiang Mai
   * is live; see CITIES.
   */
  citySlug: string;
  /**
   * A public point a few hundred metres from the house, never the house. Where the map pin
   * goes and what the distance-to-centre badge is measured from. This module reaches the
   * browser through client components, so an exact coordinate here is published in the
   * JavaScript of every page. Exact coordinates are booking-confirmation material
   * (as-context/03-systems/property-profile-schema.md in the consulting repo) and live in
   * the property profile and Beds24, not here. Paul, 08/11/2026.
   */
  lat: number;
  lng: number;
  /**
   * Property type, from the handoff's filter vocabulary: apartment, townhouse, house or
   * villa. English is the key, so filtering stays language-independent.
   */
  type: "apartment" | "townhouse" | "house" | "villa";
  bedrooms: number;
  /**
   * Null where the profile does not state one, for the same reason as `maxGuests`:
   * the tile then prints no bathroom count and the bathroom filter does not exclude
   * the house, rather than publishing a number nobody gave.
   */
  bathrooms: number | null;
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
   *
   * Null for a house listed for enquiry only: not in Beds24 yet, so no price, no booking
   * panel, and its tile says it is not open for booking rather than showing a rate.
   */
  beds24: { propertyId: number; roomId: number } | null;
  /** ISO 4217, as configured on the Beds24 property. Prices are quoted in it. */
  currency: string;
  /**
   * Occupancy and stay rules, mirroring the Beds24 room so the UI can validate early.
   * `maxGuests` is null where the profile does not state it: the tile then prints no guest
   * count and the guest filter does not exclude the house, rather than a number nobody gave.
   */
  maxGuests: number | null;
  minStay: number;
  /**
   * Longest stay bookable online. Not a limit on what we will accept: longer stays are
   * priced by hand and go through enquiry, and this is what stops one request from
   * holding a year of nights.
   */
  maxStay: number;
  /**
   * Driving times from the door to named places, measured on a route rather than looked
   * up, from the property profile's `proximity` block. Absent where nothing is measured.
   */
  nearby?: { labelKey: keyof Dictionary; driveMinutes: number; km: number }[];
  /** Tailwind background class for the tile fill. Solid brand colour, not a photo. */
  fill: string;
  /** Text colour that meets contrast on `fill`. */
  onFill: string;
  /**
   * The facts strip. Labels are dictionary keys and so are the values that are words
   * rather than numbers, because until 06/09/2026 both were English literals here and
   * rendered "Guests / Bedrooms / Beds / 2 king" on /th and /zh, on two pages.
   */
  facts: { labelKey: keyof Dictionary; value?: string; valueKey?: keyof Dictionary }[];
  /** Dictionary keys, one per paragraph. Same reason as `facts`. */
  descriptionKeys: (keyof Dictionary)[];
  /** Dictionary key for the one-line pitch under the title. */
  taglineKey: keyof Dictionary;
  /** Null until the profile asserts one. */
  address: string | null;
  checkIn: string;
  checkOut: string;
  /** Dictionary keys. These sit in the same list as the localised safety line, so an
   *  English literal here rendered the list half Thai and half English. */
  houseRuleKeys: (keyof Dictionary)[];
  /**
   * A guest's own words, in the language they wrote them. Deliberately NOT a dictionary
   * key: a review translated is no longer the review, and a quote a reader cannot trace
   * to a platform is worth nothing. It carries `lang` at the point of use instead.
   */
  reviews: { quote: string; lang: string; source: string }[];
  /**
   * The platform's overall guest rating, as given and dated. No review count is held, so
   * no count is shown and no rating structured data is published: Google requires a count
   * for that markup. Update `givenOn` whenever the value is re-read.
   */
  rating?: { value: number; source: string; givenOn: string };
};

export const LOTUS_HOUSE = {
  slug: "lotushouse",
  // The living room, as the homepage hero. The manifest's first frame is the rooftop tub with a
  // guest and a beer, ruled out of lead roles by the 18/08/2026 photo QA; Paul, 06/11/2026.
  coverPhoto: "20240411_052358",
  title: "Lotus House",
  taglineKey: "lotusTagline",
  areaSlug: "chang-khlan",
  citySlug: "chiang-mai",
  // Public point, not the house: see the type.
  lat: 18.767,
  lng: 98.9943,
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
  maxStay: 90,
  fill: "bg-primary",
  onFill: "text-white",
  facts: [
    { labelKey: "guests", value: "4" },
    { labelKey: "bedrooms", value: "2" },
    { labelKey: "beds", valueKey: "twoKingBeds" },
    { labelKey: "bathrooms", value: "2" },
    { labelKey: "factKitchen", value: "1" },
    { labelKey: "factRooftop", value: "1" },
  ],
  descriptionKeys: ["lotusDesc1", "lotusDesc2"],
  // Not here: this module reaches the browser. The address lives in the property profile
  // and Beds24 and goes out in the booking confirmation. Paul, 08/11/2026.
  address: null,
  checkIn: "15:00",
  checkOut: "12:00",
  houseRuleKeys: ["ruleNoPets", "ruleLimitedMobility", "ruleWheelchair"],
  // Paul, 07/11/2026: "my rating is 4.8 on AirBnB". Not re-read from the listing here.
  rating: { value: 4.8, source: "Airbnb", givenOn: "2026-11-07" },
  reviews: [
    {
      quote:
        "This was hands down one of the best Airbnbs my husband and I have ever stayed in. From the moment we walked in, it felt like home…",
      lang: "en",
      source: "Airbnb guest review",
    },
  ],
} satisfies Property & { beds24: NonNullable<Property["beds24"]> };

/**
 * Listed for enquiry only: not in Beds24 yet, so no IDs, no price and no booking panel.
 * It is in PROPERTIES, so search, the map, the area pages and the sitemap show it, and its
 * tile says it is not open for booking. Every value here is a field the property profile
 * asserts; the rest waits for the walkthrough rather than being filled.
 */
export const COSMOS_HOUSE: Property = {
  slug: "cosmoshouse",
  title: "Cosmos House",
  taglineKey: "cosmosTagline",
  areaSlug: "chang-khlan",
  citySlug: "chiang-mai",
  // Public point, not the house: see the type.
  lat: 18.7663,
  lng: 98.9927,
  type: "townhouse",
  bedrooms: 2,
  bathrooms: 2,
  fromPrice: null,
  features: ["rooftop", "kitchen", "wifi", "smart-tv", "workspace", "washer", "parking", "safe", "soaking-tub"],
  beds24: null,
  currency: "THB",
  maxGuests: 4,
  minStay: 2,
  // Only the booking flow reads this, and it reads Lotus House's. Matches Lotus House's
  // until Cosmos House has a Beds24 room of its own.
  maxStay: 90,
  fill: "bg-primary",
  onFill: "text-white",
  facts: [
    { labelKey: "guests", value: "4" },
    { labelKey: "bedrooms", value: "2" },
    { labelKey: "beds", valueKey: "twoKingBeds" },
    { labelKey: "bathrooms", value: "2" },
    { labelKey: "factKitchen", value: "1" },
    { labelKey: "factRooftop", value: "1" },
  ],
  descriptionKeys: ["cosmosDesc1", "cosmosDesc2"],
  address: null,
  checkIn: "15:00",
  checkOut: "12:00",
  houseRuleKeys: ["ruleNoPets", "ruleNoSmokingIndoors", "ruleNoEvents"],
  reviews: [],
};

/**
 * Listed for enquiry only, like Cosmos House: not in Beds24, no price, no booking panel.
 * Every value is a field in
 * as-operations/properties/pending_MaeRimHouse/MaeRimHouse-property-profile.md, which was
 * written from the owner's advert; what the advert does not say is left out rather than
 * filled.
 */
export const MAE_RIM_HOUSE: Property = {
  slug: "maerimhouse",
  title: "Mae Rim House",
  taglineKey: "maeRimTagline",
  areaSlug: "mae-rim",
  citySlug: "chiang-mai",
  // Public point, not the house: see the type.
  lat: 19.0387,
  lng: 98.9453,
  type: "house",
  bedrooms: 2,
  bathrooms: 2,
  fromPrice: null,
  features: ["kitchen", "workspace", "washer", "parking"],
  beds24: null,
  currency: "THB",
  maxGuests: null,
  // Only the booking flow reads these, and it reads Lotus House's. Matches Cosmos House
  // until Mae Rim House has a Beds24 room of its own.
  minStay: 2,
  maxStay: 90,
  nearby: [
    { labelKey: "nearRajabhatMaeRim", driveMinutes: 7, km: 4.1 },
    { labelKey: "nearTaweerotMarket", driveMinutes: 7, km: 3.1 },
    { labelKey: "nearPremSchool", driveMinutes: 21, km: 16.9 },
    { labelKey: "nearKadFarangMaeRim", driveMinutes: 26, km: 20.9 },
  ],
  fill: "bg-primary",
  onFill: "text-white",
  facts: [
    { labelKey: "bedrooms", value: "2" },
    { labelKey: "bathrooms", value: "2" },
    { labelKey: "factWorkRoom", value: "1" },
    { labelKey: "factLivingArea", valueKey: "maeRimLivingAreaValue" },
    { labelKey: "factLand", valueKey: "maeRimLandValue" },
    { labelKey: "factParking", valueKey: "maeRimParkingValue" },
  ],
  descriptionKeys: ["maeRimDesc1", "maeRimDesc2"],
  address: null,
  checkIn: "",
  checkOut: "",
  houseRuleKeys: [],
  reviews: [],
};

/**
 * K. Mike's pool villas, listed for enquiry only as Cosmos House and Mae Rim House are: no
 * Beds24 room, no booking panel, no quote.
 *
 * They carry a price where those two do not. `fromPrice` is 9000 on every one of them,
 * which is the floor of the 9,000 to 18,000 a night the owner advertises across the whole
 * collection rather than a figure for any single villa. Paul set it on 11/11/2026 knowing
 * that, and the tile says "by enquiry only" under the price so a reader is not shown a rate
 * that looks bookable.
 *
 * Courtyard, Jasmine and Silver Oak are three units in one development in Chang Khian and
 * share a street address and a map pin. The public point below is deliberately identical on
 * all three: they are in one place, and separating them on the map would draw a distinction
 * that does not exist.
 *
 * Every value here is a field in that villa's property profile in the consulting repo under
 * as-operations/properties/. What the profile does not assert is not here.
 *
 * `nearby` is the profile's `proximity` block: driving times routed on 11/11/2026 from the
 * public point above, never from the house, against the same OSRM hosts the guide build
 * uses. The three Chang Khian villas share one set because they share one address.
 *
 * Every one of them carries the same safety disclosure, `villaPoolSupervision`, which the
 * page prints under "Limits to know before booking". It is the private-pool-supervision
 * entry in each profile. It says nothing about whether a pool is fenced because no source
 * states it; the day the owner answers, the profile changes and that string with it.
 */
export const COURTYARD_VILLA: Property = {
  slug: "courtyardvilla",
  title: "Courtyard Villa",
  taglineKey: "courtyardTagline",
  areaSlug: "chang-khian",
  // Public point, not the house: see the type. The development sits a few hundred metres
  // south-west of it.
  lat: 18.8265,
  lng: 98.959,
  citySlug: "chiang-mai",
  type: "villa",
  fromPrice: 9000,
  beds24: null,
  currency: "THB",
  // Only the booking flow reads these and it reads Lotus House's. They match Cosmos House's
  // until this villa has a Beds24 room of its own.
  minStay: 2,
  maxStay: 90,
  fill: "bg-primary",
  onFill: "text-white",
  address: null,
  // What the owner advertises, from his own post, not an agreed AgentSiam time. The
  // cleaning file for each unit deliberately still carries AgentSiam's 15:00 and 12:00.
  checkIn: "14:00",
  checkOut: "11:00",
  houseRuleKeys: [],
  reviews: [],
  bedrooms: 3,
  // The owner's own Airbnb listing for this villa states both, read 11/11/2026. They
  // replace an estimate that was materially wrong in each direction.
  bathrooms: 3.5,
  maxGuests: 9,
  features: ["pool", "garden", "kitchen", "bbq", "wifi", "tv"],
  facts: [
    { labelKey: "guests", value: "9" },
    { labelKey: "bedrooms", value: "3" },
    { labelKey: "beds", valueKey: "threeDoubleBeds" },
    { labelKey: "bathrooms", value: "3.5" },
    { labelKey: "factPool", value: "1" },
  ],
  nearby: [
    { labelKey: "nearNimmanhaemin", driveMinutes: 7, km: 4.9 },
    { labelKey: "nearMaya", driveMinutes: 6, km: 4.3 },
    { labelKey: "nearThaPhaeGate", driveMinutes: 11, km: 7.3 },
    { labelKey: "nearCnxAirport", driveMinutes: 17, km: 11.4 },
  ],
  rating: { value: 4.75, source: "Airbnb", givenOn: "2026-11-11" },
  descriptionKeys: ["courtyardDesc1", "courtyardDesc2"],
};

export const JASMINE_VILLA: Property = {
  slug: "jasminevilla",
  title: "Jasmine Villa",
  taglineKey: "jasmineTagline",
  areaSlug: "chang-khian",
  lat: 18.8265,
  lng: 98.959,
  citySlug: "chiang-mai",
  type: "villa",
  fromPrice: 9000,
  beds24: null,
  currency: "THB",
  // Only the booking flow reads these and it reads Lotus House's. They match Cosmos House's
  // until this villa has a Beds24 room of its own.
  minStay: 2,
  maxStay: 90,
  fill: "bg-primary",
  onFill: "text-white",
  address: null,
  // What the owner advertises, from his own post, not an agreed AgentSiam time. The
  // cleaning file for each unit deliberately still carries AgentSiam's 15:00 and 12:00.
  checkIn: "14:00",
  checkOut: "11:00",
  houseRuleKeys: [],
  reviews: [],
  bedrooms: 3,
  // The owner's own Airbnb listing for this villa states both, read 11/11/2026. They
  // replace an estimate that was materially wrong in each direction.
  bathrooms: 3.5,
  maxGuests: 9,
  features: ["pool", "kitchen", "bbq", "wifi", "tv"],
  facts: [
    { labelKey: "guests", value: "9" },
    { labelKey: "bedrooms", value: "3" },
    { labelKey: "beds", valueKey: "threeDoubleBeds" },
    { labelKey: "bathrooms", value: "3.5" },
    { labelKey: "factPool", value: "1" },
  ],
  nearby: [
    { labelKey: "nearNimmanhaemin", driveMinutes: 7, km: 4.9 },
    { labelKey: "nearMaya", driveMinutes: 6, km: 4.3 },
    { labelKey: "nearThaPhaeGate", driveMinutes: 11, km: 7.3 },
    { labelKey: "nearCnxAirport", driveMinutes: 17, km: 11.4 },
  ],
  rating: { value: 5.0, source: "Airbnb", givenOn: "2026-11-11" },
  descriptionKeys: ["jasmineDesc1", "jasmineDesc2"],
};

export const SILVER_OAK_VILLA: Property = {
  slug: "silveroakvilla",
  title: "Silver Oak Villa",
  taglineKey: "silverOakTagline",
  areaSlug: "chang-khian",
  lat: 18.8265,
  lng: 98.959,
  citySlug: "chiang-mai",
  type: "villa",
  fromPrice: 9000,
  beds24: null,
  currency: "THB",
  // Only the booking flow reads these and it reads Lotus House's. They match Cosmos House's
  // until this villa has a Beds24 room of its own.
  minStay: 2,
  maxStay: 90,
  fill: "bg-primary",
  onFill: "text-white",
  address: null,
  // What the owner advertises, from his own post, not an agreed AgentSiam time. The
  // cleaning file for each unit deliberately still carries AgentSiam's 15:00 and 12:00.
  checkIn: "14:00",
  checkOut: "11:00",
  houseRuleKeys: [],
  reviews: [],
  bedrooms: 3,
  // The owner's own Airbnb listing for this villa states both, read 11/11/2026. They
  // replace an estimate that was materially wrong in each direction.
  bathrooms: 4,
  maxGuests: 10,
  features: ["pool", "garden", "kitchen", "bbq", "wifi", "tv"],
  facts: [
    { labelKey: "guests", value: "10" },
    { labelKey: "bedrooms", value: "3" },
    { labelKey: "beds", valueKey: "threeKingBeds" },
    { labelKey: "bathrooms", value: "4" },
    { labelKey: "factPool", value: "1" },
  ],
  nearby: [
    { labelKey: "nearNimmanhaemin", driveMinutes: 7, km: 4.9 },
    { labelKey: "nearMaya", driveMinutes: 6, km: 4.3 },
    { labelKey: "nearThaPhaeGate", driveMinutes: 11, km: 7.3 },
    { labelKey: "nearCnxAirport", driveMinutes: 17, km: 11.4 },
  ],
  rating: { value: 4.64, source: "Airbnb", givenOn: "2026-11-11" },
  descriptionKeys: ["silverOakDesc1", "silverOakDesc2"],
};

export const MID_CENTURY_VILLA: Property = {
  slug: "midcenturyvilla",
  title: "Mid-Century Villa",
  taglineKey: "midCenturyTagline",
  areaSlug: "chang-phueak",
  // Public point, not the house: see the type.
  lat: 18.818,
  lng: 98.969,
  citySlug: "chiang-mai",
  type: "villa",
  fromPrice: 9000,
  beds24: null,
  currency: "THB",
  // Only the booking flow reads these and it reads Lotus House's. They match Cosmos House's
  // until this villa has a Beds24 room of its own.
  minStay: 2,
  maxStay: 90,
  fill: "bg-primary",
  onFill: "text-white",
  address: null,
  // What the owner advertises, from his own post, not an agreed AgentSiam time. The
  // cleaning file for each unit deliberately still carries AgentSiam's 15:00 and 12:00.
  checkIn: "14:00",
  checkOut: "11:00",
  houseRuleKeys: [],
  reviews: [],
  bedrooms: 3,
  // The owner's own Airbnb listing for this villa states both, read 11/11/2026. They
  // replace an estimate that was materially wrong in each direction.
  bathrooms: 4,
  maxGuests: 9,
  features: ["pool", "kitchen", "bbq", "wifi", "tv"],
  facts: [
    { labelKey: "guests", value: "9" },
    { labelKey: "bedrooms", value: "3" },
    { labelKey: "beds", valueKey: "threeBedsUnstated" },
    { labelKey: "bathrooms", value: "4" },
    { labelKey: "factPool", value: "1" },
  ],
  nearby: [
    { labelKey: "nearNimmanhaemin", driveMinutes: 6, km: 4.1 },
    { labelKey: "nearMaya", driveMinutes: 6, km: 3.4 },
    { labelKey: "nearThaPhaeGate", driveMinutes: 11, km: 6.3 },
    { labelKey: "nearCnxAirport", driveMinutes: 17, km: 10.5 },
  ],
  rating: { value: 5.0, source: "Airbnb", givenOn: "2026-11-11" },
  descriptionKeys: ["midCenturyDesc1", "midCenturyDesc2"],
};

export const ATRIUM_VILLA: Property = {
  slug: "atriumvilla",
  title: "Atrium Villa",
  taglineKey: "atriumTagline",
  areaSlug: "pa-daet",
  // Public point, not the house: see the type.
  lat: 18.7572,
  lng: 98.976,
  citySlug: "chiang-mai",
  type: "villa",
  fromPrice: 9000,
  beds24: null,
  currency: "THB",
  // Only the booking flow reads these and it reads Lotus House's. They match Cosmos House's
  // until this villa has a Beds24 room of its own.
  minStay: 2,
  maxStay: 90,
  fill: "bg-primary",
  onFill: "text-white",
  address: null,
  // What the owner advertises, from his own post, not an agreed AgentSiam time. The
  // cleaning file for each unit deliberately still carries AgentSiam's 15:00 and 12:00.
  checkIn: "14:00",
  checkOut: "11:00",
  houseRuleKeys: [],
  reviews: [],
  bedrooms: 4,
  // The owner's own Airbnb listing for this villa states both, read 11/11/2026. They
  // replace an estimate that was materially wrong in each direction.
  bathrooms: 5,
  maxGuests: 12,
  features: ["pool", "garden", "kitchen", "bbq", "wifi", "tv"],
  facts: [
    { labelKey: "guests", value: "12" },
    { labelKey: "bedrooms", value: "4" },
    { labelKey: "beds", valueKey: "fourKingOrQueenBeds" },
    { labelKey: "bathrooms", value: "5" },
    { labelKey: "factPool", value: "1" },
  ],
  nearby: [
    { labelKey: "nearCentralAirport", driveMinutes: 5, km: 3.9 },
    { labelKey: "nearCnxAirport", driveMinutes: 8, km: 5.4 },
    { labelKey: "nearThaPhaeGate", driveMinutes: 10, km: 7.3 },
    { labelKey: "nearNimmanhaemin", driveMinutes: 10, km: 7.6 },
  ],
  rating: { value: 4.25, source: "Airbnb", givenOn: "2026-11-11" },
  descriptionKeys: ["atriumDesc1", "atriumDesc2"],
};

export const GARDEN_VILLA: Property = {
  slug: "gardenvilla",
  title: "Garden Villa",
  taglineKey: "gardenTagline",
  areaSlug: "pa-daet",
  // Public point, not the house, and deliberately the same one as Atrium Villa: this is
  // 89/1 Pa Daet Road and that is 89, so they are neighbours and a separate point would
  // draw a distinction the street numbers do not support.
  lat: 18.7572,
  lng: 98.976,
  citySlug: "chiang-mai",
  type: "villa",
  fromPrice: 9000,
  beds24: null,
  currency: "THB",
  // Only the booking flow reads these and it reads Lotus House's. They match Cosmos House's
  // until this villa has a Beds24 room of its own.
  minStay: 2,
  maxStay: 90,
  fill: "bg-primary",
  onFill: "text-white",
  address: null,
  // What the owner advertises, from his own post, not an agreed AgentSiam time. The
  // cleaning file for each unit deliberately still carries AgentSiam's 15:00 and 12:00.
  checkIn: "14:00",
  checkOut: "11:00",
  houseRuleKeys: [],
  reviews: [],
  bedrooms: 4,
  // The owner's own Airbnb listing for this villa states both, read 11/11/2026.
  bathrooms: 5,
  maxGuests: 12,
  features: ["pool", "garden", "kitchen", "bbq", "wifi", "tv"],
  nearby: [
    { labelKey: "nearCentralAirport", driveMinutes: 5, km: 3.9 },
    { labelKey: "nearCnxAirport", driveMinutes: 8, km: 5.4 },
    { labelKey: "nearThaPhaeGate", driveMinutes: 10, km: 7.3 },
    { labelKey: "nearNimmanhaemin", driveMinutes: 10, km: 7.6 },
  ],
  facts: [
    { labelKey: "guests", value: "12" },
    { labelKey: "bedrooms", value: "4" },
    { labelKey: "beds", valueKey: "fourKingOrQueenBeds" },
    { labelKey: "bathrooms", value: "5" },
    { labelKey: "factPool", value: "1" },
  ],
  rating: { value: 4.63, source: "Airbnb", givenOn: "2026-11-11" },
  descriptionKeys: ["gardenDesc1", "gardenDesc2"],
};

export const PROPERTIES: Property[] = [
  LOTUS_HOUSE,
  COSMOS_HOUSE,
  MAE_RIM_HOUSE,
  COURTYARD_VILLA,
  JASMINE_VILLA,
  SILVER_OAK_VILLA,
  MID_CENTURY_VILLA,
  ATRIUM_VILLA,
  GARDEN_VILLA,
];

/**
 * The one house that stands for the company wherever a page needs a single property and
 * is not a property's own page: the homepage hero and closing links, the contact aside,
 * the 404 link list, the proof photographs on /how-it-works, the /house-for-rent-chiang-mai
 * link, and the two share cards that belong to a route rather than to a house.
 *
 * It is a setting here because it used to be seven separate imports of LOTUS_HOUSE, which
 * made the flagship a constant rather than a decision. AgentSiam letting property it does
 * not manage means the house that fronts the company and the house it happens to run stop
 * being the same thing, and that change should be one line.
 *
 * Typed as Property on purpose. Reading a Lotus-House-specific field off this constant
 * should fail to compile, because whatever it points at next may not have one.
 *
 * TWO THINGS THIS DOES NOT MOVE.
 *
 * The booking engine. src/lib/beds24.ts, the three routes under src/app/api/booking/, the
 * Stripe webhook and src/components/booking-panel.tsx all still read LOTUS_HOUSE directly,
 * and they are right to. They are not showing a featured property, they are taking money
 * for the only property this site can sell, and pointing them here would offer a checkout
 * for a house with no Beds24 room behind it.
 *
 * The homepage hero photographs. page.tsx imports a Lotus House file by path and picks a
 * second by filename, because a static import is what gives Next the dimensions and the
 * blur placeholder, and neither can be derived from a slug. Changing this setting changes
 * every link and title; the hero imagery is a second edit in the same commit.
 */
export const FEATURED_PROPERTY: Property = LOTUS_HOUSE;

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

/** The facts strip, resolved against a dictionary. */
export function propertyFacts(
  t: Dictionary,
  property: Property,
): { label: string; value: string }[] {
  return property.facts.map((fact) => ({
    label: t[fact.labelKey],
    value: fact.valueKey ? t[fact.valueKey] : (fact.value ?? ""),
  }));
}

/** The house rules, resolved. The safety line is added by the caller, not here: it is a
 *  standing recommendation rather than a rule, and only the property page shows it. */
export function propertyHouseRules(t: Dictionary, property: Property): string[] {
  return property.houseRuleKeys.map((key) => t[key]);
}
