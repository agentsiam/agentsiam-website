/**
 * Enriches src/data/places.json into src/lib/guide.generated.ts.
 *
 * places.json is the library. This script adds only what a human should never type:
 * coordinates resolved from each Maps link, the neighbourhood those coordinates fall in,
 * and walking and driving times routed per property.
 *
 * NOT PART OF `prebuild`
 *
 * This talks to Google Maps and a routing service, so as a build step a deploy would fail
 * whenever a third party is slow or rate-limits us. Its output and its cache are both
 * committed and it is run by hand:
 *
 *     npm run guide
 *
 * A deploy therefore does no network work for the guide at all.
 *
 * DISTANCE IS NOT STORED ON A PLACE
 *
 * It belongs to the pairing of a place and a property, which is what lets one library serve
 * every property in its city. Walk and drive times are routed per property and cached.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CACHE_PATH = join(HERE, "guide-cache.json");
const OUT_PATH = join(ROOT, "src", "lib", "guide.generated.ts");
const VOCABULARY_PATH = join(ROOT, "src", "lib", "guide-vocabulary.json");

const PLACES_PATH = join(ROOT, "src", "data", "places.json");

/**
 * Routers, one per travel mode, and they must be different servers.
 *
 * This is not configuration taste. router.project-osrm.org is built with the car profile
 * only: ask it for /route/v1/foot/ and it does not refuse, it quietly returns a driving
 * route. The first run of this script produced a walking time identical to the driving
 * time for all 109 places, including an 11 minute "walk" to somewhere 6.4km away, which
 * is 35km/h. Nothing errored. It would have shipped.
 *
 * FOSSGIS runs separate OSRM instances per profile, which is what makes the distinction
 * real rather than nominal. Their service is community funded, so this stays a cached
 * one-off rather than anything a visitor triggers.
 */
const ROUTERS = {
  walking: process.env.OSRM_FOOT_URL || "https://routing.openstreetmap.de/routed-foot",
  driving: process.env.OSRM_CAR_URL || "https://routing.openstreetmap.de/routed-car",
};

/** Fastest a person plausibly walks, km/h. Anything above this is a driving route lying. */
const MAX_WALK_KMH = 8;

/** Beyond this, a walking route is technically valid and practically nonsense. */
const MAX_WALK_MINUTES = 90;

/**
 * Furthest a place can be from a neighbourhood's centre and still be called part of it.
 *
 * Without a cap, nearest-centroid assignment has no floor: the airport comes out as
 * Old City simply because Old City is the least far of eight options, which is a visibly
 * wrong claim on a page a guest is reading. At 2km, 91 of 110 places land in a real
 * neighbourhood and the remaining 19 are honestly outside it: Doi Inthanon at 45km,
 * MAIIAM at 10km, Bo Sang, Doi Suthep, the airport.
 */
const AREA_CAP_M = 2000;

/**
 * Everything the guide serves is in or around Chiang Mai. Anything outside this box is a
 * link pointing at the wrong business, not a place we are 20km off about.
 *
 * Generous on purpose: Doi Inthanon is 86km out and legitimate, so the box is the province
 * and its neighbours, not the city.
 */
const BOUNDS = { minLat: 17.5, maxLat: 20.5, minLng: 97.5, maxLng: 100.5 };

/**
 * Distance is the loose half of the duplicate check; the name comparison is the sharp half.
 * 400m rather than something tighter because two pins on one temple complex can be that far
 * apart: Wat Umong's two entries were 268m from each other.
 */
const NEAR_DUPLICATE_M = 400;

/**
 * Rows that share one Google Maps link and are still two different places.
 *
 * Sharing a link is normally a copy-paste error and stops the build. These are the
 * exceptions, and each one is a human decision recorded rather than a rule inferred.
 */
const SHARED_LINKS = [
  {
    link: "https://maps.app.goo.gl/EonAu9mmRSNANvJz5",
    why: "Two AIRPORTELs branches. One Maps listing covers both; they are named apart in places.json.",
  },
];


// --- tags --------------------------------------------------------------------

/**
 * The library may carry a tag as a *label* ("Dim sum") or a *slug* ("dim-sum"). Matching is
 * case and space insensitive and accepts either. Anything that still does not match stops
 * the build: a silently dropped tag is a filter that quietly returns the wrong places.
 */
function normaliseKey(s) {
  return s.toLowerCase().replace(/[\s_-]+/g, "");
}

/** Levenshtein, only ever run on the unknown tags in a failing build. */
function editDistance(a, b) {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return rows[a.length][b.length];
}

/**
 * Scored by edit distance as a proportion of the longer string, not an absolute count.
 * Three edits is a typo in "Japanes Ramen" and a different word entirely in "Tapas", which
 * an absolute rule matches to "Thai". A confidently wrong suggestion is worse than none.
 */
function didYouMean(unknown, vocabulary) {
  const key = normaliseKey(unknown);
  const scored = vocabulary
    .map((tag) => {
      const other = normaliseKey(tag.en);
      return { tag, ratio: editDistance(key, other) / Math.max(key.length, other.length) };
    })
    .sort((x, y) => x.ratio - y.ratio);
  const best = scored[0];
  return best && best.ratio <= 0.4 ? best.tag.en : null;
}

// --- geo ---------------------------------------------------------------------

function metres(a, b) {
  const R = 6371000;
  const p1 = (a.lat * Math.PI) / 180, p2 = (b.lat * Math.PI) / 180;
  const dp = p2 - p1, dl = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// --- resolution --------------------------------------------------------------

function coordsFromAppleLink(url = "") {
  const m = url.match(/coordinate=(-?\d+\.\d+),(-?\d+\.\d+)/);
  return m ? { lat: +m[1], lng: +m[2], via: "apple-link" } : null;
}

function coordsFromGoogleUrl(url = "") {
  const pin = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (pin) return { lat: +pin[1], lng: +pin[2], via: "google-pin" };
  const cam = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (cam) return { lat: +cam[1], lng: +cam[2], via: "google-camera" };
  return null;
}

async function resolveLink(url) {
  const res = await fetch(url, {
    redirect: "manual",
    headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
  });
  const loc = res.headers.get("location");
  return coordsFromGoogleUrl(loc || res.url);
}

async function route(from, to, mode) {
  const profile = mode === "walking" ? "foot" : "driving";
  const url = `${ROUTERS[mode]}/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
  const res = await fetch(url, { headers: { "user-agent": "agentsiam-website guide build (hi@agentsiam.com)" } });
  if (!res.ok) return null;
  const json = await res.json();
  const r = json?.routes?.[0];
  if (!r) return null;

  const minutes = Math.max(1, Math.round(r.duration / 60));
  const metres = Math.round(r.distance);

  if (mode === "walking") {
    const kmh = metres / 1000 / (r.duration / 3600);
    // Catches a car profile answering a walking question, which is silent otherwise.
    if (kmh > MAX_WALK_KMH) {
      throw new Error(
        `Walking route came back at ${kmh.toFixed(1)}km/h, above ${MAX_WALK_KMH}. ` +
          `That is a driving route wearing a walking label. Check OSRM_FOOT_URL points at a foot-profile server.`,
      );
    }
    // Honest rather than absurd: nobody walks to Doi Inthanon.
    if (minutes > MAX_WALK_MINUTES) return null;
  }

  return { minutes, metres };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- main --------------------------------------------------------------------

const cache = existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, "utf8")) : { coords: {}, routes: {} };
cache.coords ??= {};
cache.routes ??= {};

/**
 * `npm run guide -- --refresh` drops every cached coordinate and route and recomputes.
 * `npm run guide -- --refresh "Huen Muan Jai"` drops only the places whose name matches.
 *
 * The cache is keyed by Maps link and never expires, which is right almost always: a place
 * does not move, so re-resolving every link on every run would be waste against
 * community-funded servers. The exception is the case that never errors. When a business
 * relocates, the link stays the same while the coordinates behind it change, so the cache
 * keeps handing back the old position and nothing in the build can detect it. A human who
 * knows a place has moved needs a way to say so that is not hand-editing a JSON cache.
 */
const REFRESH = (() => {
  const i = process.argv.indexOf("--refresh");
  if (i < 0) return null;
  // npm strips the quotes, so `-- --refresh "Wat Umong"` arrives as two argv entries and
  // taking only the first would match "wat" against all eleven temples. Rejoin them.
  const rest = process.argv.slice(i + 1).filter((a) => !a.startsWith("--"));
  return rest.length ? rest.join(" ").toLowerCase() : "*";
})();

const VOCABULARY_FILE = JSON.parse(readFileSync(VOCABULARY_PATH, "utf8"));
const VOCABULARY = VOCABULARY_FILE.tags;
const CATEGORY_NAMES = new Set(VOCABULARY_FILE.categories.map((c) => c.name));
const TAG_BY_KEY = new Map();
for (const tag of VOCABULARY) {
  TAG_BY_KEY.set(normaliseKey(tag.en), tag.slug);
  TAG_BY_KEY.set(normaliseKey(tag.slug), tag.slug);
}

const areasSrc = readFileSync(join(ROOT, "src", "lib", "areas.ts"), "utf8");
const AREAS = [...areasSrc.matchAll(/slug:\s*"([a-z-]+)",[\s\S]*?lat:\s*([\d.]+),\s*\n\s*lng:\s*([\d.]+),/g)]
  .map((m) => ({ slug: m[1], lat: +m[2], lng: +m[3] }));

const propSrc = readFileSync(join(ROOT, "src", "lib", "property.ts"), "utf8");
const PROPERTIES = [...propSrc.matchAll(/slug:\s*"([a-z-]+)",[\s\S]*?lat:\s*(-?[\d.]+),\s*\n\s*lng:\s*(-?[\d.]+),/g)]
  .map((m) => ({ slug: m[1], lat: +m[2], lng: +m[3] }))
  .filter((p) => Number.isFinite(p.lat));

if (!AREAS.length) throw new Error("Could not read AREAS out of src/lib/areas.ts");
if (!PROPERTIES.length) throw new Error("Could not read any property coordinates out of src/lib/property.ts");

console.log(`${AREAS.length} areas, ${PROPERTIES.length} propert${PROPERTIES.length === 1 ? "y" : "ies"}`);

let places = JSON.parse(readFileSync(PLACES_PATH, "utf8")).places.map((p) => ({
  ...p,
  rawTags: p.tags ?? [],
}));

console.log(`${places.length} places in the library`);

/**
 * Tags, validated against the vocabulary before a single network call is made.
 *
 * Deliberately before coordinate resolution and routing: a typo should cost
 * a second, not the four minutes of routing that would happen first if this ran later.
 */
{
  const unknown = new Map();
  for (const p of places) {
    const slugs = [];
    for (const raw of p.rawTags) {
      const slug = TAG_BY_KEY.get(normaliseKey(raw));
      if (slug) {
        if (!slugs.includes(slug)) slugs.push(slug);
      } else if (!unknown.has(raw)) {
        unknown.set(raw, p.name);
      }
    }
    // Vocabulary order, so a reordered list is not a diff.
    p.tags = VOCABULARY.filter((tag) => slugs.includes(tag.slug)).map((tag) => tag.slug);
    delete p.rawTags;
  }

  if (unknown.size) {
    const lines = [...unknown].map(([raw, where]) => {
      const guess = didYouMean(raw, VOCABULARY);
      return `  "${raw}" (on ${where})${guess ? ` — did you mean "${guess}"?` : ""}`;
    });
    throw new Error(
      `${unknown.size} tag(s) are not in the vocabulary:\n${lines.join("\n")}\n\n` +
        `Either fix the spelling in src/data/places.json, or add the tag to ` +
        `src/lib/guide-vocabulary.json (and to the sheet's Vocabulary tab, so the ` +
        `dropdown offers it to whoever is proposing places there).`,
    );
  }

  const used = new Set(places.flatMap((p) => p.tags));
  console.log(`tags: ${used.size} of ${VOCABULARY.length} in the vocabulary are in use`);
}

/**
 * A category the vocabulary does not know still ships, with a plain pin and its English
 * name in every language. That degradation is deliberate and predates tags, so this warns
 * rather than throws. It is loud enough that nobody discovers it from a guest.
 */
{
  const unknown = [...new Set(places.map((p) => p.category).filter((c) => c && !CATEGORY_NAMES.has(c)))];
  for (const c of unknown) {
    console.warn(`  ! category "${c}" is not in guide-vocabulary.json: no icon, untranslated on /th and /zh`);
  }
}

/**
 * Two places pointing at one Maps link.
 *
 * Almost always a copy-paste error, and a silent one: both resolve to the same coordinates,
 * so one of the two is pinned somewhere it is not, with no warning anywhere. Real
 * exceptions go in SHARED_LINKS with a reason.
 */
{
  const allowed = new Set(SHARED_LINKS.map((s) => s.link));
  const byLink = new Map();
  for (const p of places) {
    if (!p.google || allowed.has(p.google)) continue;
    if (!byLink.has(p.google)) byLink.set(p.google, []);
    byLink.get(p.google).push(p.name);
  }
  const clashes = [...byLink].filter(([, names]) => names.length > 1);
  if (clashes.length) {
    const lines = clashes.map(([link, names]) => `  ${names.join(" + ")}\n    ${link}`);
    throw new Error(
      `${clashes.length} Google Maps link(s) are used by more than one place:\n${lines.join("\n")}\n\n` +
        `One of each pair is pinned in the wrong place. Fix the link in places.json, or add it to ` +
        `SHARED_LINKS in this script with the reason it is genuinely one listing.`,
    );
  }
}

// A human saying "this place moved", which is the one thing the cache cannot notice itself.
if (REFRESH) {
  const targets = REFRESH === "*" ? places : places.filter((p) => p.name.toLowerCase().includes(REFRESH));
  if (!targets.length) {
    throw new Error(`--refresh "${REFRESH}" matched no place. Nothing was dropped; check the spelling.`);
  }
  let coords = 0, routes = 0;
  for (const p of targets) {
    if (cache.coords[p.google]) { delete cache.coords[p.google]; coords++; }
    for (const key of Object.keys(cache.routes)) {
      if (key.endsWith(`|${p.google}`)) { delete cache.routes[key]; routes++; }
    }
  }
  console.log(`refresh: dropped ${coords} coordinate(s) and ${routes} route(s) for ${targets.length} place(s)`);
}

// coordinates, cached by google link
let resolved = 0;
for (const p of places) {
  const hit = cache.coords[p.google];
  if (hit) { Object.assign(p, hit); continue; }
  const found = coordsFromAppleLink(p.apple) || (await resolveLink(p.google).catch(() => null));
  if (!found) { console.warn(`  ! no coordinates: ${p.name}`); continue; }
  cache.coords[p.google] = found;
  Object.assign(p, found);
  resolved++;
  if (resolved % 4 === 0) await sleep(300);
}
console.log(`coordinates: ${places.length - resolved} cached, ${resolved} newly resolved`);

const missing = places.filter((p) => !Number.isFinite(p.lat));
if (missing.length) throw new Error(`${missing.length} place(s) without coordinates; refusing to write a partial guide`);

// A link that resolved somewhere no guest is walking to. See BOUNDS.
{
  const strays = places.filter(
    (p) => p.lat < BOUNDS.minLat || p.lat > BOUNDS.maxLat || p.lng < BOUNDS.minLng || p.lng > BOUNDS.maxLng,
  );
  if (strays.length) {
    const lines = strays.map((p) => `  ${p.name} -> ${p.lat},${p.lng}\n    ${p.google}`);
    throw new Error(
      `${strays.length} place(s) resolved outside Chiang Mai:\n${lines.join("\n")}\n\n` +
        `That is a wrong link, not a distant place. Search the business in Maps again and ` +
        `replace the link in places.json.`,
    );
  }
}

/**
 * The same place entered twice under two names.
 *
 * Proximity alone cannot detect this: in a dense Chiang Mai street an ATM sits 1m from the
 * 7-Eleven containing it and a pharmacy 23m from another pharmacy, which produces sixty
 * warnings nobody reads. The signal is proximity AND a similar name, so distance is the
 * loose filter and the name is the sharp one.
 *
 * Warns rather than throws: Shangri-La Health Club and Shangri-La Hotel Pool share a
 * coordinate and are deliberately two entries, because a pool day pass is not a gym day
 * pass. The judgement stays with a human.
 */
{
  const similar = (a, b) => {
    const x = normaliseKey(a), y = normaliseKey(b);
    if (x.includes(y) || y.includes(x)) return true;
    return editDistance(x, y) / Math.max(x.length, y.length) <= 0.4;
  };
  let found = 0;
  for (let i = 0; i < places.length; i++) {
    for (let j = i + 1; j < places.length; j++) {
      const d = metres(places[i], places[j]);
      if (d <= NEAR_DUPLICATE_M && similar(places[i].name, places[j].name)) {
        console.warn(`  ! ${Math.round(d)}m apart and similarly named: "${places[i].name}" / "${places[j].name}"`);
        found++;
      }
    }
  }
  if (found) console.warn(`  ! ${found} possible duplicate(s); confirm each is really two places`);
}

/**
 * GUIDE_DISTANCES is keyed by place name, so two places sharing one would collide and a
 * place would vanish from the map with no error. The sheet legitimately contained such a
 * pair (two AIRPORTELs branches), which is why they carry disambiguating names in
 * places.json. This makes a future recurrence loud instead of silent.
 */
{
  const seen = new Map();
  const clashes = [];
  for (const p of places) {
    if (seen.has(p.name)) clashes.push(p.name);
    seen.set(p.name, true);
  }
  if (clashes.length) {
    throw new Error(
      `Duplicate place name(s): ${[...new Set(clashes)].join(", ")}. ` +
        `Either they are one place, and one row should go, or two, and one needs a ` +
          `disambiguating name. Both are edits to places.json. Refusing to drop one silently.`,
    );
  }
}

// neighbourhood, capped
for (const p of places) {
  let best = null;
  for (const a of AREAS) {
    const d = metres(p, a);
    if (!best || d < best.d) best = { slug: a.slug, d };
  }
  p.area = best && best.d <= AREA_CAP_M ? best.slug : null;
  p.areaDistance = Math.round(best.d);
}
console.log(`neighbourhoods: ${places.filter((p) => p.area).length} assigned, ${places.filter((p) => !p.area).length} outside`);

// routing per property, cached
let routed = 0;
for (const prop of PROPERTIES) {
  for (const p of places) {
    const key = `${prop.slug}|${p.google}`;
    if (cache.routes[key]) continue;
    const foot = await route(prop, p, "walking");
    const car = await route(prop, p, "driving").catch(() => null);
    cache.routes[key] = {
      walk: foot?.minutes ?? null,
      drive: car?.minutes ?? null,
      metres: foot?.metres ?? car?.metres ?? Math.round(metres(prop, p)),
    };
    routed++;
    // Persist as we go. Routing is the slow part and it runs against community servers
    // that can rate-limit or stall; losing 200 completed requests because request 201
    // timed out would make every retry start from nothing. Written every 10 so a
    // Ctrl-C or a dropped connection costs seconds of work, not minutes.
    if (routed % 10 === 0) {
      writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
      console.log(`  routed ${routed}, cached`);
    }
    await sleep(250);
  }
}
console.log(`routes: ${routed} newly computed`);

/**
 * Second guard, on the whole set rather than one route.
 *
 * The per-route speed check catches an obviously wrong answer. This catches a subtly
 * wrong configuration: if walking and driving agree everywhere, one server is answering
 * both questions, whatever the URLs say.
 */
{
  const both = Object.values(cache.routes).filter((r) => r.walk !== null && r.drive !== null);
  const identical = both.filter((r) => r.walk === r.drive).length;
  if (both.length > 10 && identical / both.length > 0.5) {
    throw new Error(
      `${identical} of ${both.length} places have walking and driving times that are identical. ` +
        `One router is answering both. Refusing to write a guide that tells guests to walk a driving route.`,
    );
  }
  console.log(`sanity: ${identical}/${both.length} identical walk/drive times`);
}

mkdirSync(dirname(CACHE_PATH), { recursive: true });
writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");

// --- emit --------------------------------------------------------------------

const categories = [...new Set(places.map((p) => p.category))].filter(Boolean).sort();
const usedTags = VOCABULARY.map((t) => t.slug).filter((slug) => places.some((p) => p.tags.includes(slug)));
const q = (s) => JSON.stringify(s);

const out = `// GENERATED by scripts/build-guide.mjs. Do not edit by hand.
//
// Source: src/data/places.json. Edit there, then run \`npm run guide\`.
// Distances are routed per property rather than stored on a place, so one library serves
// every property in its city. See the script for why this is not a build step.

export type GuidePlace = {
  name: string;
  category: string;
  /** A host pick. */
  highlight: boolean;
  comment: string;
  /** Slugs from src/lib/guide-vocabulary.json, in vocabulary order. */
  tags: string[];
  /** City slug from src/lib/areas.ts. One library serves every property in a city. */
  city: string;
  /** The place's own site, or "" when it has none. Never its Google listing. */
  website: string;
  lat: number;
  lng: number;
  /** Slug from src/lib/areas.ts, or null when the place is outside every area we cover. */
  area: string | null;
  google: string;
  apple: string;
};

/** Walking and driving minutes from one property to one place, precomputed. */
export type GuideDistance = { walk: number | null; drive: number | null; metres: number };

export const GUIDE_CATEGORIES: string[] = ${JSON.stringify(categories, null, 2)};

/** Only tags actually used by a place, so a filter never offers an empty result. */
export const GUIDE_TAGS: string[] = ${JSON.stringify(usedTags, null, 2)};

export const GUIDE_PLACES: GuidePlace[] = [
${places
  .map(
    (p) => `  {
    name: ${q(p.name)},
    category: ${q(p.category)},
    highlight: ${p.highlight},
    comment: ${q(p.comment)},
    tags: ${JSON.stringify(p.tags)},
    city: ${q(p.city)},
    website: ${q(p.website ?? "")},
    lat: ${p.lat},
    lng: ${p.lng},
    area: ${p.area ? q(p.area) : "null"},
    google: ${q(p.google)},
    apple: ${q(p.apple)},
  },`,
  )
  .join("\n")}
];

/** Keyed by property slug, then by place name. */
export const GUIDE_DISTANCES: Record<string, Record<string, GuideDistance>> = {
${PROPERTIES.map(
  (prop) => `  ${q(prop.slug)}: {
${places
  .map((p) => {
    const d = cache.routes[`${prop.slug}|${p.google}`] || { walk: null, drive: null, metres: Math.round(metres(prop, p)) };
    return `    ${q(p.name)}: { walk: ${d.walk ?? "null"}, drive: ${d.drive ?? "null"}, metres: ${d.metres} },`;
  })
  .join("\n")}
  },`,
).join("\n")}
};
`;

writeFileSync(OUT_PATH, out);
console.log(`\nwrote ${OUT_PATH}`);
console.log(`     ${places.length} places, ${categories.length} categories, ${places.filter((p) => p.highlight).length} highlighted`);
