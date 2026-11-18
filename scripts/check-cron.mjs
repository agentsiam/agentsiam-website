/**
 * Refuses a production build that would break a scheduled job nobody watches.
 *
 * Two jobs, and the same failure in both: they run successfully and far too late, or not at
 * all, and nothing surfaces it. The first is the booking hold release, below. The second is
 * the photo sweep: Vercel Blob has no expiry of its own, so the cron is the only thing that
 * makes Paul's rule of 18/11/2026 true, that a comment photo is deleted after one month. A
 * deploy that dropped that entry would keep every photograph of somebody's bedroom for good
 * and say nothing about it.
 *
 * The original note on the booking job follows, unchanged.
 *
 * ---
 *
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

/** The photo sweep. No schedule is asserted, only that it exists: daily is the point, and
 * which hour it runs at is nobody's business but the clock's. */
const PHOTO_CRON_PATH = "/api/cron/cleaning-photos";

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

const sweep = config.crons?.find((c) => c.path === PHOTO_CRON_PATH);

if (!sweep) {
  console.error(
    [
      "",
      `  vercel.json has no cron for ${PHOTO_CRON_PATH}.`,
      "",
      "  Vercel Blob has no expiry, so that job is the only thing deleting the cleaning",
      "  team's comment photos after a month. Without it every photograph taken inside a",
      "  guest's house is kept for good, and nothing says so.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}
