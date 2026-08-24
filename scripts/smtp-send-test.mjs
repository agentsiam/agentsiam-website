/**
 * Send one real message through the configured SMTP transport.
 *
 *   node scripts/smtp-send-test.mjs            # to CONTACT_TO_EMAIL
 *   node scripts/smtp-send-test.mjs you@x.com  # to somewhere else
 *
 * Why this exists alongside smtp-check.mjs. That script answers "does the login work",
 * which is only half the question: Zoho can accept the AUTH and still refuse the message
 * at RCPT or DATA -- a From it does not own comes back 553, a rate limit comes back 554,
 * and neither shows up in a verify(). This does the whole thing, with the real values from
 * .env.local, so what it proves is what the site will do.
 *
 * It prefers .env.local, because by this point the credentials are meant to be committed
 * to the environment and testing anything else tests nothing. But it falls back to
 * prompting for the password when that file has none, so that the deployed-only case --
 * password set in Vercel, where it is write-only and cannot be read back -- can still be
 * tested locally without first copying a secret into a file by hand.
 */
import { createInterface } from "node:readline/promises";
import { loadEnvFile, stdin, stdout } from "node:process";
import nodemailer from "nodemailer";

try {
  loadEnvFile(".env.local");
} catch {
  console.error("\n  No .env.local in the current directory. Run this from the project root.\n");
  process.exit(1);
}

const { SMTP_HOST, SMTP_PORT = "465", SMTP_USER, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;

const missing = ["SMTP_HOST", "SMTP_USER"].filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`\n  Not configured yet -- ${missing.join(" and ")} empty in .env.local.\n`);
  process.exit(1);
}

let SMTP_PASSWORD = process.env.SMTP_PASSWORD ?? "";
if (!SMTP_PASSWORD) {
  console.log("\n  No SMTP_PASSWORD in .env.local. Type the app password to test without saving it.");
  const rl = createInterface({ input: stdin, output: stdout });
  SMTP_PASSWORD = (await rl.question("  App-specific password: ")).replace(/\s+/g, "");
  rl.close();
  if (!SMTP_PASSWORD) {
    console.error("\n  Nothing typed. Nothing sent.\n");
    process.exit(1);
  }
}

const to = process.argv[2] ?? CONTACT_TO_EMAIL ?? SMTP_USER;
// Mirrors the fallback in src/lib/mailer.ts: an unowned From is the usual 553.
const from = CONTACT_FROM_EMAIL || `AgentSiam <${SMTP_USER}>`;
const port = Number(SMTP_PORT);

console.log(`\n  ${SMTP_HOST}:${port}  ${port === 465 ? "implicit TLS" : "STARTTLS"}`);
console.log(`  from ${from}`);
console.log(`  to   ${to}\n`);

const transport = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
});

try {
  const info = await transport.sendMail({
    from,
    to,
    subject: "AgentSiam SMTP test",
    text: "If this arrived, transactional email is working. Sent by scripts/smtp-send-test.mjs.",
    html: "<p>If this arrived, transactional email is working.</p><p style='color:#666'>Sent by <code>scripts/smtp-send-test.mjs</code>.</p>",
  });
  console.log(`  ACCEPTED by ${SMTP_HOST}: ${info.response}`);
  console.log(`  message id ${info.messageId}\n`);
  console.log("  Accepted is not delivered. Check the inbox, and check spam -- there is no");
  console.log("  DMARC record on agentsiam.com yet, so some receivers will be sceptical.\n");
} catch (error) {
  const code = error.responseCode ?? error.code ?? "";
  console.error(`\n  REFUSED${code ? ` [${code}]` : ""}: ${String(error.message).split("\n")[0]}\n`);
  if (code === 535) console.error("  Auth failed. Run scripts/smtp-check.mjs -- it tries both Zoho tenants.\n");
  if (code === 553 || code === 550) console.error(`  Zoho does not own "${from}". Unset CONTACT_FROM_EMAIL and let it fall back to SMTP_USER.\n`);
  process.exitCode = 1;
} finally {
  transport.close();
}
