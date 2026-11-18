/*
 * Drives the accept record against a real store, which here is a throwaway file.
 *
 *   npm run test:cleaning-accept
 *
 * **Why this file exists.** Paul, 18/11/2026: a new clean, and a clean that has moved, should
 * reach the cleaner as something to accept. What decides whether she is asked is a comparison,
 * and the comparison has two parts that are easy to get wrong in opposite directions. Too
 * strict and she is asked again every run for cleans she already took on, which teaches her to
 * tap without reading. Too loose and a clean that moved to another day counts as the one she
 * agreed to, which is the failure the whole flow exists to prevent.
 *
 * The case worth the most here is two houses on one day. `visitIdentity`, which the "changed
 * since you looked" marker uses, falls back to the date when a job has no booking id, so two
 * cleans on one date share an identity. Accepting the morning would have accepted the
 * afternoon. The accept record is keyed on the visit slug instead, and that is what the two
 * same-day checks below prove.
 *
 * **Both answers are a write to the same record**, which is the other half of what is easy to
 * get wrong. Paul, 18/11/2026: she has to be able to reject the new schedule as well. A clean
 * she declined must leave her waiting list, stay off her accepted list, and come back to
 * waiting if it then moves or gains a cot, because that is a different clean from the one she
 * said no to. And one clean carries one answer: declining and then accepting leaves her having
 * accepted, not both.
 *
 * It writes to a temporary file store, not to a mock, so `acceptState` and `answerVisit` run
 * exactly as they do in production and the record is read back the way the app reads it.
 *
 * **What it does not prove.** Anything about the screens: that the card appears, that the
 * button reaches the route, or that a refresh clears it. Those were checked by hand on a
 * phone-sized browser against the fixture.
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
const out = mkdtempSync(join(cache, "cleaning-accept-"));

// A store of its own, so a run cannot touch the fixture anybody is developing against, and
// cannot reach the real one whatever .env.local happens to say.
const documents = join(out, "documents.json");
writeFileSync(documents, JSON.stringify({ built_at: "2026-11-18T00:00:00Z", people: {} }));
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
      "src/lib/cleaning/accept.ts",
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
const { acceptState, answerVisit } = require(join(out, "accept.js"));

let failures = 0;
let ran = 0;

function check(name, actual, expected) {
  const ok = actual === expected;
  ran += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}  (${String(actual)})`);
}

/** A visit as the published document carries one, with only the fields this touches. */
function visit(date, time, property, line) {
  return { date, time, property, line, type: null, booking: null, dayLabel: null, with: [], note: null };
}

const morning = visit("2026-11-19", "12.00", "275645", "พฤ 19 พย - 12.00 (ดา)");
const afternoon = visit("2026-11-19", "15.00", "999999", "พฤ 19 พย - 15.00 (ดา)");
const later = visit("2026-11-26", "12.00", "275645", "พฤ 26 พย - 12.00 (ดา)");
const all = [morning, afternoon, later];

const MORNING = "2026-11-19-1200-275645";
const AFTERNOON = "2026-11-19-1500-999999";
const LATER = "2026-11-26-1200-275645";

console.log("\nnothing is accepted until she accepts it");
let state = await acceptState("da", all);
check("all three are waiting", state.waiting.size, 3);
check("and none has a time against it", state.takenAt.size, 0);

console.log("\none tap, one clean");
check("the morning is taken", await answerVisit("da", all, MORNING, "yes"), true);
state = await acceptState("da", all);
check("the morning is no longer waiting", state.waiting.has(MORNING), false);
check("it carries when she took it", typeof state.takenAt.get(MORNING), "string");

console.log("\ntwo houses on one day, which is where a date key would have failed");
check("the afternoon is still waiting", state.waiting.has(AFTERNOON), true);
check("and the later clean too", state.waiting.has(LATER), true);
check("so two of three are waiting", state.waiting.size, 2);

console.log("\na clean that changes goes back to waiting");
const reworded = { ...morning, line: "พฤ 19 พย - 12.00 (ดา) เพิ่มเตียงเด็ก" };
state = await acceptState("da", [reworded, afternoon, later]);
check("a new note on the line asks her again", state.waiting.has(MORNING), true);
state = await acceptState("da", all);
check("and the unchanged line does not", state.waiting.has(MORNING), false);

console.log("\na clean that moves is a different clean");
const moved = visit("2026-11-20", "12.00", "275645", "ศ 20 พย - 12.00 (ดา)");
state = await acceptState("da", [moved, afternoon, later]);
check("the day it moved to is waiting", state.waiting.has("2026-11-20-1200-275645"), true);
check("and nothing else was taken with it", state.waiting.size, 3);

console.log("\nwhat a crafted post cannot do");
check("answer a slug that is not on her schedule", await answerVisit("da", all, LATER + "x", "yes"), false);
check("answer an empty slug", await answerVisit("da", all, "", "no"), false);

console.log("\nthe other answer");
check("the later clean is declined", await answerVisit("da", all, LATER, "no"), true);
state = await acceptState("da", all);
check("it is no longer waiting for an answer", state.waiting.has(LATER), false);
check("it does not count as accepted", state.takenAt.has(LATER), false);
check("and it carries when she declined it", typeof state.declinedAt.get(LATER), "string");

console.log("\na declined clean that moves is asked again");
const movedLater = visit("2026-11-27", "12.00", "275645", "ศ 27 พย - 12.00 (ดา)");
state = await acceptState("da", [morning, afternoon, movedLater]);
check("the day it moved to is waiting", state.waiting.has("2026-11-27-1200-275645"), true);
check("and nothing is declined any more", state.declinedAt.size, 0);

console.log("\none clean, one answer");
check("she changes her mind", await answerVisit("da", all, LATER, "yes"), true);
state = await acceptState("da", all);
check("it is accepted", state.takenAt.has(LATER), true);
check("and no longer declined", state.declinedAt.has(LATER), false);

console.log("\nthe record does not grow for ever");
await answerVisit("da", all, AFTERNOON, "yes");
await answerVisit("da", [later], LATER, "yes");
state = await acceptState("da", all);
check(
  "a clean that left the schedule is dropped on the next write",
  state.takenAt.has(MORNING) || state.takenAt.has(AFTERNOON),
  false,
);
check("and the one still on it is kept", state.takenAt.has(LATER), true);

rmSync(out, { recursive: true, force: true });

console.log(`\n${ran - failures}/${ran} passed`);
if (failures > 0) process.exit(1);
