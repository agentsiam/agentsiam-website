/**
 * Exchange a Beds24 invite code for the durable refresh token, once, safely.
 *
 * Run it with no arguments and answer the prompt:
 *
 *   node scripts/beds24-token.mjs
 *
 * Why a script rather than a curl one-liner. The obvious version is a three-line shell
 * block with `read` on line two, and pasting that into a terminal makes the shell consume
 * line three as the answer -- so the invite code silently becomes whatever the next line
 * of the paste was, and Beds24 returns "Token not valid". The failure looks exactly like a
 * spent code, which is the wrong thing to go and fix. Prompting from inside a running
 * program cannot be fed by a paste buffer.
 *
 * Three more things it does that the one-liner did not:
 *
 * - Strips whitespace from the pasted code. Long codes wrap on copy and pick up a newline.
 * - Writes the token straight into .env.local, which is gitignored, rather than printing
 *   it. A token in the scrollback is a token that gets lost, and this one has write scope
 *   on the whole Beds24 account.
 * - Never prints the token, only its length. Paste it into Vercel from the file.
 *
 * Invite codes are single use and expire after 24 hours. Every attempt needs its own
 * freshly generated code: Settings -> Apps & Integrations -> API -> Generate Invite Code,
 * with read/bookings AND write/bookings. Scopes cannot be changed after generation, and a
 * read-only token gives a working calendar that fails at the first booking.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_LOCAL = path.join(ROOT, ".env.local");
const KEY = "BEDS24_REFRESH_TOKEN";

const rl = createInterface({ input: stdin, output: stdout });
const raw = await rl.question("Beds24 invite code: ");
rl.close();

const code = raw.replace(/\s+/g, "");
if (!code) {
  console.error("\n  No code entered.\n");
  process.exit(1);
}
if (code.length !== raw.length) {
  console.log(`  Stripped ${raw.length - code.length} whitespace character(s) from the code.`);
}

let payload;
try {
  const response = await fetch("https://api.beds24.com/v2/authentication/setup", {
    headers: { code },
  });
  payload = await response.json();
} catch (error) {
  console.error(`\n  Could not reach Beds24: ${error.message}\n`);
  process.exit(1);
}

const token = payload?.refreshToken;
if (!token) {
  console.error(`\n  Beds24 refused the code: ${JSON.stringify(payload)}\n`);
  console.error("  A 401 here means one of three things, in order of likelihood:");
  console.error("    1. The code was already used. They are single use, so every retry fails.");
  console.error("    2. The code is more than 24 hours old.");
  console.error("    3. The API page issued a V1 API key rather than a V2 invite code.");
  console.error("       V1 keys never work against /v2/authentication/setup.\n");
  console.error("  Generate a fresh invite code and run this again immediately.\n");
  process.exit(1);
}

// Replace the key if it is already there, rather than appending a second copy: the last
// assignment would win at runtime, but two lines for one variable is a trap for whoever
// reads the file next.
const existing = existsSync(ENV_LOCAL) ? await readFile(ENV_LOCAL, "utf8") : "";
const kept = existing
  .split("\n")
  .filter((line) => line.trim() && !line.startsWith(`${KEY}=`));
kept.push(`${KEY}=${token}`);
await writeFile(ENV_LOCAL, `${kept.join("\n")}\n`);

const scopes = payload.scopes ?? payload.scope;
console.log(`\n  Saved ${KEY} to .env.local (${token.length} characters). Not printed here.`);
if (scopes) console.log(`  Scopes: ${JSON.stringify(scopes)}`);
console.log(`
  Next:
    1. Open .env.local and copy the ${KEY} value.
    2. Vercel -> Settings -> Environment Variables -> Add.
       Scope it to Production AND Preview.
    3. Redeploy. Vercel does not apply new variables to a running deployment.
`);
