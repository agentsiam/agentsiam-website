/*
 * Drives a clean moved to another date or hour against a real store, which here is a
 * throwaway file.
 *
 *   npm run test:cleaning-when
 *
 * **Why this file exists.** Paul, 20/11/2026: he wants to move a clean to a new date and
 * time; moving it asks him again who to assign it to; if the hour moved the laundry run has
 * to accept it again; and if the hour did not move, only the cleaner changed, so the laundry
 * run does not. Those are four rules about one record and they pull against each other, which
 * is what this file is for.
 *
 * **The hour was never in the accepted shape**, because it was in the slug, and a moved clean
 * keeps the slug it was published under. So the hour it moved to is what goes into the shape,
 * and only when there is one: every clean nobody has moved keeps the shape it already had, so
 * nobody is asked again for a change of format. That is the second and fourth rules together,
 * and the checks below are what hold them apart.
 *
 * **A move ends a standing assignment**, which is the third rule and is not written anywhere
 * as an instruction: it falls out of the shape carrying the hour, so a clean whose hour moved
 * is a different clean and goes back to whoever the skill published it to, waiting to be
 * given out again.
 *
 * The other half is what a move must not do. It must not change the slug, because the thread,
 * the answers and the ledger row all hang off it. It must not outlive the clean it was made
 * against: a cot added to that clean puts the hour back. And it must never print a Thai date
 * this app composed, so a clean moved to another day loses the published Thai day rather than
 * carrying one that names the wrong date.
 *
 * **What it does not prove.** Anything on a screen: that the control appears under a clean,
 * that the warning about the Thai date is readable, or that Paul's own screen refreshes.
 * /admin/cleaning is behind the admin passphrase and was not opened.
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
const out = mkdtempSync(join(cache, "cleaning-when-"));

const DATE = "2026-12-16";
const MOVED = "2026-12-17";
const TODAY = "2026-11-20";
const SLUG = "2026-12-16-1200-275645";

/** One visit as a published document carries one. The Thai is the skill's own and is only
 * ever copied here, never composed. */
function visit(extra = {}) {
  return {
    date: DATE,
    time: "12.00",
    type: "turnover",
    booking: "B1",
    line: "พุธ 16 ธค - 12.00 (ดา)",
    property: "275645",
    day_label: "พุธ 16 ธค",
    with: [],
    note: null,
    ...extra,
  };
}

function documents(extra = {}) {
  return {
    built_at: "2026-11-20T00:00:00Z",
    people: {
      da: { key: "da", name: "ดา", lang: "th", role: "cleaning", title: "คิวทำความสะอาด", visits: [visit()] },
      ting: {
        key: "ting",
        name: "ติ๋ง",
        lang: "th",
        role: "laundry",
        title: "คิวส่งผ้า",
        visits: [visit({ line: "พุธ 16 ธค - 12.00 (ติ๋ง)" })],
      },
      aun: { key: "aun", name: "อัน", lang: "th", role: "cleaning", title: "คิวทำความสะอาด", visits: [] },
      ...extra,
    },
  };
}

const path = join(out, "documents.json");
writeFileSync(path, JSON.stringify(documents()));
process.env.CLEANING_LOCAL_PATH = path;
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
const { moveVisit, scheduleFor } = require(join(out, "assign.js"));
const { acceptState, agreedShape, answerVisit } = require(join(out, "accept.js"));
const { cleanTime, clearWhen, moveWhen, readWhenMoves } = require(join(out, "when.js"));
const { visitSlug } = require(join(out, "document.js"));
const { plainLine } = require(join(out, "english.js"));

let failures = 0;
let ran = 0;

function check(name, actual, expected) {
  const ok = actual === expected;
  ran += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}  (${String(actual)})`);
}

async function hers(person) {
  const document = await scheduleFor(person);
  return document?.visits ?? [];
}

async function waitingFor(person) {
  const visits = await hers(person);
  const state = await acceptState(person, visits);
  return state.waiting.size;
}

/**
 * Move the clean, the way the admin route does: from the screen of whoever holds it now, and
 * the shape stored is the published one rather than the one carrying the last move.
 */
async function move(date, time, person = "da") {
  const mine = await hers(person);
  const one = mine.find((v) => visitSlug(v) === SLUG);
  if (!one) throw new Error(`${person} has no ${SLUG} to move`);
  await moveWhen(
    { slug: SLUG, date, time, shape: agreedShape({ ...one, movedTo: undefined }) },
    TODAY,
  );
}

console.log("\nthe hour comes from the document until somebody moves it");
check("da has the clean at noon", (await hers("da"))[0]?.time, "12.00");
check("so does ting, on the same slug", visitSlug((await hers("ting"))[0]), SLUG);
check("both accepted", await answerVisit("da", await hers("da"), SLUG, "yes"), true);
await answerVisit("ting", await hers("ting"), SLUG, "yes");
check("nothing is waiting", (await waitingFor("da")) + (await waitingFor("ting")), 0);

console.log("\nmoving the hour moves it for both of them, and asks both again");
await move(DATE, "15.00");
check("da reads the new hour", (await hers("da"))[0]?.time, "15.00");
check("ting reads it too", (await hers("ting"))[0]?.time, "15.00");
check("the slug did not move", visitSlug((await hers("da"))[0]), SLUG);
check("da is asked again", await waitingFor("da"), 1);
check("ting is asked again", await waitingFor("ting"), 1);
check("and her Thai day is still the skill's", (await hers("da"))[0]?.dayLabel, "พุธ 16 ธค");
check("the line reads the new hour", plainLine((await hers("da"))[0]), "พุธ 16 ธค - 15.00");

console.log("\nputting it back restores the hour and the answers with it");
await clearWhen(SLUG, TODAY);
check("da reads noon again", (await hers("da"))[0]?.time, "12.00");
check("nothing is waiting", (await waitingFor("da")) + (await waitingFor("ting")), 0);

console.log("\nchanging the cleaner alone leaves the laundry run's answer standing");
const mine = await hers("da");
await moveVisit({ slug: SLUG, from: "da", to: "aun", line: agreedShape(mine[0]) }, TODAY);
check("it left da", (await hers("da")).length, 0);
check("ting still has it", (await hers("ting")).length, 1);
check("and ting is not asked again", await waitingFor("ting"), 0);

console.log("\nmoving the hour ends the assignment, so Paul is asked who it goes to");
await move(DATE, "16.00", "aun");
check("it is back with da", (await hers("da")).length, 1);
check("at the moved hour", (await hers("da"))[0]?.time, "16.00");
check("aun does not have it", (await hers("aun")).length, 0);
check("and ting is asked again", await waitingFor("ting"), 1);

console.log("\nanother day drops the Thai date rather than printing the wrong one");
await move(MOVED, "09.00");
const moved = (await hers("da"))[0];
check("it lands on the new day", moved?.date, MOVED);
check("the slug is still the published one", visitSlug(moved), SLUG);
check("the Thai day is gone", moved?.dayLabel, null);
check("and the line is the hour alone", plainLine(moved), "09.00");

console.log("\na second move works, which it would not if the shape carried the first");
await move(MOVED, "10.00");
check("the hour moved again", (await hers("da"))[0]?.time, "10.00");

console.log("\na clean that changes puts the hour back");
writeFileSync(
  path,
  JSON.stringify(
    documents({
      da: { key: "da", name: "ดา", lang: "th", role: "cleaning", title: "คิวทำความสะอาด", visits: [visit({ note: "เพิ่มเตียงเด็ก" })] },
    }),
  ),
);
check("the move lapsed", (await hers("da"))[0]?.time, "12.00");
check("and the day came back with it", (await hers("da"))[0]?.date, DATE);
writeFileSync(path, JSON.stringify(documents()));

console.log("\nan hour is read the way a person types it and written the way a document does");
check("with a colon", cleanTime("15:30"), "15.30");
check("with nothing", cleanTime("1530"), "15.30");
check("with a dot", cleanTime("09.00"), "09.00");
check("twenty five o'clock is not an hour", cleanTime("25.00"), null);
check("nor is half of one", cleanTime("15"), null);

console.log("\na move for a clean that has been and gone is pruned");
await moveWhen({ slug: "2026-01-01-1200-275645", date: "2026-01-02", time: "09.00", shape: "x" }, TODAY);
check("it is not kept", (await readWhenMoves()).has("2026-01-01-1200-275645"), false);
check("and the live one still is", (await readWhenMoves()).has(SLUG), true);

rmSync(out, { recursive: true, force: true });
console.log(`\n${ran - failures}/${ran} passed`);
process.exit(failures === 0 ? 0 : 1);
