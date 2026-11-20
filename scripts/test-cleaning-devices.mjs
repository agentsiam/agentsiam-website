/*
 * Drives enrolment, naming and revocation against a real store, which here is a throwaway
 * file.
 *
 *   npm run test:cleaning-devices
 *
 * **Why this file exists.** Paul, 20/11/2026: Da needs the app in LINE's browser and in her
 * phone's own browser, and the single-use link is where the confusion came from. A device
 * record is one browser's cookie jar, so one person holds as many as she has browsers and
 * two of them are routinely one handset. A link that died on its first open enrolled
 * whichever browser she tapped it in and left the other at a PIN gate with no cookie behind
 * it, which reads exactly like a link that did not work.
 *
 * So the link is no longer the secret and her PIN is, and everything below is that trade
 * stated as behaviour: one link enrols every browser that opens it with the right code, a
 * wrong code enrols nothing, and five wrong codes delete the link rather than lock it. The
 * last one is the trade's cost as well as its protection, since a stranger holding a
 * forwarded link can burn it, which costs Paul one press of a button.
 *
 * **The name is what makes the revoke answerable.** Two enrolments from one phone carry
 * agent strings that differ by a version number, so a name has to survive the one write the
 * app makes to a record it did not create: resolveDevice stamps lastSeenAt on a visit, and a
 * stamp that dropped the name would quietly undo the naming a week later.
 *
 * It writes to a temporary file store rather than to a mock, so the store functions run as
 * they do in production and every record is read back the way the app reads it.
 *
 * **What it does not prove.** Anything about the screens: that the PIN field appears on the
 * enrol page, that a wrong code comes back to it in Thai, that the schedule opens without
 * asking for the PIN a second time, or that the name field appears on Paul's row.
 * /admin/cleaning is behind the admin passphrase and neither screen was opened.
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
const out = mkdtempSync(join(cache, "cleaning-devices-"));

// A store of its own, so a run cannot touch the fixture anybody is developing against, and
// cannot reach the real one whatever .env.local happens to say.
const documents = join(out, "documents.json");
writeFileSync(documents, JSON.stringify({ built_at: "2026-11-20T00:00:00Z", people: {} }));
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
      "src/lib/cleaning/devices.ts",
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
const {
  ENROL_MAX_FAILURES,
  createEnrolToken,
  listDevices,
  resolveDevice,
  revokeDevice,
  setDeviceLabel,
  setPin,
  spendEnrolToken,
} = require(join(out, "devices.js"));
const { cleanDeviceLabel, MAX_DEVICE_LABEL } = require(join(out, "device-shape.js"));
const { deviceKey, get, set } = require(join(out, "store.js"));

let failures = 0;
let ran = 0;

function check(name, actual, expected) {
  const ok = actual === expected;
  ran += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}  (${String(actual)})`);
}

async function named(person, device) {
  const rows = await listDevices(person);
  return rows.find((row) => row.device === device)?.label ?? null;
}

const CODE = "4821";
const WRONG = "1111";

await setPin("da", CODE);

console.log("\nthe link is opened with her PIN and not on its own");
const link = await createEnrolToken("da");
check("a wrong code enrols nothing", (await spendEnrolToken(link, WRONG)).state, "wrong");
check("and leaves her with no phone", (await listDevices("da")).length, 0);
check("a code of the wrong shape is wrong too", (await spendEnrolToken(link, "abc")).state, "wrong");
const lineApp = await spendEnrolToken(link, CODE, "Mozilla/5.0 (Linux; Android 14) Line/14.9.0");
check("the right code enrols", lineApp.state, "ok");

console.log("\nthe same link opens her other browser, which is the whole point");
const own = await spendEnrolToken(link, CODE, "Mozilla/5.0 (Linux; Android 14) Chrome/131.0");
check("the link is still good", own.state, "ok");
check("a second browser stands against her", (await listDevices("da")).length, 2);
check("and they are two records", own.device === lineApp.device, false);
check("the first still resolves", (await resolveDevice("da", lineApp.device))?.person, "da");
check("so does the second", (await resolveDevice("da", own.device))?.person, "da");

console.log("\nnaming one leaves the other alone");
check("the name saves", await setDeviceLabel("da", lineApp.device, "  LINE   browser  "), true);
check("trimmed to one line", await named("da", lineApp.device), "LINE browser");
check("the other is still unnamed", await named("da", own.device), null);

console.log("\na name survives the stamp a visit puts on the record");
const stale = JSON.parse(await get(deviceKey(lineApp.device)));
await set(deviceKey(lineApp.device), JSON.stringify({ ...stale, lastSeenAt: "2026-01-01T00:00:00.000Z" }));
check("the visit resolves", (await resolveDevice("da", lineApp.device))?.person, "da");
const stamped = JSON.parse(await get(deviceKey(lineApp.device)));
check("the stamp moved off January", stamped.lastSeenAt.slice(0, 7) !== "2026-01", true);
check("and the name is still there", await named("da", lineApp.device), "LINE browser");

console.log("\nan empty name is a deletion");
check("it saves", await setDeviceLabel("da", lineApp.device, "   "), true);
check("and the name is gone", await named("da", lineApp.device), null);

console.log("\na name is capped and belongs to one person");
check("capped", cleanDeviceLabel("x".repeat(MAX_DEVICE_LABEL + 20)).length, MAX_DEVICE_LABEL);
check("not a string is no name", cleanDeviceLabel(undefined), "");
check("another person cannot name it", await setDeviceLabel("aun", lineApp.device, "mine"), false);
check("nor can a made-up device be named", await setDeviceLabel("da", "not-a-device", "x"), false);

console.log("\nrevoking one browser is not revoking the phone");
await setDeviceLabel("da", own.device, "her own browser");
check("the revoke lands", await revokeDevice("da", lineApp.device), true);
check("one is left", (await listDevices("da")).length, 1);
check("it is the named one", await named("da", own.device), "her own browser");
check("and the revoked one resolves no more", await resolveDevice("da", lineApp.device), null);

console.log("\nguessing at a link kills the link");
const guessed = await createEnrolToken("da");
let last = null;
for (let tries = 0; tries < ENROL_MAX_FAILURES; tries += 1) {
  last = (await spendEnrolToken(guessed, WRONG)).state;
}
check("the last wrong try reports it dead", last, "dead");
check("and the right code is too late", (await spendEnrolToken(guessed, CODE)).state, "dead");
check("her other link is untouched", (await spendEnrolToken(link, CODE)).state, "ok");

console.log("\na link for somebody with no PIN set says so, and is not burned for it");
const unset = await createEnrolToken("ting");
for (let tries = 0; tries < ENROL_MAX_FAILURES + 2; tries += 1) {
  check(`try ${tries + 1} says her code is unset`, (await spendEnrolToken(unset, CODE)).state, "unset");
}
await setPin("ting", CODE);
check("and it works the moment Paul sets one", (await spendEnrolToken(unset, CODE)).state, "ok");

console.log("\nnothing else opens anything");
check("a made-up link is dead", (await spendEnrolToken("not-a-link", CODE)).state, "dead");
check("an empty link is dead", (await spendEnrolToken("", CODE)).state, "dead");

rmSync(out, { recursive: true, force: true });
console.log(`\n${ran - failures}/${ran} passed`);
process.exit(failures === 0 ? 0 : 1);
