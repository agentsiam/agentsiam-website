/*
 * Deletes everything the cleaning app has ever written, and writes nothing without --apply.
 *
 *   npm run cleaning:wipe
 *   npm run cleaning:wipe -- --apply
 *
 * **Why this exists.** Paul, 18/11/2026: clear the test records and connect the app to live
 * data. The schedules do not need clearing, because a real run of the `cleaning-schedule`
 * skill overwrites `cleaning:note:<person>` for every person it publishes. Everything else
 * testing left behind has no such owner: the enrolled phones, the PINs, the messages, the
 * photographs and the record of when each person last looked. He asked for all of it,
 * knowing the cost, which is the next paragraph.
 *
 * **What it costs.** Every phone stops working the moment this runs. There is no recovery
 * flow in this app by design, so each of the three needs a new PIN before her next clean and
 * a fresh link in LINE, in that order, because the link is opened with the PIN. Deleting a device record is exactly what the revoke
 * button does, three at a time and without the button.
 *
 * **The order matters and it is not obvious.** The admin screen lists people from the note
 * keys and the device indexes, so a store with neither knows nobody and has no row to press
 * "new link" on. Wipe, then publish a real run, then issue the links. Wiping without
 * publishing leaves an admin screen with nothing on it and no way to let anybody back in.
 *
 * **It touches two prefixes and nothing else**: `cleaning:` in the key store and `cleaning/`
 * in the blob store. That is the same boundary the nightly photo sweep works inside, and it
 * is what stops a wipe of this app reaching the CRM, the booking holds or anything else
 * sharing the store.
 *
 * It says which store it is about to touch before it touches it. `.env.local` carries both
 * the production credentials and a local fixture path, and the app prefers the production
 * ones when both are set, so the quiet failure here would be deleting the wrong store while
 * reading the right name. The line it prints is the one to read before typing --apply.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const repo = join(here, "..");

try {
  loadEnvFile(join(repo, ".env.local"));
} catch {
  console.error("\n  No .env.local. Nothing to reach a store with.\n");
  process.exit(1);
}

const apply = process.argv.includes("--apply");

// The app's own store module rather than a second REST client, so this deletes through the
// same code path the app writes through and understands both store modes.
const cache = join(repo, "node_modules", ".cache");
mkdirSync(cache, { recursive: true });
const out = mkdtempSync(join(cache, "cleaning-wipe-"));
try {
  execFileSync(
    "npx",
    [
      "tsc",
      "src/lib/cleaning/store.ts",
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
  console.error("the store module did not compile, so nothing was read and nothing deleted");
  rmSync(out, { recursive: true, force: true });
  process.exit(1);
}

const require = createRequire(join(out, "wipe.cjs"));
const { storeMode, storeDescription, keysUnder, del } = require(join(out, "store.js"));

if (storeMode() === "none") {
  console.error("\n  No store configured. Nothing was read and nothing deleted.\n");
  rmSync(out, { recursive: true, force: true });
  process.exit(1);
}

console.log(`\n  Store: ${storeDescription()}`);
console.log(`  Mode:  ${apply ? "APPLY, this deletes" : "dry run, nothing will be deleted"}\n`);

const keys = (await keysUnder("cleaning:")).sort();

/** What each key is, in the words the admin screen and the app use for it. */
const KINDS = [
  ["cleaning:note:", "schedules, one per person, republished by every skill run"],
  ["cleaning:devices:", "the index of phones enrolled to a person"],
  ["cleaning:device:", "an enrolled phone"],
  ["cleaning:pin:", "a person's PIN, hashed"],
  ["cleaning:pinfail:", "a failure counter on one phone"],
  ["cleaning:enrol:", "an unspent enrolment link"],
  ["cleaning:seen:", "when a person last looked, and what she was shown"],
  ["cleaning:comment:", "a conversation about one clean, and its photographs"],
];

for (const [prefix, what] of KINDS) {
  const mine = keys.filter((key) => key.startsWith(prefix));
  if (mine.length === 0) continue;
  console.log(`  ${mine.length}  ${prefix}*   ${what}`);
  for (const key of mine) console.log(`        ${key}`);
}
const other = keys.filter((key) => !KINDS.some(([prefix]) => key.startsWith(prefix)));
for (const key of other) console.log(`  ?  ${key}   not a shape this app writes`);
if (keys.length === 0) console.log("  No cleaning keys in this store.");

// The photographs. A separate store with a separate credential, and the one thing here that
// is not a key, so it is listed and deleted on its own terms.
let blobs = [];
const blobToken = process.env.BLOB_READ_WRITE_TOKEN ?? "";
if (!blobToken) {
  console.log("\n  No BLOB_READ_WRITE_TOKEN, so photographs are not reachable from here.");
} else {
  const { list, del: blobDel } = await import("@vercel/blob");
  let cursor;
  do {
    const page = await list({ prefix: "cleaning/", cursor, limit: 1000, token: blobToken });
    blobs.push(...page.blobs.map((blob) => blob.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  console.log(`\n  ${blobs.length}  photographs under cleaning/`);
  if (apply && blobs.length > 0) {
    for (let at = 0; at < blobs.length; at += 100) {
      await blobDel(blobs.slice(at, at + 100), { token: blobToken });
    }
  }
}

if (!apply) {
  console.log(`\n  Nothing was deleted. ${keys.length} keys and ${blobs.length} photographs would go.`);
  console.log("  Run it again with --apply to delete them.\n");
  rmSync(out, { recursive: true, force: true });
  process.exit(0);
}

for (const key of keys) await del(key);

const left = await keysUnder("cleaning:");
console.log(`\n  Deleted ${keys.length} keys and ${blobs.length} photographs.`);
console.log(`  ${left.length} cleaning keys remain.`);
console.log("\n  The store now knows nobody, so the admin screen has no row to press.");
console.log("  Publish a real run before issuing any link, then set each PIN.\n");

rmSync(out, { recursive: true, force: true });
if (left.length > 0) process.exit(1);
