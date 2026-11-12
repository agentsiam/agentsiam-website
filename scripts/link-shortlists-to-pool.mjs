/**
 * Give every shortlist candidate a `property_id`, once.
 *
 * Candidates and pool properties described the same buildings in two places that could not
 * be reconciled: a candidate carried a slug of its own making, a pool row carried a
 * `P-####`, and nothing joined them. From 12/11/2026 the admin links them on every save.
 * This does the same to what was written before that, so the pool is complete rather than
 * complete from today onwards.
 *
 * Matches on the name with punctuation and case removed, the same rule the admin uses, so a
 * property already in the pool is adopted rather than duplicated. Anything it cannot match
 * becomes a new pool row carrying what the candidate knows about the building.
 *
 * Reads and reports by default. Writes only with --write.
 *
 *   node scripts/link-shortlists-to-pool.mjs [path-to-agentsiam-consulting] [--write]
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { parseCsv, appendCsvRow, updateCsvRow, csvColumn, nextId } from "../src/lib/admin/csv.ts";
import {
  normalisedName,
  poolFactsFromCandidate,
  addOfferedTo,
  today,
} from "../src/lib/admin/types.ts";

const args = process.argv.slice(2);
const write = args.includes("--write");
const store =
  args.find((a) => !a.startsWith("--")) ??
  process.env.CRM_LOCAL_PATH ??
  "/Users/paulb/code/agentsiam/agentsiam-consulting";

const CRM = join(store, "as-salesmarketing/01-crm");
const POOL = join(CRM, "property-pool.csv");
const SHORTLISTS = join(CRM, "shortlists");

const rowsOf = (text) => {
  const [header, ...body] = parseCsv(text);
  return body
    .filter((row) => row.some((cell) => cell.length > 0))
    .map((row) => Object.fromEntries(header.map((name, i) => [name, row[i] ?? ""])));
};

let pool = await readFile(POOL, "utf8");
const files = (await readdir(SHORTLISTS)).filter((name) => name.endsWith(".json")).sort();

const plan = [];
const shortlistWrites = new Map();

for (const file of files) {
  const path = join(SHORTLISTS, file);
  const shortlist = JSON.parse(await readFile(path, "utf8"));
  const leadId = shortlist.lead_id ?? file.replace(/\.json$/, "");
  let touched = false;

  for (const candidate of shortlist.candidates ?? []) {
    if (candidate.property_id) {
      plan.push(`${leadId} ${candidate.id}: already linked to ${candidate.property_id}`);
      continue;
    }
    const wanted = normalisedName(candidate.property_name ?? "");
    const match = rowsOf(pool).find((row) => normalisedName(row.name) === wanted);
    const facts = poolFactsFromCandidate(candidate);

    if (match) {
      const offered = addOfferedTo(match.offered_to, leadId);
      const changes = { ...facts };
      if (offered !== match.offered_to) changes.offered_to = offered;
      pool = updateCsvRow(pool, "property_id", match.property_id, changes);
      candidate.property_id = match.property_id;
      plan.push(
        `${leadId} ${candidate.id}: matched "${candidate.property_name}" to existing ${match.property_id}` +
          (offered !== match.offered_to ? `, added ${leadId} to offered_to` : ""),
      );
    } else {
      const id = nextId(csvColumn(pool, "property_id"), "P");
      pool = appendCsvRow(pool, {
        ...facts,
        property_id: id,
        offered_to: leadId,
        first_contact_date: today(),
        status:
          candidate.available === "no"
            ? "not available"
            : candidate.available === "yes"
              ? "available"
              : "available, not yet contacted",
      });
      candidate.property_id = id;
      plan.push(`${leadId} ${candidate.id}: "${candidate.property_name}" is new, added as ${id}`);
    }
    touched = true;
  }

  if (touched) shortlistWrites.set(path, `${JSON.stringify(shortlist, null, 2)}\n`);
}

console.log("What this does:\n");
for (const line of plan) console.log(`  ${line}`);

// Pool rows that say they were offered to a lead no candidate points back at. Not fixed
// here: it means a candidate was removed from a shortlist, or the two drifted before they
// were linked, and which of those it was is not something a script can know.
const linked = new Set();
for (const [, text] of shortlistWrites) {
  for (const candidate of JSON.parse(text).candidates ?? []) linked.add(candidate.property_id);
}
const loose = rowsOf(pool).filter((row) => row.offered_to && !linked.has(row.property_id));
if (loose.length > 0) {
  console.log("\nOffered to a lead, with no candidate pointing back:\n");
  for (const row of loose) {
    console.log(`  ${row.property_id} ${row.name}, offered to ${row.offered_to}`);
  }
  console.log("\n  Left alone. Either the candidate was removed from the shortlist, or the two");
  console.log("  drifted before they were linked. A script cannot tell which.");
}

if (!write) {
  console.log("\nNothing written. Run again with --write to apply.");
} else {
  await writeFile(POOL, pool, "utf8");
  for (const [path, text] of shortlistWrites) await writeFile(path, text, "utf8");
  console.log(`\nWritten: property-pool.csv and ${shortlistWrites.size} shortlist file(s).`);
}
