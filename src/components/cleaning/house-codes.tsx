"use client";

import { useEffect, useState } from "react";
import { CLEANING_API_CODES } from "@/lib/cleaning/routes";
import { TEAM_STRINGS, written } from "@/lib/cleaning/strings";

/**
 * The gate and door codes for one job, on the screen she is already looking at.
 *
 * Paul, 17/11/2026: the house code shows directly inside the schedule, without opening a new
 * page. It used to be a tap away on a screen of its own, and before that a screen listing
 * every house she works at.
 *
 * **It fetches rather than being rendered into the page, and that is the whole design.** The
 * service worker saves her schedule so she can read her dates at a house with no signal, and
 * saves it without a deadline, because a week-old schedule is still worth reading. A week-old
 * door code is not. A code rendered into that page would be in every saved copy of it. So the
 * page holds no code and asks for one, and the answer carries its own deadline: the worker
 * keeps that one answer until the end of the day and refuses to serve it afterwards.
 *
 * Which means offline it still works, on the day, from the worker's copy, and the morning
 * after it is gone. If there is no copy and no signal, it says so rather than spinning: a
 * cleaner watching a spinner at a gate is worse off than one who knows to call.
 *
 * Nothing is rendered until the answer arrives, so a day she is not working, a job that is
 * not hers and a store that cannot be reached all look the same on screen, which is nothing.
 */
export function HouseCodes({ slug }: { slug: string }) {
  const [block, setBlock] = useState<{ heading: string; lines: string[] } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const response = await fetch(`${CLEANING_API_CODES}?slug=${encodeURIComponent(slug)}`);
        if (!response.ok) return;
        const answer = (await response.json()) as {
          heading?: unknown;
          lines?: unknown;
        };
        const heading = typeof answer.heading === "string" ? answer.heading : "";
        const lines = Array.isArray(answer.lines)
          ? answer.lines.filter((line): line is string => typeof line === "string")
          : [];
        if (alive && heading && lines.length > 0) setBlock({ heading, lines });
      } catch {
        // No signal and no saved copy. The worker answers from its copy while the day lasts,
        // so reaching here means there is nothing to show rather than something being slow.
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  if (failed) {
    const said = written(TEAM_STRINGS.offline);
    return said ? (
      <p className="mt-4 rounded-box bg-wash-red px-4 py-3 text-[15px] leading-6 text-deep-red">
        {said}
      </p>
    ) : null;
  }
  if (!block) return null;

  return (
    <section className="mt-4 rounded-panel bg-sand p-5">
      <h2 className="text-[14px] font-semibold tracking-wide text-ink opacity-70">
        {block.heading}
      </h2>
      {/* The lines read as one piece of text, label and number together, exactly as her LINE
          Note prints them. Splitting one would mean this app deciding where a Thai sentence
          ends. Big, because this is read at a gate in daylight with a bag in the other hand. */}
      <ul className="mt-3 space-y-3">
        {block.lines.map((line, index) => (
          <li key={index} className="text-[27px] font-semibold leading-10 tracking-wide text-ink">
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
