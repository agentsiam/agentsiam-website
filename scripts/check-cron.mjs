/**
 * Refuses a production build whose cron schedule is the Hobby stopgap.
 *
 * The booking flow holds nights in Beds24 before it charges a card, and
 * /api/booking/release-holds is the only thing that gives those nights back when
 * a guest abandons checkout. At the real schedule it runs every ten minutes. On
 * a daily schedule the nights stay blocked on all six channels the property is
 * sold on for up to a day, and nothing surfaces it, because nothing watches a
 * job that runs successfully but far too late.
 *
 * Vercel's Hobby plan rejects any cron more frequent than daily at deploy time,
 * so while the project is on Hobby the schedule is temporarily daily. That is
 * survivable for a preview, where crons do not run at all. It is not survivable
 * in production.
 *
 * This makes the mistake impossible rather than merely documented: a production
 * build carrying the stopgap fails here, loudly, with the fix in the message.
 */
import { readFileSync } from "node:fs";

const REQUIRED = "*/10 * * * *";
const CRON_PATH = "/api/booking/release-holds";

const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
const job = config.crons?.find((c) => c.path === CRON_PATH);

if (!job) {
  console.error(`\n  vercel.json has no cron for ${CRON_PATH}.\n  Abandoned checkouts would block nights on every channel, forever.\n`);
  process.exit(1);
}

if (process.env.VERCEL_ENV === "production" && job.schedule !== REQUIRED) {
  console.error(
    [
      "",
      "  Production build refused.",
      "",
      `  ${CRON_PATH} is scheduled "${job.schedule}", not "${REQUIRED}".`,
      "  That is the Hobby stopgap, and it must not reach production.",
      "",
      "  Fix: upgrade the Vercel project to Pro, then set the schedule in",
      `  vercel.json back to "${REQUIRED}" and redeploy.`,
      "",
    ].join("\n"),
  );
  process.exit(1);
}

if (job.schedule !== REQUIRED) {
  console.warn(`  cron ${CRON_PATH}: "${job.schedule}" (Hobby stopgap, blocked from production)`);
}
