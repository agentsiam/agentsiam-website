/*
 * Holds the two string tables to the promise the switch makes.
 *
 *   npm run test:cleaning-strings
 *
 * **Why this file exists.** Paul, 18/11/2026: the cleaner should be able to switch between
 * English and Thai, and the Thai version must carry zero English. The first half is code and
 * is visible on a screen. The second half is a property of a table of sentences, which is
 * exactly the kind of thing that is true the day it is written and false three edits later,
 * because the natural way to write a Thai sentence about a PIN is to write the word PIN in
 * it. So the no-English half is a test rather than a promise, and it runs over the real
 * module.
 *
 * What it checks, in the order it matters: no Latin letter anywhere in the Thai table, no
 * Thai character anywhere in the English one, the two tables carrying exactly the same slots,
 * and nothing in either left as a placeholder. The placeholder check is the one that would
 * otherwise hide the rest: an unwritten slot renders as nothing, so a screen missing a
 * sentence looks finished.
 *
 * `{when}` is stripped before the Latin check, because it is a substitution the app fills
 * with digits and not a word anybody reads. TEAM_LANG_NAMES is exempt from the Latin check
 * and nothing else is: the switch names each language in its own language, which is the one
 * Latin word on a Thai screen and is deliberate.
 *
 * **What it does not prove.** That the Thai is good Thai, or that the English says what the
 * Thai says. Every sentence in both tables is a draft of mine; the Thai has never been read
 * by a native speaker and the correction sheet for it is in the document store, named in
 * src/lib/cleaning/strings.ts.
 *
 * It compiles the one module it imports, which has no imports of its own, into a temporary
 * directory under node_modules. Nothing in the repository is written.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const repo = join(here, "..");
const cache = join(repo, "node_modules", ".cache");
mkdirSync(cache, { recursive: true });
const out = mkdtempSync(join(cache, "cleaning-strings-"));

try {
  execFileSync(
    "npx",
    [
      "tsc",
      "src/lib/cleaning/strings.ts",
      "--outDir",
      out,
      "--module",
      "commonjs",
      "--moduleResolution",
      "node",
      "--target",
      "es2022",
      "--skipLibCheck",
    ],
    { cwd: repo, stdio: "inherit" },
  );
} catch {
  console.error("the module did not compile, so nothing below was run");
  rmSync(out, { recursive: true, force: true });
  process.exit(1);
}

const require = createRequire(join(out, "test.cjs"));
const {
  TEAM_STRINGS_TH,
  TEAM_STRINGS_EN,
  TEAM_LANGS,
  TEAM_LANG_NAMES,
  CALENDAR_WEEKDAYS_TH,
  CALENDAR_WEEKDAYS_EN,
  PENDING_MARKS,
  asTeamLang,
  builtAtLine,
  calendarWeekdays,
  teamStrings,
  weekdaysWritten,
  written,
} = require(join(out, "strings.js"));

let failures = 0;
let ran = 0;

function check(name, actual, expected) {
  const ok = actual === expected;
  ran += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}  (${String(actual)})`);
}

/** A string as a reader meets it: substitutions gone, because the app fills them with
 * digits, and the digits are the same in both languages. */
function spoken(value) {
  return value.replace(/\{[^}]*\}/g, "");
}

const latin = /[A-Za-z]/;
const thai = /[฀-๿]/;

/** Every slot whose value breaks a rule, named, so a failure says which sentence. */
function offenders(table, pattern) {
  return Object.entries(table)
    .filter(([, value]) => pattern.test(spoken(value)))
    .map(([key]) => key);
}

console.log("\nthe Thai version carries no English");
check("no Latin letter in any Thai string", offenders(TEAM_STRINGS_TH, latin).join(",") || "none", "none");
check(
  "no Latin letter in the Thai weekday headings",
  CALENDAR_WEEKDAYS_TH.filter((day) => latin.test(day)).join(",") || "none",
  "none",
);

console.log("\nthe English version carries no Thai");
check("no Thai character in any English string", offenders(TEAM_STRINGS_EN, thai).join(",") || "none", "none");
check(
  "every English string says something",
  Object.entries(TEAM_STRINGS_EN)
    .filter(([, value]) => !latin.test(value))
    .map(([key]) => key)
    .join(",") || "none",
  "none",
);
check(
  "no Thai character in the English weekday headings",
  CALENDAR_WEEKDAYS_EN.filter((day) => thai.test(day)).join(",") || "none",
  "none",
);

console.log("\nthe two tables are the same shape");
const thKeys = Object.keys(TEAM_STRINGS_TH).sort().join(",");
const enKeys = Object.keys(TEAM_STRINGS_EN).sort().join(",");
check("the same slots in both", enKeys, thKeys);
check("both weekday rows are seven columns", `${CALENDAR_WEEKDAYS_TH.length},${CALENDAR_WEEKDAYS_EN.length}`, "7,7");
check("two languages and no more", TEAM_LANGS.join(","), "th,en");

console.log("\nnothing is waiting to be written");
for (const [lang, table] of [["Thai", TEAM_STRINGS_TH], ["English", TEAM_STRINGS_EN]]) {
  check(
    `every ${lang} slot is written`,
    Object.entries(table)
      .filter(([, value]) => written(value) === "")
      .map(([key]) => key)
      .join(",") || "none",
    "none",
  );
}
check("both weekday rows are written", `${weekdaysWritten("th")},${weekdaysWritten("en")}`, "true,true");
for (const mark of PENDING_MARKS) {
  check(`a ${mark} placeholder renders as nothing`, written(`${mark} something]`), "");
}

console.log("\nthe switch picks a table and nothing picks one for it");
check("th", teamStrings("th").commentSend, TEAM_STRINGS_TH.commentSend);
check("en", teamStrings("en").commentSend, TEAM_STRINGS_EN.commentSend);
check("the weekday row follows the language", calendarWeekdays("en")[0], CALENDAR_WEEKDAYS_EN[0]);
check("the switch names Thai in Thai", latin.test(TEAM_LANG_NAMES.th), false);
check("the switch names English in English", thai.test(TEAM_LANG_NAMES.en), false);

console.log("\nwhat a cookie may say");
check("th is a language", asTeamLang("th"), "th");
check("en is a language", asTeamLang("en"), "en");
check("a locale from the public site is not", asTeamLang("zh"), null);
check("an empty cookie is not", asTeamLang(""), null);
check("no cookie at all is not", asTeamLang(undefined), null);
check("a crafted value is not", asTeamLang("en; path=/"), null);

console.log("\nthe one line that is composed rather than written");
check("the Thai line takes the digits", builtAtLine("th", "18/11/2026 14:56").includes("18/11/2026 14:56"), true);
check("the English line takes the digits", builtAtLine("en", "18/11/2026 14:56").includes("18/11/2026 14:56"), true);
check("and neither leaves the token behind", builtAtLine("en", "x").includes("{when}"), false);

rmSync(out, { recursive: true, force: true });

console.log(`\n${ran - failures}/${ran} passed`);
if (failures > 0) process.exit(1);
