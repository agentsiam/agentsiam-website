/*
 * Drives the ledger of cleans she has already done, against a real store.
 *
 *   npm run test:cleaning-history
 *
 * **Why this file exists.** Paul, 19/11/2026: the cleaner has to be able to look back at the
 * past month, because AgentSiam pays her for that work and the payslip goes into the comments
 * on the clean itself. The scenario that breaks without this is one day long: she cleans on
 * the Thursday, and on the Friday the overnight run publishes a schedule that starts on the
 * Friday, so the clean she wants to check is gone from every screen she has.
 *
 * The ledger is the one place this app keeps schedule-shaped rows of its own, so the rules
 * that keep it from becoming a second schedule are what this file holds to:
 *
 *   nothing ahead of her is ever shown out of it, however much it holds
 *   a clean that left her schedule before it happened was never hers, and goes
 *   a clean already behind her stays, whatever the schedule says now
 *   ninety days, and no more
 *
 * The second and third are the pair that is easy to get backwards, and getting them backwards
 * shows her a clean she did not do on the one screen where she checks she has been paid.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const repo = join(here, "..");
const cache = join(repo, "node_modules", ".cache");
mkdirSync(cache, { recursive: true });
const out = mkdtempSync(join(cache, "cleaning-history-"));

const documents = join(out, "documents.json");
writeFileSync(documents, JSON.stringify({ built_at: "2026-11-19T00:00:00Z", people: {} }));
process.env.CLEANING_LOCAL_PATH = documents;
process.env.KV_REST_API_URL = "";
process.env.KV_REST_API_TOKEN = "";
process.env.UPSTASH_REDIS_REST_URL = "";
process.env.UPSTASH_REDIS_REST_TOKEN = "";

try {
  execFileSync(
    "npx",
    [
      "tsc",
      "src/lib/cleaning/history.ts",
      "--outDir",
      out,
      "--module",
      "commonjs",
      "--moduleResolution",
      "node",
      "--target",
      "es2022",
      "--esModuleInterop",
      "--skipLibCheck",
    ],
    { cwd: repo, stdio: "inherit" },
  );
} catch {
  console.error("the modules did not compile, so nothing below was run");
  rmSync(out, { recursive: true, force: true });
  process.exit(1);
}

const require = createRequire(join(out, "test.cjs"));
const { asVisit, before, pastVisits, recordHistory } = require(join(out, "history.js"));
const { visitSlug } = require(join(out, "document.js"));

let failures = 0;
let ran = 0;

function check(name, actual, expected) {
  const ok = actual === expected;
  ran += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}  (${String(actual)})`);
}

/** A visit as the published document carries one. */
function visit(date, time, label) {
  return {
    date,
    time,
    type: "turnover",
    booking: null,
    line: `${label} - ${time} (ดา)`,
    property: null,
    dayLabel: label,
    with: [],
    note: null,
  };
}

const TODAY = "2026-11-19";
const house = () => "Lotus House";

const yesterday = visit("2026-11-18", "12.00", "พุธ 18 พย");
const todayJob = visit("2026-11-19", "12.00", "พฤหัส 19 พย");
const nextWeek = visit("2026-11-26", "12.00", "พฤหัส 26 พย");

console.log("\nwhat she is shown goes in, whenever it happens");
await recordHistory("da", [yesterday, todayJob, nextWeek], house, TODAY);
let kept = await pastVisits("da");
check("all three are remembered", kept.length, 3);
check("and only yesterday is behind her", before(kept, TODAY).length, 1);
check("which is the one she did", before(kept, TODAY)[0].slug, "2026-11-18-1200-one");
check("with the house she did it at", before(kept, TODAY)[0].house, "Lotus House");

console.log("\nthe run moves on and the document drops it");
await recordHistory("da", [todayJob, nextWeek], house, TODAY);
kept = await pastVisits("da");
check("the clean she did is still there", before(kept, TODAY).length, 1);
check("which is the whole point of the ledger", before(kept, TODAY)[0].date, "2026-11-18");

console.log("\na clean taken off her before it happened was never hers");
await recordHistory("da", [todayJob], house, TODAY);
kept = await pastVisits("da");
check("next week is dropped", kept.some((one) => one.date === "2026-11-26"), false);
check("and what is behind her is untouched", before(kept, TODAY).length, 1);

console.log("\nthe day turns");
const TOMORROW = "2026-11-20";
await recordHistory("da", [nextWeek], house, TOMORROW);
kept = await pastVisits("da");
check("today's clean is now behind her", before(kept, TOMORROW).some((one) => one.date === "2026-11-19"), true);
check("and is not shown as ahead of her", before(kept, TOMORROW).some((one) => one.date === "2026-11-26"), false);

console.log("\nninety days and no more");
await recordHistory("da", [visit("2026-06-01", "12.00", "จันทร์ 1 มิย")], house, TODAY);
kept = await pastVisits("da");
check("a clean from June is not kept in November", kept.some((one) => one.date === "2026-06-01"), false);

console.log("\na ledger entry is a visit a screen can draw");
const drawn = asVisit({ slug: "2026-11-18-1200-275645", date: "2026-11-18", label: "พุธ 18 พย", time: "12.00", house: "Lotus House" });
const oneHouse = asVisit({ slug: "2026-11-18-1200-one", date: "2026-11-18", label: "พุธ 18 พย", time: "12.00", house: "" });
check("its line is the day and the hour", drawn.line, "พุธ 18 พย - 12.00");
check("it names nobody", drawn.line.includes("("), false);
check("it knows which house it was at", drawn.property, "275645");
check(
  "so the slug it is drawn under is the slug it was stored under",
  visitSlug(drawn),
  "2026-11-18-1200-275645",
);
check("and nothing to accept", drawn.type, null);
check("a one-house clean keeps its own form", visitSlug(oneHouse), "2026-11-18-1200-one");

rmSync(out, { recursive: true, force: true });

console.log(`\n${ran - failures}/${ran} passed`);
if (failures > 0) process.exit(1);
