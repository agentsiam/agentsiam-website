/**
 * Builds src/lib/guide.generated.ts from scripts/guide-places.csv.
 *
 * WHY THIS IS NOT PART OF `prebuild`
 *
 * The photo manifest runs before every build because it only reads the local disk.
 * This one talks to Google Maps and a routing service, so making it a build step would
 * mean a deploy fails whenever a third party is slow or rate-limits us. Instead its
 * output and its cache are both committed, and this is run by hand when the guide
 * changes:
 *
 *     npm run guide
 *
 * A Vercel build therefore does no network work for the guide at all. It reads a
 * checked-in TypeScript file.
 *
 * WHERE THE PLACES COME FROM
 *
 * scripts/guide-places.csv, in the repository, reviewed in a diff. Nothing here fetches
 * a spreadsheet: the Google Sheet is an inbox that proposes rows through
 * `npm run guide:import`, which prints a diff and writes nothing without --apply. That
 * is what CLAUDE.md R11 means by the sheet being spent input rather than a source.
 *
 * Until 10/11/2026 this script fetched the sheet on every run, which meant an edit made
 * in a spreadsheet cell reached the guide with nobody reviewing it, and four lists in
 * this file (REMOVE, RENAME, MERGE and thirty note corrections) existed only to patch a
 * source we could not edit. Those are gone: the rows in the CSV are simply correct.
 *
 * A row never carries a hand-typed coordinate. This script resolves the Google Maps link
 * once and remembers it in scripts/guide-cache.json, keyed by link, so a rerun only
 * touches rows that are actually new.
 *
 * The sheet stores distances hardcoded to Lotus House. Those columns are deliberately
 * NOT imported. Walking and driving times are routed from each property's public start
 * point, a guide place near the house named in src/lib/guide-start.ts, and cached the same
 * way. Never from the house: the times sit next to every place's exact coordinate, and
 * times measured from the door can be worked back to the door. Paul, 08/11/2026. This
 * script does not read the house coordinates at all.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CACHE_PATH = join(HERE, "guide-cache.json");
const OUT_PATH = join(ROOT, "src", "lib", "guide.generated.ts");
const VOCABULARY_PATH = join(ROOT, "src", "lib", "guide-vocabulary.json");
const EXTRAS_PATH = join(HERE, "guide-extras.json");

const PLACES_PATH = join(HERE, "guide-places.csv");

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
 * Everything the guide serves is in or around Chiang Mai. A place outside this box is a
 * link pointing at the wrong business, not a place we are 20km off about.
 *
 * Generous on purpose: Doi Inthanon is 86km out and legitimate, so the box is the province
 * and its neighbours, not the city.
 */
const BOUNDS = { minLat: 17.5, maxLat: 20.5, minLng: 97.5, maxLng: 100.5 };

/**
 * Distance is the loose half of the same-place-twice check; the name comparison is the
 * sharp half. 400m rather than something tighter because two pins on one temple complex
 * can be that far apart.
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
    why: "Shangri-La Health Club and Shangri-La Hotel Pool: two facilities in one building, covered by one Maps listing. The same reason MERGE below leaves them as two places.",
  },
];

/**
 * Pairs the same-place-twice check flags that a human has already confirmed are two
 * places. Without this list the same warnings print on every run, and a warning that is
 * always there is a warning nobody reads.
 */
const NOT_DUPLICATES = [
  {
    names: ["Baggage storage, AIRPORTELs (Central Airport Mall)", "Central Airport"],
    why: "A baggage counter inside a shopping mall, and the mall itself. The names only look alike because one contains the other.",
  },
  {
    names: ["Tops Supermarket", "Rimping Supermarket"],
    why: "Two different supermarket chains a few hundred metres apart. Only the word Supermarket is shared.",
  },
];

const HIGHLIGHT = "\u{1F536}"; // 🔶, used in the sheet's Site column to mark a host pick
const ZERO_WIDTH = /[​-‍﻿]/g;

// --- csv ---------------------------------------------------------------------

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); field = ""; rows.push(row); row = []; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// --- geo ---------------------------------------------------------------------

function metres(a, b) {
  const R = 6371000;
  const p1 = (a.lat * Math.PI) / 180, p2 = (b.lat * Math.PI) / 180;
  const dp = p2 - p1, dl = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// --- names -------------------------------------------------------------------

/** Case, space and hyphen insensitive, so "Wat Umong" and "wat-umong" compare equal. */
function normaliseKey(s) {
  return s.toLowerCase().replace(/[\s_-]+/g, "");
}

/** Levenshtein, only ever run on the handful of pairs already known to be close together. */
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
 * Scored as a proportion of the longer name rather than an absolute edit count. Three
 * edits is a typo in a long name and a different business entirely in a short one.
 */
function similarName(a, b) {
  const x = normaliseKey(a), y = normaliseKey(b);
  if (x.includes(y) || y.includes(x)) return true;
  return editDistance(x, y) / Math.max(x.length, y.length) <= 0.4;
}

/**
 * Scored as a proportion of the longer string rather than an absolute edit count. Three
 * edits is a typo in "Japanes Ramen" and a different word entirely in "Tapas", which an
 * absolute rule happily matches to "Thai". A confidently wrong suggestion is worse than
 * none, so anything past a third of the string suggests nothing.
 */
function didYouMean(unknown, candidates) {
  const key = normaliseKey(unknown);
  const best = candidates
    .map((c) => ({ c, ratio: editDistance(key, normaliseKey(c)) / Math.max(key.length, normaliseKey(c).length) }))
    .sort((x, y) => x.ratio - y.ratio)[0];
  return best && best.ratio <= 0.34 ? best.c : null;
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
 * The vocabulary and the per-place extras, both read and checked before any network work.
 *
 * Tags are an allowlist: a slug not in the vocabulary stops the build rather than being
 * dropped, because a silently dropped tag is a filter that quietly returns the wrong
 * places. The vocabulary is also what the app reads for labels, so the two cannot drift.
 */
const VOCABULARY_FILE = JSON.parse(readFileSync(VOCABULARY_PATH, "utf8"));
const VOCABULARY = VOCABULARY_FILE.tags;
const CATEGORY_NAMES = new Set(VOCABULARY_FILE.categories.map((c) => c.name));
const TAG_SLUGS = VOCABULARY.map((tag) => tag.slug);
const EXTRAS = JSON.parse(readFileSync(EXTRAS_PATH, "utf8")).places;

if (!Array.isArray(VOCABULARY) || !VOCABULARY.length) {
  throw new Error(`No tags in ${VOCABULARY_PATH}. The app reads the same file for labels.`);
}

{
  const unknown = new Map();
  for (const [name, extra] of Object.entries(EXTRAS)) {
    for (const slug of extra.tags ?? []) {
      if (!TAG_SLUGS.includes(slug) && !unknown.has(slug)) unknown.set(slug, name);
    }
  }
  if (unknown.size) {
    const lines = [...unknown].map(([slug, where]) => {
      const guess = didYouMean(slug, TAG_SLUGS);
      return `  "${slug}" (on ${where})${guess ? `, did you mean "${guess}"?` : ""}`;
    });
    throw new Error(
      `${unknown.size} tag(s) are not in the vocabulary:\n${lines.join("\n")}\n\n` +
        `Either fix the slug in scripts/guide-extras.json, or add the tag to ` +
        `src/lib/guide-vocabulary.json with its Thai and Chinese label.`,
    );
  }
  const families = [...new Set(VOCABULARY.map((tag) => tag.family))];
  console.log(`vocabulary: ${VOCABULARY.length} tags in ${families.length} famil${families.length === 1 ? "y" : "ies"}`);
}

const areasSrc = readFileSync(join(ROOT, "src", "lib", "areas.ts"), "utf8");
const AREAS = [...areasSrc.matchAll(/slug:\s*"([a-z-]+)",[\s\S]*?lat:\s*([\d.]+),\s*\n\s*lng:\s*([\d.]+),/g)]
  .map((m) => ({ slug: m[1], lat: +m[2], lng: +m[3] }));

// Where each property's guide starts, by guide place name. Read out of the site's own module
// so the page and this script cannot disagree about the start.
const startSrc = readFileSync(join(ROOT, "src", "lib", "guide-start.ts"), "utf8");
const startBlock = startSrc.match(/GUIDE_START[^=]*=\s*\{([\s\S]*?)\};/);
const PROPERTIES = startBlock
  ? [...startBlock[1].matchAll(/^\s*"?([a-z-]+)"?:\s*"([^"]+)",?\s*$/gm)].map((m) => ({ slug: m[1], start: m[2] }))
  : [];

if (!AREAS.length) throw new Error("Could not read AREAS out of src/lib/areas.ts");
if (!PROPERTIES.length) throw new Error("Could not read any start points out of src/lib/guide-start.ts");

console.log(`${AREAS.length} areas, ${PROPERTIES.length} propert${PROPERTIES.length === 1 ? "y" : "ies"}`);

/**
 * Turns one CSV's text into place rows, same shape regardless of where the CSV came from.
 * Pulled out so a local, git-tracked file can feed the exact same resolution, dedup and
 * routing pipeline as the sheet, per CLAUDE.md R11: the sheet is disposable input, not the
 * only kind. Row shape is unforgiving on purpose -- Site and Google Maps have to be named
 * columns -- so a malformed local file fails loudly instead of silently dropping places.
 */
function rowsFromCsv(csv, source) {
  const rows = parseCsv(csv);
  const head = rows[0].map((h) => h.trim());
  const idx = (n) => head.indexOf(n);
  const iSite = idx("Site"), iCat = idx("Category");
  const iG = idx("Google Maps"), iA = idx("Apple Maps"), iC = idx("Comment");
  if (iSite < 0 || iG < 0) throw new Error(`Unexpected columns in ${source}: ${head.join(", ")}`);

  return rows.slice(1)
    .filter((r) => r.some((c) => c.trim()))
    .map((r) => {
      const raw = (r[iSite] || "").replace(ZERO_WIDTH, "");
      return {
        name: raw.replace(HIGHLIGHT, "").replace(/\s+/g, " ").trim(),
        highlight: raw.includes(HIGHLIGHT),
        category: (r[iCat] || "").trim(),
        google: (r[iG] || "").trim(),
        apple: (r[iA] || "").trim(),
        comment: (r[iC] || "").trim(),
      };
    });
}

const places = rowsFromCsv(readFileSync(PLACES_PATH, "utf8"), "guide-places.csv");
console.log(`library: ${places.length} places`);

/**
 * The extras onto places, by name.
 *
 * A name in guide-extras.json that matches nothing stops the build, the same way a FIX that
 * no longer applies does. Both guard the same failure: a place gets renamed, its entry here
 * goes quiet, and its tags and website disappear with nothing saying so. RENAME above has
 * already run, so a renamed place is keyed here by the name a guest sees.
 */
{
  const byName = new Map(places.map((p) => [p.name, p]));
  const orphans = [];
  for (const [name, extra] of Object.entries(EXTRAS)) {
    const place = byName.get(name);
    if (!place) { orphans.push(name); continue; }
    // Vocabulary order, so reordering a place's list is not a diff in the generated file.
    place.tags = TAG_SLUGS.filter((slug) => (extra.tags ?? []).includes(slug));
    place.website = extra.website ?? "";
  }
  if (orphans.length) {
    const lines = orphans.map((name) => {
      const guess = didYouMean(name, places.map((p) => p.name));
      return `  "${name}"${guess ? `, did you mean "${guess}"?` : ""}`;
    });
    throw new Error(
      `${orphans.length} name(s) in scripts/guide-extras.json match no place:\n${lines.join("\n")}\n\n` +
        `Either the place was renamed or removed, or the name is mistyped. Extras are keyed ` +
        `by the name after RENAME, which is the name a guest sees.`,
    );
  }
  for (const p of places) { p.tags ??= []; p.website ??= ""; }
  const tagged = places.filter((p) => p.tags.length).length;
  const sites = places.filter((p) => p.website).length;
  console.log(`extras: ${tagged} of ${places.length} places tagged, ${sites} with a website`);
}

/**
 * Two places pointing at one Maps link.
 *
 * Almost always a copy-paste error, and a silent one: coordinates below are cached by
 * link, so both rows resolve to the same point and one of the two is pinned somewhere it
 * is not, with nothing anywhere saying so. Real exceptions go in SHARED_LINKS.
 *
 * Deliberately above the resolution loop. Nothing here needs the network, so a bad link
 * fails in a second rather than after a hundred and fifty requests.
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
        `One of each pair is pinned where it is not. Correct the link in ` +
        `scripts/guide-extra.csv, or add it to SHARED_LINKS in this script with the reason ` +
        `it is genuinely one listing.`,
    );
  }
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

/**
 * A link that resolved somewhere no guest is going. See BOUNDS.
 *
 * This is the failure a cache cannot notice: a wrong link resolves cleanly, gets cached,
 * and every later run reads the cache and agrees with itself.
 */
{
  const strays = places.filter(
    (p) => p.lat < BOUNDS.minLat || p.lat > BOUNDS.maxLat || p.lng < BOUNDS.minLng || p.lng > BOUNDS.maxLng,
  );
  if (strays.length) {
    const lines = strays.map((p) => `  ${p.name} -> ${p.lat},${p.lng}\n    ${p.google}`);
    throw new Error(
      `${strays.length} place(s) resolved outside Chiang Mai:\n${lines.join("\n")}\n\n` +
        `That is a wrong link, not a distant place. Find the business in Maps again and ` +
        `replace the link. scripts/guide-cache.json is keyed by link, so a corrected link ` +
        `resolves fresh and the stale entry is simply never read again.`,
    );
  }
}

/**
 * GUIDE_DISTANCES is keyed by place name, so two places sharing one would collide and a
 * place would vanish from the map with no error. The sheet legitimately contained such a
 * pair (two AIRPORTELs branches), which is what RENAME above exists to separate. This
 * makes a future recurrence loud instead of silent.
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
        `Either they are one place (add to MERGE) or two (add to RENAME). Refusing to drop one silently.`,
    );
  }
}

/**
 * The same place entered twice under two names, which the check above cannot see.
 *
 * Proximity alone cannot see it either: in a dense Chiang Mai street an ATM sits a metre
 * from the 7-Eleven containing it and a pharmacy 23m from another pharmacy, which is sixty
 * warnings nobody reads. The signal is proximity AND a similar name, so distance is the
 * loose filter and the name is the sharp one.
 *
 * Warns rather than throws. Shangri-La Health Club and Shangri-La Hotel Pool share a
 * coordinate and are deliberately two entries, so the judgement stays with a person;
 * pairs already judged are in NOT_DUPLICATES and stay quiet.
 */
{
  const settled = new Set(
    NOT_DUPLICATES.map((n) => [...n.names].map(normaliseKey).sort().join("|")),
  );
  let found = 0;
  for (let i = 0; i < places.length; i++) {
    for (let j = i + 1; j < places.length; j++) {
      const a = places[i], b = places[j];
      if (settled.has([normaliseKey(a.name), normaliseKey(b.name)].sort().join("|"))) continue;
      const d = metres(a, b);
      if (d <= NEAR_DUPLICATE_M && similarName(a.name, b.name)) {
        console.warn(`  ! ${Math.round(d)}m apart and similarly named: "${a.name}" / "${b.name}"`);
        found++;
      }
    }
  }
  console.log(
    found
      ? `  ! ${found} possible duplicate(s); confirm each is really two places, then add it to NOT_DUPLICATES`
      : `duplicates: none beyond the ${NOT_DUPLICATES.length} already settled`,
  );
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

// routing from each start point, cached. Two properties sharing a start share its routes.
const startOf = (prop) => {
  const place = places.find((p) => p.name === prop.start);
  if (!place) throw new Error(`Start point "${prop.start}" for ${prop.slug} is not a guide place. Fix src/lib/guide-start.ts.`);
  return place;
};
const routeKey = (prop, p) => `start:${prop.start}|${p.google}`;
// Routes measured from a house are dropped from the cache rather than kept beside the new ones.
for (const key of Object.keys(cache.routes)) if (!key.startsWith("start:")) delete cache.routes[key];
let routed = 0;
for (const prop of PROPERTIES) {
  const from = startOf(prop);
  for (const p of places) {
    const key = routeKey(prop, p);
    if (cache.routes[key]) continue;
    const foot = await route(from, p, "walking");
    const car = await route(from, p, "driving").catch(() => null);
    cache.routes[key] = {
      walk: foot?.minutes ?? null,
      drive: car?.minutes ?? null,
      metres: foot?.metres ?? car?.metres ?? Math.round(metres(from, p)),
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

/**
 * A category the vocabulary does not know still ships, with a plain pin and its English
 * name in every language. That degradation is deliberate, so this warns rather than
 * throwing. It is loud enough that nobody discovers it from a guest's page.
 */
for (const c of categories) {
  if (!CATEGORY_NAMES.has(c)) {
    console.warn(`  ! category "${c}" is not in guide-vocabulary.json: no icon, untranslated on /th and /zh`);
  }
}
const q = (s) => JSON.stringify(s);

const out = `// GENERATED by scripts/build-guide.mjs. Do not edit by hand.
//
// Source: scripts/guide-places.csv, plus scripts/guide-extras.json for tags and websites.
// Edit those, then run \`npm run guide\`. New places are proposed by the Google Sheet
// through \`npm run guide:import\`, which writes nothing without --apply; see
// GUIDE-RUNBOOK.md. Distances are in neither file: they are routed per property, so one
// guide can serve any property. See the script for why this is not a build step.

export type GuidePlace = {
  name: string;
  category: string;
  /** A host pick, marked with an orange diamond in the sheet's Site column. */
  highlight: boolean;
  comment: string;
  lat: number;
  lng: number;
  /** Slug from src/lib/areas.ts, or null when the place is outside every area we cover. */
  area: string | null;
  /** Slugs from src/lib/guide-vocabulary.json. Empty is normal: a tag is a checked claim. */
  tags: string[];
  /** The business's own page, never a directory listing of it. Empty where we have none. */
  website: string;
  google: string;
  apple: string;
};

/** Walking and driving minutes from one property to one place, precomputed. */
export type GuideDistance = { walk: number | null; drive: number | null; metres: number };

export const GUIDE_CATEGORIES: string[] = ${JSON.stringify(categories, null, 2)};

/**
 * Every tag actually in use, in vocabulary order. A vocabulary entry nothing carries is
 * left out, so a filter built from this never offers a chip that leads to an empty page.
 */
export const GUIDE_TAGS: string[] = ${JSON.stringify(
  TAG_SLUGS.filter((slug) => places.some((p) => p.tags.includes(slug))),
  null,
  2,
)};

export const GUIDE_PLACES: GuidePlace[] = [
${places
  .map(
    (p) => `  {
    name: ${q(p.name)},
    category: ${q(p.category)},
    highlight: ${p.highlight},
    comment: ${q(p.comment)},
    lat: ${p.lat},
    lng: ${p.lng},
    area: ${p.area ? q(p.area) : "null"},
    tags: ${JSON.stringify(p.tags)},
    website: ${q(p.website)},
    google: ${q(p.google)},
    apple: ${q(p.apple)},
  },`,
  )
  .join("\n")}
];

/** Keyed by property slug, then by place name. Measured from the property's start point, never the house. */
export const GUIDE_DISTANCES: Record<string, Record<string, GuideDistance>> = {
${PROPERTIES.map(
  (prop) => `  ${q(prop.slug)}: {
${places
  .map((p) => {
    const d = cache.routes[routeKey(prop, p)] || { walk: null, drive: null, metres: Math.round(metres(startOf(prop), p)) };
    return `    ${q(p.name)}: { walk: ${d.walk ?? "null"}, drive: ${d.drive ?? "null"}, metres: ${d.metres} },`;
  })
  .join("\n")}
  },`,
).join("\n")}
};
`;

writeFileSync(OUT_PATH, out);
console.log(`\nwrote ${OUT_PATH}`);
console.log(
  `     ${places.length} places, ${categories.length} categories, ` +
    `${places.filter((p) => p.highlight).length} highlighted, ` +
    `${TAG_SLUGS.filter((slug) => places.some((p) => p.tags.includes(slug))).length} tags in use, ` +
    `${places.filter((p) => p.website).length} websites`,
);
