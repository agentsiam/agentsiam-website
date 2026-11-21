#!/usr/bin/env node
/**
 * Who can read a message on a job, run against a throwaway file store.
 *
 *     npm run test:cleaning-comments
 *
 * Paul, 21/11/2026: a payslip sent to one cleaner was readable by her colleague on the same
 * job, because a job's thread is keyed on the visit slug and the cleaner and the laundry run
 * on one clean share it. What AgentSiam sends from a person's page now goes to that person
 * alone unless he ticks it to everyone, the team's own messages stay shared, and a photo on a
 * private message opens only for its person. This holds that to the store: what each reader
 * gets back from `listComments`, what `privatePhotoOwner` answers for each photo, and that a
 * message written before the field existed still reads as everyone's.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const repo = join(here, "..");
const cache = join(repo, "node_modules", ".cache");
mkdirSync(cache, { recursive: true });
const out = mkdtempSync(join(cache, "cleaning-comments-"));

const documents = join(out, "documents.json");
writeFileSync(documents, JSON.stringify({ built_at: "2026-11-21T00:00:00Z", people: {} }));
const state = join(out, "documents.state.json");

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
      "src/lib/cleaning/comments.ts",
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
const { COMMENT_PREFIX, addComment, listComments, privatePhotoOwner } = require(
  join(out, "comments.js"),
);
const { visibleTo } = require(join(out, "comment-shape.js"));

let failures = 0;
let ran = 0;
function check(name, actual, expected) {
  const ok = actual === expected;
  ran += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}  (${String(actual)})`);
}

const SLUG = "2026-12-20-1200-275645";
const PAYSLIP = "cleaning/2026-12-20/photo-AbCdEfGhIjKlMnOpQrStUv.jpg";
const ROOM = "cleaning/2026-12-20/photo-ZyXwVuTsRqPoNmLkJiHgFe.jpg";
const bodies = (list) => list.map((one) => one.body || one.images.join(",")).join(" / ");

console.log("\nthe rule on its own");
check("a shared message is everyone's", visibleTo({ to: null }, "ting"), true);
check("a private one is hers", visibleTo({ to: "da" }, "da"), true);
check("and not her colleague's", visibleTo({ to: "da" }, "ting"), false);

console.log("\none job, the cleaner and the laundry run on it");
// A message's id starts with the millisecond it was written, which is how a thread sorts.
// Four writes in one millisecond would sort by their random tail instead, which no two people
// typing ever do, so each write here waits for the clock.
const tick = () => new Promise((done) => setTimeout(done, 3));
await addComment(SLUG, { by: "team", name: "ดา", body: "cot is under the stairs" });
await tick();
await addComment(SLUG, { by: "agentsiam", name: "AgentSiam", body: "", images: [PAYSLIP], to: "da" });
await tick();
await addComment(SLUG, { by: "agentsiam", name: "AgentSiam", body: "guest arrives at 15.00", to: null });
await tick();
await addComment(SLUG, { by: "team", name: "Ting", body: "", images: [ROOM] });

const da = await listComments(SLUG, "da");
const ting = await listComments(SLUG, "ting");
check("Da reads all four", da.length, 4);
check("including the payslip sent to her", da.some((one) => one.images.includes(PAYSLIP)), true);
check("Ting reads three", ting.length, 3);
check("and never the payslip", ting.some((one) => one.images.includes(PAYSLIP)), false);
check("Ting still reads what Da wrote", ting.some((one) => one.body === "cot is under the stairs"), true);
check("and what AgentSiam sent to everyone", ting.some((one) => one.body === "guest arrives at 15.00"), true);
check("the thread stays in the order it was written", bodies(ting), "cot is under the stairs / guest arrives at 15.00 / " + ROOM);
check("a private message says whose it is", da.find((one) => one.images.includes(PAYSLIP)).to, "da");
check("a team message is everyone's", da.find((one) => one.by === "team").to, null);

console.log("\nthe photos, which the photo route asks about by pathname alone");
check("the payslip opens for Da only", await privatePhotoOwner(PAYSLIP), "da");
check("a photo on a shared message has no owner", await privatePhotoOwner(ROOM), null);
check("nor does a pathname nobody wrote", await privatePhotoOwner("cleaning/x/never.jpg"), null);

console.log("\na message written before 21/11/2026, with no audience at all");
// The local store keeps `{ value, expires }` per key; this writes a comment exactly as a
// deployment before the field would have left it, with no `to` in it.
const stored = JSON.parse(readFileSync(state, "utf8"));
stored[`${COMMENT_PREFIX}${SLUG}:1700000000000-legacy`] = {
  value: JSON.stringify({ at: "2026-11-19T08:52:00Z", by: "agentsiam", name: "AgentSiam", body: "old message" }),
};
writeFileSync(state, JSON.stringify(stored));
check("it reads as everyone's: Ting sees it", (await listComments(SLUG, "ting")).some((one) => one.body === "old message"), true);
check("and Da does", (await listComments(SLUG, "da")).some((one) => one.body === "old message"), true);

console.log("\nanother person entirely");
check("somebody on no part of the job reads no private message", (await listComments(SLUG, "aun")).some((one) => one.to !== null), false);

rmSync(out, { recursive: true, force: true });
console.log(`\n${ran - failures}/${ran} passed`);
if (failures > 0) process.exit(1);
