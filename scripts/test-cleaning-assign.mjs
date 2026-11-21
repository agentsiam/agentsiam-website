/*
 * Drives the assignment override against a real store, which here is a throwaway file.
 *
 *   npm run test:cleaning-assign
 *
 * **Why this file exists.** Paul, 18/11/2026: the cleaners are freelancers, so a clean one of
 * them turns down goes back to the admin and the admin gives it to another cleaner. That is
 * the first thing in this app that changes who does a job, and it does it by laying a record
 * over documents the `cleaning-schedule` skill keeps republishing. Four things have to stay
 * true at once, and three of them fail silently.
 *
 * The clean has to leave the first cleaner's schedule and appear on the second one's, which
 * means two people's documents are read and merged on every render. The line has to stop
 * naming the first cleaner, because a job line is finished Thai text with her name in it and
 * printing it unchanged would tell the second cleaner the job is somebody else's. The house
 * has to travel, or the new cleaner has a job with no address. And **the door codes must not
 * travel**, because an access block carries that person's own code for that house and
 * per-person codes exist so that a lost phone costs one lock slot.
 *
 * The fourth is the one that would rot quietly: a move stands against the clean as it was,
 * so a clean that moves in time or gains a cot is a different clean and the override lapses
 * rather than binding somebody to work nobody showed her. Same rule as the accept record.
 *
 * It writes to a temporary file store, not to a mock, so `scheduleFor` runs exactly as it
 * does in production and reads the documents the way the app reads them.
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
const out = mkdtempSync(join(cache, "cleaning-assign-"));

/** One visit as the skill publishes one: finished line, and the structure beside it. */
function visit(date, time, property, who, label) {
  return {
    date,
    time,
    type: "turnover",
    booking: null,
    property,
    day_label: label,
    with: [],
    note: "",
    line: `${label} - ${time} (${who})`,
  };
}

const documents = join(out, "documents.json");
function publish(aunVisits, daVisits) {
  writeFileSync(
    documents,
    JSON.stringify({
      built_at: "2026-11-18T00:00:00Z",
      people: {
        aun: {
          key: "aun",
          name: "อัน",
          lang: "th",
          role: "cleaning",
          title: "คิวทำความสะอาด",
          properties: [
            { id: "lotus", name: "Lotus House", address: "42 Veing Ping Rd", map: null },
          ],
          access: [
            { heading: "รหัสเข้าบ้าน:", lines: ["ประตูดิจิทัล: 222222"], property: "lotus" },
          ],
          visits: aunVisits,
        },
        da: {
          key: "da",
          name: "ดา",
          lang: "th",
          role: "cleaning",
          title: "คิวทำความสะอาด",
          properties: [],
          access: [],
          visits: daVisits,
        },
      },
    }),
  );
}

const WEEKEND = visit("2026-12-20", "12.00", "lotus", "อัน", "อาทิตย์ 20 ธค");
const APRIL = visit("2027-04-24", "12.00", "lotus", "อัน", "เสาร์ 24 เมย");
const HERS = visit("2026-12-21", "10.00", "lotus", "ดา", "จันทร์ 21 ธค");
publish([WEEKEND, APRIL], [HERS]);

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
      "src/lib/cleaning/assign.ts",
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
const { clearMove, moveHolds, movedAway, moveVisit, readAssignments, scheduleFor } = require(join(out, "assign.js"));
const { agreedShape } = require(join(out, "accept.js"));
const { accessFor, parseDocument } = require(join(out, "document.js"));

let failures = 0;
let ran = 0;

function check(name, actual, expected) {
  const ok = actual === expected;
  ran += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}  (${String(actual)})`);
}

const TODAY = "2026-11-19";
const SLUG = "2026-12-20-1200-lotus";

console.log("\nwith nothing moved, a schedule is the published document");
let aun = await scheduleFor("aun");
let da = await scheduleFor("da");
check("aun has both of hers", aun.visits.length, 2);
check("da has her own", da.visits.length, 1);
check("and the line is the skill's own", da.visits[0].line, HERS.line);

console.log("\none clean, moved");
await moveVisit({ slug: SLUG, from: "aun", to: "da", line: WEEKEND.line }, TODAY);
aun = await scheduleFor("aun");
da = await scheduleFor("da");
check("it is off the schedule of the person it was published to", aun.visits.length, 1);
check("and the one she keeps is the other one", aun.visits[0].date, "2027-04-24");
check("it is on the new cleaner's schedule", da.visits.length, 2);
check("in date order with her own, which puts it first", da.visits[0].date, "2026-12-20");

console.log("\nwhat travels with it, and what does not");
const moved = da.visits.find((one) => one.date === "2026-12-20");
check("the line no longer names the other cleaner", moved.line.includes("อัน"), false);
check("it is the published day label and the published time", moved.line, "อาทิตย์ 20 ธค - 12.00");
check("the house comes with it", da.properties.some((one) => one.id === "lotus"), true);
check("its address too", da.properties.find((one) => one.id === "lotus").address, "42 Veing Ping Rd");
check("the door codes do not", accessFor(da, "lotus"), null);
check("and the other cleaner keeps hers", accessFor(await scheduleFor("aun"), "lotus") !== null, true);

console.log("\nwhose code is in a block, which is a fact and not a sentence");
const withField = parseDocument({
  key: "pa", title: "x",
  access: [{ heading: "h", lines: ["gate"], property: "lotus", own_code: false }],
});
const legacy = parseDocument({
  key: "da", title: "x",
  access: [{ heading: "h", lines: ["gate", "door"], property: "lotus" }],
});
check("a block saying so carries no code of hers", accessFor(withField, "lotus").ownCode, false);
check("one published before the field reads as hers", accessFor(legacy, "lotus").ownCode, true);
check("and the lines are untouched either way", accessFor(withField, "lotus").lines.length, 1);

console.log("\na clean that changes is a different clean");
publish([{ ...WEEKEND, note: "เพิ่มเตียงเด็ก", line: `${WEEKEND.line} เพิ่มเตียงเด็ก` }, APRIL], [HERS]);
aun = await scheduleFor("aun");
da = await scheduleFor("da");
check("the move lapses and it goes back", aun.visits.length, 2);
check("and it is off the new cleaner's schedule", da.visits.length, 1);
publish([WEEKEND, APRIL], [HERS]);
check("and it holds again once the line is what it was", (await scheduleFor("da")).visits.length, 2);

console.log("\ngiving it back");
await clearMove(SLUG, TODAY);
check("nothing is moved", (await readAssignments()).size, 0);
check("she has both of hers again", (await scheduleFor("aun")).visits.length, 2);
check("and the other cleaner has only her own", (await scheduleFor("da")).visits.length, 1);

console.log("\nPaul's overview asks whether a move stands the way the schedules do");
// It compared the stored line with the published one, and the admin route stores the agreed
// shape, so every move made from that screen since 19/11/2026 was missed there.
const standing = (await scheduleFor("aun")).visits.find((one) => one.date === "2026-12-20");
const recorded = (line) => ({ slug: SLUG, from: "aun", to: "da", line, at: "" });
check("the agreed shape is not the line, which is what the overview missed", agreedShape(standing) === standing.line, false);
check("a move as the admin screen records it stands", moveHolds(recorded(agreedShape(standing)), standing), true);
check("so does one recorded before that, by its line", moveHolds(recorded(standing.line), standing), true);
check("a clean that gained a cot is a different clean", moveHolds(recorded(agreedShape(standing)), { ...standing, note: "เพิ่มเตียงเด็ก" }), false);
check("and no move is no move", moveHolds(undefined, standing), false);
check("the cleaner it was taken from has had it moved away", movedAway(recorded(agreedShape(standing)), "aun", standing), true);
check("her laundry colleague on the same slug has not", movedAway(recorded(agreedShape(standing)), "ting", standing), false);
check("nor has the cleaner it was given to", movedAway(recorded(agreedShape(standing)), "da", standing), false);

console.log("\nthe record does not grow for ever");
await moveVisit({ slug: "2026-01-01-1200-lotus", from: "aun", to: "da", line: "x" }, TODAY);
check("a move for a clean that has happened is pruned", (await readAssignments()).size, 0);

rmSync(out, { recursive: true, force: true });

console.log(`\n${ran - failures}/${ran} passed`);
if (failures > 0) process.exit(1);
