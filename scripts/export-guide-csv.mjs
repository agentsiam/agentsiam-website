/**
 * Dumps the built guide back out to CSV.
 *
 *     npm run guide:csv            -> scripts/guide-export.csv, everything
 *     npm run guide:csv -- --sheet -> scripts/guide-for-sheet.csv, the inbox's columns
 *     npm run guide:csv -- out.csv
 *
 * An export, never a source of truth. It regenerates in a second and is gitignored, because
 * a checked-in copy of the library is a second answer to "what places do we have" that goes
 * wrong the moment the first one changes.
 *
 * Distances are per property, so one column pair is emitted per property rather than a
 * single pair that would silently mean "Lotus House".
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

/**
 * `--sheet` writes only the columns the inbox owns, straight from places.json.
 *
 * Reseeds the sheet from the library so it starts from the library's names, and the only
 * rows that differ afterwards are ones somebody is actually proposing.
 */
if (process.argv.includes("--sheet")) {
  const library = JSON.parse(readFileSync(join(ROOT, "src", "data", "places.json"), "utf8"));
  const vocab = JSON.parse(readFileSync(join(ROOT, "src", "lib", "guide-vocabulary.json"), "utf8"));
  const label = new Map(vocab.tags.map((t) => [t.slug, t.en]));
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ["Category", "Site", "Google Maps", "Apple Maps", "Comment", "Tags", "url"];
  const body = library.places.map((p) => [
    p.category,
    // The sheet marks a host pick with the diamond in the name; the library uses a boolean.
    (p.highlight ? "\u{1F536} " : "") + p.name,
    p.google,
    p.apple,
    p.comment,
    p.tags.map((s) => label.get(s) ?? s).join(", "),
    p.website,
  ]);
  const out = join(HERE, "guide-for-sheet.csv");
  writeFileSync(out, [header, ...body].map((r) => r.map(esc).join(",")).join("\r\n") + "\r\n", "utf8");
  console.log(`${body.length} places -> ${out}`);
  console.log("Import this into the sheet with File > Import > Replace current sheet.");
  process.exit(0);
}

const { GUIDE_PLACES, GUIDE_DISTANCES } = await import(
  pathToFileURL(join(ROOT, "src", "lib", "guide.generated.ts")).href
).catch(async () => {
  // The generated file is TypeScript, so it cannot simply be imported by Node. Reading it
  // as text and pulling the arrays out with JSON is uglier than an import and has one
  // decisive advantage: it needs no build step, no loader flag and no tsx dependency, so
  // `npm run guide:csv` works in a fresh checkout.
  const src = readFileSync(join(ROOT, "src", "lib", "guide.generated.ts"), "utf8");
  const grab = (name) => {
    const start = src.indexOf(`export const ${name}`);
    const open = src.indexOf(name.endsWith("DISTANCES") ? "{" : "[", start);
    let depth = 0;
    for (let i = open; i < src.length; i++) {
      if (src[i] === "[" || src[i] === "{") depth++;
      if (src[i] === "]" || src[i] === "}") {
        depth--;
        if (depth === 0) return src.slice(open, i + 1);
      }
    }
    throw new Error(`could not read ${name} out of guide.generated.ts`);
  };
  const toJson = (block) =>
    JSON.parse(
      block
        .replace(/(\w[\w$]*):/g, '"$1":') // bare keys -> quoted
        .replace(/,(\s*[}\]])/g, "$1"), // trailing commas
    );
  return { GUIDE_PLACES: toJson(grab("GUIDE_PLACES")), GUIDE_DISTANCES: toJson(grab("GUIDE_DISTANCES")) };
});

const vocabulary = JSON.parse(readFileSync(join(ROOT, "src", "lib", "guide-vocabulary.json"), "utf8"));
const tagLabel = new Map(vocabulary.tags.map((t) => [t.slug, t.en]));

const properties = Object.keys(GUIDE_DISTANCES);

const header = [
  "Site",
  "Category",
  "Tags",
  "Host pick",
  "Neighbourhood",
  "Comment",
  "Google Maps",
  "Apple Maps",
  "Latitude",
  "Longitude",
  ...properties.flatMap((slug) => [`Walk from ${slug} (min)`, `Drive from ${slug} (min)`]),
];

const rows = GUIDE_PLACES.map((place) => [
  place.name,
  place.category,
  place.tags.map((slug) => tagLabel.get(slug) ?? slug).join(", "),
  place.highlight ? "yes" : "",
  place.area ?? "",
  place.comment,
  place.google,
  place.apple,
  place.lat,
  place.lng,
  ...properties.flatMap((slug) => {
    const d = GUIDE_DISTANCES[slug]?.[place.name];
    return [d?.walk ?? "", d?.drive ?? ""];
  }),
]);

const cell = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const out = resolve(process.argv[2] ?? join(HERE, "guide-export.csv"));
writeFileSync(out, [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n", "utf8");

console.log(`${rows.length} places -> ${out}`);
console.log("Regenerated from guide.generated.ts. Not a source of truth: edit the sheet, not this.");
