/**
 * Test SMTP credentials against Zoho directly, outside Vercel.
 *
 *   node scripts/smtp-check.mjs
 *
 * Why this exists. A 535 from the deployed site tells you the login failed and nothing
 * else: not which credential, not which tenant, not whether the mailbox is even allowed to
 * use SMTP. Every diagnosis from that point is a guess, and each guess costs an env var
 * edit, a redeploy and a round trip. This asks Zoho directly and prints what it actually
 * says.
 *
 * It tries the EU and the COM tenant with the same credentials, because that is the single
 * most common cause: `accounts.zoho.com` and `accounts.zoho.eu` are separate systems, an
 * app password minted on one never authenticates against the other, and the failure looks
 * identical to a wrong password. The MX records for agentsiam.com are mx.zoho.eu, so EU is
 * the expected answer, but knowing which one accepts the login settles it in one run.
 *
 * Prompts rather than reading argv, so the password never lands in shell history, and
 * never prints it back.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import nodemailer from "nodemailer";

const HOSTS = [
  { host: "smtp.zoho.eu", label: "EU tenant  (expected: MX is mx.zoho.eu)" },
  { host: "smtp.zoho.com", label: "COM tenant (only if the account was made on .com)" },
];

const rl = createInterface({ input: stdin, output: stdout });
const user = (await rl.question("Full mailbox address (e.g. you@agentsiam.com): ")).trim();
const pass = (await rl.question("App-specific password: ")).replace(/\s+/g, "");
rl.close();

if (!user || !pass) {
  console.error("\n  Need both. Nothing sent.\n");
  process.exit(1);
}
if (!user.includes("@")) {
  console.error(`\n  "${user}" is not a full address. Zoho wants you@agentsiam.com, not a username.\n`);
  process.exit(1);
}

console.log(`\n  Testing ${user}, password length ${pass.length}, port 465 implicit TLS.\n`);

let anyWorked = false;

for (const { host, label } of HOSTS) {
  process.stdout.write(`  ${host.padEnd(16)} ${label}\n`);
  const transport = nodemailer.createTransport({
    host,
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
  });
  try {
    await transport.verify();
    console.log(`  ${" ".repeat(16)} AUTHENTICATED. Use SMTP_HOST=${host}\n`);
    anyWorked = true;
  } catch (error) {
    const code = error.responseCode ?? error.code ?? "";
    console.log(`  ${" ".repeat(16)} refused: ${String(error.message).split("\n")[0]}${code ? ` [${code}]` : ""}\n`);
  } finally {
    transport.close();
  }
}

if (anyWorked) {
  console.log("  Set SMTP_HOST to whichever host authenticated, and make sure SMTP_USER");
  console.log("  and SMTP_PASSWORD in Vercel match exactly what you just typed. Then redeploy.\n");
  process.exit(0);
}

console.error(`  Neither tenant accepted these credentials. In order of likelihood:

    1. The app password was generated on the wrong tenant. Make it at
       accounts.zoho.eu, not accounts.zoho.com.
    2. The plan does not include SMTP. Zoho's free Mail plan has historically
       excluded IMAP/POP/SMTP access, and a mailbox without SMTP fails
       authentication rather than saying so. Check the plan, and check
       Mail Settings -> Mail Accounts -> IMAP/SMTP access is enabled.
    3. This is not the mailbox that owns the domain, or the address is wrong.
    4. The password was copied with a character missing. It is shown once.

  None of these can be told apart from the 535 alone, which is why this script
  asks Zoho instead of guessing.
`);
process.exit(1);
