/**
 * Imports the Google Sheet into src/data/places.json as a proposal.
 *
 *     npm run guide:import            show what the sheet would change
 *     npm run guide:import -- --apply write those changes into places.json
 *
 * The sheet is an inbox: it is how someone adds a restaurant from their phone. It is not
 * the library, because a spreadsheet cell validates nothing and reviews nothing.
 *
 * So the flow is one-directional and gated. Someone proposes, this prints a diff, a human
 * reads it, and only then does anything reach the library. Nothing writes without --apply,
 * and nothing here ever deletes: a place missing from the sheet is reported, never removed,
 * because the sheet is not authoritative about what exists.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const PLACES_PATH = join(ROOT, "src", "data", "places.json");
const VOCABULARY_PATH = join(ROOT, "src", "lib", "guide-vocabulary.json");

const SHEET_CSV =
  process.env.GUIDE_SHEET_CSV ||
  "https://docs.google.com/spreadsheets/d/1WmFb9ZdmDt_ku4cF49-KoYoaabeTaDwJYImmlI-BXbU/export?format=csv";

const APPLY = process.argv.includes("--apply");
const HIGHLIGHT = "\u{1F536}";
const ZERO_WIDTH = /[​-‍﻿]/g;

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

const key = (s) => s.toLowerCase().replace(/[\s_-]+/g, "");

const vocabulary = JSON.parse(readFileSync(VOCABULARY_PATH, "utf8"));
const tagSlug = new Map();
for (const t of vocabulary.tags) {
  tagSlug.set(key(t.en), t.slug);
  tagSlug.set(key(t.slug), t.slug);
}
const tagOrder = new Map(vocabulary.tags.map((t, i) => [t.slug, i]));

const library = JSON.parse(readFileSync(PLACES_PATH, "utf8"));
const byName = new Map(library.places.map((p) => [p.name, p]));

const csv = parseCsv(
  await fetch(SHEET_CSV).then((r) => {
    if (!r.ok) throw new Error(`Sheet fetch failed (${r.status}). Still shared to anyone with the link?`);
    return r.text();
  }),
);

const head = csv[0].map((h) => h.trim());
const at = (row, name) => {
  const i = head.indexOf(name);
  return i < 0 ? "" : (row[i] || "").trim();
};
if (!head.includes("Site") || !head.includes("Google Maps")) {
  throw new Error(`Unexpected sheet columns: ${head.join(", ")}`);
}

/**
 * Two sheet rows with one name.
 *
 * Imported, this adds a duplicate the guide build then refuses, several steps later and
 * with less context. Names are the key the whole system joins on, so catch it at the door.
 */
function refuseDuplicates(rows) {
  const seen = new Map();
  for (const r of rows) seen.set(r.name, (seen.get(r.name) ?? 0) + 1);
  const dups = [...seen].filter(([, n]) => n > 1).map(([name]) => name);
  if (dups.length) {
    throw new Error(
      `The sheet has more than one row named:\n${dups.map((d) => `  ${d}`).join("\n")}\n\n` +
        `Give each row a name that tells them apart, the way places.json does, or remove the ` +
        `duplicate row. Importing them would add a place the guide build then rejects.`,
    );
  }
}

const unknownTags = new Set();
const proposed = csv.slice(1)
  .filter((r) => r.some((c) => c.trim()))
  .map((r) => {
    const raw = at(r, "Site").replace(ZERO_WIDTH, "");
    const tags = [];
    for (const label of at(r, "Tags").split(",").map((t) => t.trim()).filter(Boolean)) {
      const slug = tagSlug.get(key(label));
      if (!slug) unknownTags.add(label);
      else if (!tags.includes(slug)) tags.push(slug);
    }
    return {
      name: raw.replace(HIGHLIGHT, "").replace(/\s+/g, " ").trim(),
      category: at(r, "Category"),
      city: library.places[0]?.city ?? "chiang-mai",
      tags: tags.sort((a, b) => tagOrder.get(a) - tagOrder.get(b)),
      highlight: raw.includes(HIGHLIGHT),
      comment: at(r, "Comment"),
      google: at(r, "Google Maps"),
      apple: at(r, "Apple Maps"),
      website: at(r, "url") || at(r, "Website"),
    };
  });

refuseDuplicates(proposed);

/** Fields the sheet is allowed to speak for. Anything else in places.json it cannot touch. */
const FIELDS = ["category", "tags", "highlight", "comment", "google", "apple", "website"];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const added = [], changed = [];
for (const p of proposed) {
  const existing = byName.get(p.name);
  if (!existing) { added.push(p); continue; }
  const diffs = FIELDS.filter((f) => !same(existing[f] ?? "", p[f] ?? ""))
    // An empty cell in the sheet is "I did not fill this in", not "delete what is there".
    .filter((f) => !(Array.isArray(p[f]) ? p[f].length === 0 : p[f] === ""));
  if (diffs.length) changed.push({ existing, proposed: p, diffs });
}
const missing = library.places.filter((p) => !proposed.some((q) => q.name === p.name));

console.log(`sheet: ${proposed.length} rows | library: ${library.places.length} places\n`);

if (unknownTags.size) {
  console.log(`tags not in the vocabulary, ignored: ${[...unknownTags].join(", ")}\n`);
}

for (const p of added) console.log(`+ ${p.name}  [${p.category}]${p.tags.length ? ` ${p.tags.join(", ")}` : ""}`);
for (const c of changed) {
  console.log(`~ ${c.existing.name}`);
  for (const f of c.diffs) {
    console.log(`    ${f}: ${JSON.stringify(c.existing[f] ?? "")}  ->  ${JSON.stringify(c.proposed[f])}`);
  }
}
if (missing.length) {
  console.log(`\n${missing.length} place(s) in the library are not in the sheet. Left alone, never deleted:`);
  for (const p of missing) console.log(`    ${p.name}`);
}

if (!added.length && !changed.length) {
  console.log("Nothing to import: the sheet proposes no changes.");
  process.exit(0);
}

if (!APPLY) {
  console.log(`\n${added.length} to add, ${changed.length} to change. Re-run with --apply to write them.`);
  process.exit(0);
}

for (const c of changed) for (const f of c.diffs) c.existing[f] = c.proposed[f];
library.places.push(...added);
library.places.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
writeFileSync(PLACES_PATH, JSON.stringify(library, null, 2) + "\n", "utf8");

console.log(`\napplied: ${added.length} added, ${changed.length} changed, ${library.places.length} in the library.`);
console.log("Review the diff, then run `npm run guide`.");
