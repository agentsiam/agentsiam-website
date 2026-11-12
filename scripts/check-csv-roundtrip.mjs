/**
 * Holds the CSV writer to the real CRM files.
 *
 * The admin edits rows in guest-leads.csv, leads.csv and property-pool.csv, files that are
 * also worked by hand and by Claude. The rule it has to keep is narrow and absolute: a cell
 * nobody edited comes back out byte for byte. So this reads each real file, writes it
 * straight back out and compares the bytes, then changes one cell and checks that the diff
 * is exactly that one cell.
 *
 * Reads only. Nothing here writes to the document store.
 *
 *   node scripts/check-csv-roundtrip.mjs [path-to-agentsiam-consulting]
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  parseCsv,
  formatCsv,
  updateCsvRow,
  appendCsvRow,
  csvColumn,
  nextId,
} from "../src/lib/admin/csv.ts";

const store =
  process.argv[2] ??
  process.env.CRM_LOCAL_PATH ??
  "/Users/paulb/code/agentsiam/agentsiam-consulting";

const FILES = [
  { path: "as-salesmarketing/01-crm/guest-leads.csv", idColumn: "lead_id" },
  { path: "as-salesmarketing/01-crm/leads.csv", idColumn: "lead_id" },
  { path: "as-salesmarketing/01-crm/property-pool.csv", idColumn: "property_id" },
];

let failures = 0;
const check = (name, condition, detail = "") => {
  if (condition) {
    console.log(`  ok    ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ""}`);
  }
};

for (const file of FILES) {
  const full = join(store, file.path);
  let text;
  try {
    text = await readFile(full, "utf8");
  } catch {
    console.log(`\n${file.path}\n  skipped, not at ${full}`);
    continue;
  }
  console.log(`\n${file.path}`);

  const rewritten = formatCsv(parseCsv(text), text.endsWith("\n"));
  const firstDifference = () => {
    for (let i = 0; i < Math.max(text.length, rewritten.length); i += 1) {
      if (text[i] !== rewritten[i]) {
        return `at byte ${i}: original ${JSON.stringify(text.slice(i - 20, i + 20))} became ${JSON.stringify(rewritten.slice(i - 20, i + 20))}`;
      }
    }
    return "lengths differ only at the end";
  };
  check("read and written back is byte for byte the same file", rewritten === text, rewritten === text ? "" : firstDifference());

  const ids = csvColumn(text, file.idColumn);
  if (ids.length === 0) {
    check("has at least one row to edit", false, "no ids in the file");
    continue;
  }

  const header = parseCsv(text)[0];
  const target = ids[0];
  const column = header.find((name) => name !== file.idColumn && name !== "");
  const marker = 'edited, with a comma, a "quote" and a trailing space ';
  const edited = updateCsvRow(text, file.idColumn, target, { [column]: marker });

  const before = parseCsv(text);
  const after = parseCsv(edited);
  check("the edit keeps the row count", before.length === after.length);
  const changedCells = [];
  after.forEach((row, r) =>
    row.forEach((cell, c) => {
      if ((before[r]?.[c] ?? "") !== cell) changedCells.push(`${r}:${header[c]}`);
    }),
  );
  check(
    "exactly one cell changed",
    changedCells.length === 1,
    `changed: ${changedCells.join(", ") || "nothing"}`,
  );
  check(
    "the edited cell survives a round trip with its comma, quote and trailing space",
    after.find((row) => row[header.indexOf(file.idColumn)] === target)?.[header.indexOf(column)] ===
      marker,
  );

  const added = appendCsvRow(text, { [file.idColumn]: "Z-9999" });
  check("appending adds one row", parseCsv(added).length === before.length + 1);
  check(
    "an appended row has every column the header names",
    parseCsv(added).at(-1).length === header.length,
  );
  check("appending leaves the original rows untouched", added.startsWith(text));

  let refused = false;
  try {
    updateCsvRow(text, file.idColumn, target, { not_a_real_column: "x" });
  } catch {
    refused = true;
  }
  check("a column the header does not name is refused", refused);

  let missingRefused = false;
  try {
    updateCsvRow(text, file.idColumn, "NOPE-0000", { [column]: "x" });
  } catch {
    missingRefused = true;
  }
  check("updating an id that is not there is refused rather than appended", missingRefused);

  const prefix = target.split("-")[0];
  const next = nextId(ids, prefix);
  check(
    `nextId gives ${next}, which is not already taken`,
    !ids.includes(next) && /^[A-Z]+-\d{4}$/.test(next),
  );
}

console.log(
  failures === 0 ? "\nAll checks passed." : `\n${failures} check${failures === 1 ? "" : "s"} failed.`,
);
process.exit(failures === 0 ? 0 : 1);
