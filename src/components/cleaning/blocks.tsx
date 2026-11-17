import type { DocumentBlock } from "@/lib/cleaning/document";

/**
 * The rendered blocks at the foot of a Note, put on a screen.
 *
 * Both of these are finished text from the published document: the heading as her Note
 * prints it, then its lines. Nothing here words anything, joins anything or reorders
 * anything. The weight, the spacing and the panel are presentation and are ours; every
 * character inside them is the skill's.
 */

/** The contact block, and the access block when the PIN has been given. */
export function RenderedBlock({
  block,
  tone = "plain",
}: {
  block: DocumentBlock;
  tone?: "plain" | "panel";
}) {
  return (
    <section
      className={
        tone === "panel"
          ? "mt-6 rounded-panel border border-hairline bg-surface p-4"
          : "mt-6"
      }
    >
      <h2 className="text-sm font-semibold text-muted">{block.heading}</h2>
      <ul className="mt-2 space-y-1">
        {block.lines.map((line, index) => (
          <li key={index} className="text-[17px] leading-7 text-body">
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The change lines from the last posted schedule.
 *
 * Set apart from the job lines above it on purpose, and apart from the per-visit marker
 * especially. This block answers what changed since the schedule was last **posted**; the
 * marker beside a visit answers what changed since **she** last looked. On a week she did
 * not open the app those are different answers and both are true, so they must not read as
 * one correcting the other.
 *
 * The skill merges its generated change lines with anything typed into that run's remarks
 * under a single heading, so this app cannot tell the two apart and does not pretend to.
 */
export function RemarksBlock({ block }: { block: DocumentBlock }) {
  return (
    <section className="mt-8 rounded-panel border border-hairline bg-wash-gold p-4">
      <h2 className="text-sm font-semibold text-deep-gold">{block.heading}</h2>
      <ul className="mt-2 space-y-1.5">
        {block.lines.map((line, index) => (
          <li key={index} className="text-[17px] leading-7 text-body">
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
