/**
 * Reads the Google Sheet and proposes what it would add to scripts/guide-places.csv.
 *
 *     npm run guide:import                    print what the sheet proposes
 *     npm run guide:import -- --differences   also list where the two disagree
 *     npm run guide:import -- --apply         append the new rows to the library
 *
 * The sheet is an inbox. It is how someone adds a restaurant from their phone, and it is
 * not the library, because a spreadsheet cell validates nothing and reviews nothing. So
 * the flow is one-directional and gated: someone proposes, this prints a diff, a person
 * reads it, and only then does anything reach the repository.
 *
 * Until 10/11/2026 build-guide.mjs fetched the sheet on every run, which meant a cell
 * edited in a browser reached the guide with nobody reading it, and a row deleted there
 * silently deleted a place. That is the drift this script exists to stop.
 *
 * THREE RULES, AND THE REASONS
 *
 * Nothing is written without --apply. A proposal a person has not read is not a review.
 *
 * Nothing is ever deleted. A place missing from the sheet is counted and left alone: the
 * sheet is not authoritative about what exists, and most of the library is not in it.
 *
 * A place is identified by its Google Maps link, not by its name. Names in the library
 * have been deliberately edited (two AIRPORTELs branches named apart, thirty notes with
 * their typos corrected), and matching on them would make this script propose undoing
 * every one of those edits on every run. The link is what the place is.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PLACES_PATH = join(HERE, "guide-places.csv");

const SHEET_CSV =
  process.env.GUIDE_SHEET_CSV ||
  "https://docs.google.com/spreadsheets/d/1WmFb9ZdmDt_ku4cF49-KoYoaabeTaDwJYImmlI-BXbU/export?format=csv";

const APPLY = process.argv.includes("--apply");
const SHOW_DIFFS = process.argv.includes("--differences");

const HIGHLIGHT = "\u{1F536}";
const ZERO_WIDTH = /[​-‍﻿]/g;

/**
 * Sheet rows we have decided not to carry, by link, each with the reason.
 *
 * Without this a declined row is proposed again on every run, and a list that cries wolf
 * every time is a list nobody reads. Declining is a decision and it is recorded here the
 * same way an exception to a build guard is.
 */
const DECLINED = [
  {
    link: "https://maps.app.goo.gl/i6C2A7XxXMqekdua9",
    why: "\u0e15\u0e23\u0e32\u0e1a\u0e38\u0e0d Coffee Station, closed down. Reported by Nils, 06/11/2026.",
  },
  {
    link: "https://maps.app.goo.gl/mK7ZgbVGuZqf4F189",
    why:
      "Wiang Kum Kam entered twice, once as Museum/Gallery and once as Temple. Verified as " +
      "one place: both rows resolve to Google feature id 0x30da303ad30599ad:0x475d9f34359213a3 " +
      "and Knowledge Graph id /m/08tft3. The library carries the Temple row.",
  },
];

// --- csv ---------------------------------------------------------------------

/** Same parser as build-guide.mjs: quoted fields, doubled quotes, CRLF. */
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

/** Quotes a field only when it has to be, so the committed file stays readable in a diff. */
function csvField(value) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function readRows(text, source) {
  const rows = parseCsv(text);
  const head = rows[0].map((h) => h.trim());
  const at = (row, name) => {
    const i = head.indexOf(name);
    return i < 0 ? "" : (row[i] || "").trim();
  };
  if (!head.includes("Site") || !head.includes("Google Maps")) {
    throw new Error(`Unexpected columns in ${source}: ${head.join(", ")}`);
  }
  const parsed = rows.slice(1)
    .filter((r) => r.some((c) => c.trim()))
    .map((r) => {
      const raw = at(r, "Site").replace(ZERO_WIDTH, "");
      return {
        name: raw.replace(HIGHLIGHT, "").replace(/\s+/g, " ").trim(),
        highlight: raw.includes(HIGHLIGHT),
        category: at(r, "Category"),
        google: at(r, "Google Maps"),
        apple: at(r, "Apple Maps"),
        comment: at(r, "Comment"),
      };
    });
  return { head, rows: parsed };
}

// --- read both sides ---------------------------------------------------------

const library = readRows(readFileSync(PLACES_PATH, "utf8"), "guide-places.csv").rows;

const sheetText = await fetch(SHEET_CSV).then((r) => {
  if (!r.ok) {
    throw new Error(
      `Sheet fetch failed (${r.status}). Is it still shared to anyone with the link? ` +
        `Nothing was written. The guide builds from scripts/guide-places.csv either way, ` +
        `so this failing never blocks a deploy.`,
    );
  }
  return r.text();
});
const sheet = readRows(sheetText, "the sheet");

/**
 * What a duplicate in the sheet does and does not matter.
 *
 * The sheet legitimately holds two rows called "Wiang Kum Kam" and two called "Baggage
 * storage, AIRPORTELs", and the library has already settled both: one is a single place
 * entered twice, the other is two branches named apart. Refusing on those would mean this
 * script could never run at all.
 *
 * What matters is only what is about to be added. A proposed row whose name already exists,
 * or whose name another proposed row also uses, would land in guide-places.csv and the
 * guide build would then refuse the whole file, several steps later and with less context.
 * That is checked below, after the comparison, where it can be checked against the rows
 * that are actually new.
 */

// --- compare -----------------------------------------------------------------

const declined = new Map(DECLINED.map((d) => [d.link, d.why]));
// A link can belong to more than one library row on purpose: Shangri-La's health club and
// its pool are one Maps listing and two places. Comparing fields against either of them
// would be comparing against the wrong one, so a shared link is matched and not compared.
const byLink = new Map();
for (const p of library) {
  if (!byLink.has(p.google)) byLink.set(p.google, []);
  byLink.get(p.google).push(p);
}

const added = [], disagrees = [], skipped = [];
for (const row of sheet.rows) {
  if (!row.google) continue;
  if (declined.has(row.google)) { skipped.push(row); continue; }
  const known = byLink.get(row.google);
  if (!known) { added.push(row); continue; }
  if (known.length > 1) continue;
  // The library is edited on purpose, so a difference is the sheet being out of date at
  // least as often as it is news. Counted for a person to ask for, never written.
  const fields = ["name", "category", "comment", "highlight"].filter(
    (f) => String(row[f] ?? "") !== String(known[0][f] ?? "") && row[f] !== "",
  );
  if (fields.length) disagrees.push({ known: known[0], row, fields });
}
const absent = library.filter((p) => !sheet.rows.some((r) => r.google === p.google));

/**
 * Checked on the proposed rows only, for the reason above: a name that would collide once
 * written, or two proposed rows claiming one name.
 */
{
  const taken = new Map(library.map((p) => [p.name, "already in the library"]));
  const clashes = [];
  for (const row of added) {
    const why = taken.get(row.name);
    if (why) clashes.push(`  ${row.name}: ${why}`);
    else taken.set(row.name, "proposed twice by the sheet");
  }
  if (clashes.length) {
    throw new Error(
      `${clashes.length} proposed row(s) would collide on name:\n${clashes.join("\n")}\n\n` +
        `A place is keyed by name in GUIDE_DISTANCES, so the guide build refuses a file ` +
        `where two share one. Name them apart in the sheet, or decline the row here. ` +
        `Nothing was written.`,
    );
  }
}

// --- report ------------------------------------------------------------------

console.log(`sheet: ${sheet.rows.length} rows  |  library: ${library.length} places`);
console.log(`sheet columns: ${sheet.head.join(", ")}\n`);

for (const row of added) {
  console.log(`+ ${row.name}  [${row.category || "no category"}]`);
  console.log(`    ${row.google}`);
  if (row.comment) console.log(`    ${row.comment.slice(0, 100)}`);
}

if (disagrees.length && !SHOW_DIFFS) {
  // Quiet on purpose. Thirty of these are typos this repository corrected and the sheet
  // still has, so they are the expected state rather than news, and a list that says the
  // same thirty things on every run is a list nobody reads. The count still appears, so
  // nobody has to know the flag exists to know there is something behind it.
  console.log(`\n${disagrees.length} row(s) differ from the library. Never written; --differences lists them.`);
} else if (disagrees.length) {
  console.log(`\n${disagrees.length} row(s) differ from the library. Never written, read and decide:`);
  for (const d of disagrees) {
    console.log(`~ ${d.known.name}`);
    for (const f of d.fields) {
      console.log(`    ${f}: library ${JSON.stringify(d.known[f])}`);
      console.log(`    ${" ".repeat(f.length)}  sheet   ${JSON.stringify(d.row[f])}`);
    }
  }
}

if (skipped.length) {
  console.log(`\n${skipped.length} declined row(s), left in the sheet and out of the library:`);
  for (const row of skipped) console.log(`    ${row.name}: ${declined.get(row.google)}`);
}

console.log(`\n${absent.length} library place(s) are not in the sheet. Left alone, never deleted.`);

if (!added.length) {
  console.log("\nNothing to import: the sheet proposes no place the library does not have.");
  process.exit(0);
}

if (!APPLY) {
  console.log(`\n${added.length} to add. Re-run with --apply to append them to guide-places.csv.`);
  process.exit(0);
}

// --- apply -------------------------------------------------------------------

const existing = readFileSync(PLACES_PATH, "utf8");
const appended = added
  .map((row) =>
    [row.category, (row.highlight ? `${HIGHLIGHT} ` : "") + row.name, row.google, row.apple, row.comment]
      .map(csvField)
      .join(","),
  )
  .join("\n");
writeFileSync(PLACES_PATH, (existing.endsWith("\n") ? existing : existing + "\n") + appended + "\n", "utf8");

console.log(`\napplied: ${added.length} appended, ${library.length + added.length} in the library.`);
console.log("Read the diff, then run `npm run guide`. Tags and a website go in guide-extras.json.");
