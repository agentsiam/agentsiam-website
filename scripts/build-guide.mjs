/**
 * Builds src/lib/guide.generated.ts from the Lotus House Sites & Tips sheet.
 *
 * WHY THIS IS NOT PART OF `prebuild`
 *
 * The photo manifest runs before every build because it only reads the local disk.
 * This one talks to Google Sheets, Google Maps and a routing service, so making it a
 * build step would mean a deploy fails whenever a third party is slow, rate-limits us,
 * or Nils has the sheet open in a state that will not export. Instead its output and
 * its cache are both committed, and this is run by hand when the guide changes:
 *
 *     npm run guide
 *
 * A Vercel build therefore does no network work for the guide at all. It reads a
 * checked-in TypeScript file, which is also why the guide still renders if the sheet
 * is ever deleted.
 *
 * WHAT THE SHEET IS AND IS NOT
 *
 * The sheet is the editing surface, and it stays that way: Nils adds a row with a
 * Google Maps link exactly as he does today. He never types a coordinate. This script
 * resolves the link once and remembers it in scripts/guide-cache.json, keyed by link,
 * so a rerun only touches rows that are actually new.
 *
 * The sheet stores distances hardcoded to Lotus House. Those columns are deliberately
 * NOT imported. Distance belongs to the pairing of a place and a property, not to the
 * place, which is the whole reason one guide can serve many properties later. Walking
 * and driving times are routed per property and cached the same way.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CACHE_PATH = join(HERE, "guide-cache.json");
const OUT_PATH = join(ROOT, "src", "lib", "guide.generated.ts");

const SHEET_CSV =
  "https://docs.google.com/spreadsheets/d/1WmFb9ZdmDt_ku4cF49-KoYoaabeTaDwJYImmlI-BXbU/export?format=csv";

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
 * Places entered twice that are genuinely one place.
 *
 * Deliberately an explicit list and not an automatic rule. Merging by coordinates would
 * be wrong here: Shangri-La Health Club and Shangri-La Hotel Pool share both a coordinate
 * AND a Google Maps link, because they are two facilities inside one building, and a
 * guest paying for a pool day pass is not buying a gym day pass. Merging by Google place
 * id fails for the same reason. So a human decides, and records why.
 *
 * Wiang Kum Kam: verified as one place, not two. Both rows resolve to Google feature id
 * 0x30da303ad30599ad:0x475d9f34359213a3 and Knowledge Graph id /m/08tft3.
 */
const MERGE = [
  { keep: "Wiang Kum Kam", drop: "Wiang Kum Kam", byCategory: { keep: "Temple", drop: "Museum/Gallery" } },
];

/**
 * Rows whose sheet name is ambiguous to a guest. The sheet is left alone; the
 * disambiguation lives here so it can be reviewed in a diff.
 */
const RENAME = [
  {
    match: (r) => r.name.startsWith("Baggage storage, AIRPORTELs") && r.sheetArea === "Airport",
    to: "Baggage storage, AIRPORTELs (airport terminal)",
  },
  {
    match: (r) => r.name.startsWith("Baggage storage, AIRPORTELs") && r.sheetArea === "Urban",
    to: "Baggage storage, AIRPORTELs (Central Airport Mall)",
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

const csv = await fetch(SHEET_CSV).then((r) => {
  if (!r.ok) throw new Error(`Sheet fetch failed (${r.status}). Still shared to anyone with the link?`);
  return r.text();
});

const rows = parseCsv(csv);
const head = rows[0].map((h) => h.trim());
const idx = (n) => head.indexOf(n);
const iSite = idx("Site"), iCat = idx("Category"), iArea = idx("Area");
const iG = idx("Google Maps"), iA = idx("Apple Maps"), iC = idx("Comment");
if (iSite < 0 || iG < 0) throw new Error(`Unexpected columns: ${head.join(", ")}`);

let places = rows.slice(1)
  .filter((r) => r.some((c) => c.trim()))
  .map((r) => {
    const raw = (r[iSite] || "").replace(ZERO_WIDTH, "");
    return {
      name: raw.replace(HIGHLIGHT, "").replace(/\s+/g, " ").trim(),
      highlight: raw.includes(HIGHLIGHT),
      category: (r[iCat] || "").trim(),
      sheetArea: (r[iArea] || "").trim(),
      google: (r[iG] || "").trim(),
      apple: (r[iA] || "").trim(),
      comment: (r[iC] || "").trim(),
    };
  });

for (const rule of RENAME) {
  for (const p of places) if (rule.match(p)) p.name = rule.to;
}

for (const m of MERGE) {
  const keep = places.find((p) => p.name === m.keep && p.category === m.byCategory.keep);
  const drop = places.find((p) => p.name === m.drop && p.category === m.byCategory.drop);
  if (keep && drop) {
    keep.highlight ||= drop.highlight;
    if (drop.comment.length > keep.comment.length) keep.comment = drop.comment;
    places = places.filter((p) => p !== drop);
    console.log(`merged: ${m.drop} (${m.byCategory.drop}) into ${m.keep} (${m.byCategory.keep})`);
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
const q = (s) => JSON.stringify(s);

const out = `// GENERATED by scripts/build-guide.mjs. Do not edit by hand.
//
// Source: the "Lotus House Sites & Tips" sheet. Edit there, then run \`npm run guide\`.
// Distances are NOT from the sheet: they are routed per property, so one guide can serve
// any property. See the script for why this is not a build step.

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
  google: string;
  apple: string;
};

/** Walking and driving minutes from one property to one place, precomputed. */
export type GuideDistance = { walk: number | null; drive: number | null; metres: number };

export const GUIDE_CATEGORIES: string[] = ${JSON.stringify(categories, null, 2)};

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
