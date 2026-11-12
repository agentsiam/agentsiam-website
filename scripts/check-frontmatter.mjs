/**
 * Holds the frontmatter writer to the client template, and to the cases that would lose
 * data quietly: a value with a colon, a value YAML would read as a boolean, a guidance
 * comment, a key that is not there yet.
 *
 * Reads only.
 *
 *   node scripts/check-frontmatter.mjs [path-to-agentsiam-consulting]
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  splitDocument,
  joinDocument,
  readValue,
  setValue,
  keys,
} from "../src/lib/admin/frontmatter.ts";

const store =
  process.argv[2] ??
  process.env.CRM_LOCAL_PATH ??
  "/Users/paulb/code/agentsiam/agentsiam-consulting";

let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures += 1;
  console.log((ok ? "  ok    " : "  FAIL  ") + name + (!ok && detail ? `\n        ${detail}` : ""));
};

const path = join(store, "as-salesmarketing/01-crm/clients/_template.md");
const text = await readFile(path, "utf8");

console.log("clients/_template.md");
const document = splitDocument(text);
check("read and written back is byte for byte the same file", joinDocument(document) === text);
check("every key in the template is found", keys(document.frontmatter).length >= 20, String(keys(document.frontmatter).length));
check("a guidance comment is not part of the value", readValue(document.frontmatter, "status") === "active", JSON.stringify(readValue(document.frontmatter, "status")));
check("notice_period_days reads as its number", readValue(document.frontmatter, "notice_period_days") === "60");
check("an empty value reads as empty", readValue(document.frontmatter, "name") === "");

console.log("\nwriting");
const one = setValue(document.frontmatter, "name", "K. Somchai");
check("setting one key changes one line", diffLines(document.frontmatter, one) === 1, String(diffLines(document.frontmatter, one)));
check("and it reads back", readValue(one, "name") === "K. Somchai");
check("every other key is untouched", readValue(one, "notice_period_days") === "60");

const colon = setValue(document.frontmatter, "area", "Hang Dong: Ban Waen");
check("a value with a colon survives", readValue(colon, "area") === "Hang Dong: Ban Waen", JSON.stringify(readValue(colon, "area")));

const boolish = setValue(document.frontmatter, "preferred_language", "no");
check("a value YAML would read as false survives as text", readValue(boolish, "preferred_language") === "no");

const added = setValue(document.frontmatter, "a_key_not_in_the_template", "x");
check("a key that is not there is added", readValue(added, "a_key_not_in_the_template") === "x");
check("and nothing else moved", keys(added).length === keys(document.frontmatter).length + 1);

const cleared = setValue(one, "name", "");
check("a value can be cleared again", readValue(cleared, "name") === "");

function diffLines(a, b) {
  const left = a.split("\n");
  const right = b.split("\n");
  let n = Math.abs(left.length - right.length);
  for (let i = 0; i < Math.min(left.length, right.length); i += 1) if (left[i] !== right[i]) n += 1;
  return n;
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} failed.`);
process.exit(failures === 0 ? 0 : 1);
