import type { DocumentBlock } from "@/lib/cleaning/document";
import { blockHeading } from "@/lib/cleaning/english";
import { written, type TeamLang } from "@/lib/cleaning/strings";

/**
 * One of the app's own sentences, on its own panel, or nothing at all.
 *
 * The app's sentences are the handful Paul writes himself, and until he has written one
 * there is nothing here to say. So the panel does not render: an empty bordered box saying
 * nothing is worse than a screen that is simply shorter, and it is the shape "remove the
 * placeholder text" has to take if it is not to leave holes.
 */
export function Message({ text, className = "mt-8" }: { text: string; className?: string }) {
  const said = written(text);
  if (!said) return null;
  return (
    <p
      className={`${className} rounded-panel border border-hairline bg-surface p-5 text-[17px] leading-7 text-body`}
    >
      {said}
    </p>
  );
}

/**
 * The rendered blocks at the foot of a Note, put on a screen.
 *
 * Both of these are finished text from the published document: the heading as her Note
 * prints it, then its lines. Nothing here words anything, joins anything or reorders
 * anything. The weight, the spacing and the panel are presentation and are ours; every
 * character inside them is the skill's.
 *
 * **One exception, on an English phone: the heading.** A panel's heading says what the panel
 * is, which is furniture rather than content, and a Thai heading over a block was one of the
 * things Paul was looking at when he asked for the English to be worked out. The lines inside
 * stay the skill's, in the language they were published in, because they are prose and the
 * honest fix for them is a document published per language. src/lib/cleaning/english.ts holds
 * the three headings and says what it cannot reach.
 */

/** The contact block, and the access block when the PIN has been given. */
export function RenderedBlock({
  block,
  lang,
  tone = "plain",
}: {
  block: DocumentBlock;
  lang: TeamLang;
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
      <h2 className="text-sm font-semibold text-muted">
        {blockHeading("contact", block.heading, lang)}
      </h2>
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
export function RemarksBlock({ block, lang }: { block: DocumentBlock; lang: TeamLang }) {
  return (
    <section className="mt-8 rounded-panel border border-hairline bg-wash-gold p-4">
      <h2 className="text-sm font-semibold text-deep-gold">
        {blockHeading("changes", block.heading, lang)}
      </h2>
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
