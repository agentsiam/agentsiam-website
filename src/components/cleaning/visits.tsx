import type { Visit } from "@/lib/cleaning/document";
import { visitIdentity } from "@/lib/cleaning/seen";
import { TEAM_STRINGS } from "@/lib/cleaning/strings";

/**
 * Her visits, in the order her LINE Note lists them, with the next one obvious.
 *
 * Each row prints `visit.line` and nothing else: the day name, the date, the time, who is
 * on it, the occupied marker and anything true of that one clean, exactly as the Note
 * renders them. **This file formats no date and words no sentence.** What it decides is
 * which row is loud, which is quiet and which carries a marker, and those are presentation.
 *
 * Three states, all of them non-verbal except the marker:
 *
 *   next      the first visit today or later. A filled card with a gold edge.
 *   upcoming  after that. A plain card.
 *   past      before today. The same card, dimmed. Shown rather than hidden, because a
 *             document built a week ago would otherwise go mysteriously short, and the
 *             Note she holds in LINE lists those dates too.
 */
export function VisitList({
  visits,
  nextIndex,
  today,
  changed,
}: {
  visits: Visit[];
  nextIndex: number;
  today: string;
  changed: Set<string>;
}) {
  return (
    <ol className="mt-5 space-y-3">
      {visits.map((visit, index) => {
        const isNext = index === nextIndex;
        const isPast = visit.date < today;
        const isChanged = changed.has(visitIdentity(visit));
        return (
          <li
            key={`${visit.date}-${visit.booking ?? index}`}
            className={[
              "rounded-panel border p-4",
              isNext
                ? "border-ink bg-ink text-bg shadow-sm"
                : "border-hairline bg-surface text-body",
              isPast && !isNext ? "opacity-45" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <p
              className={[
                "text-[19px] font-semibold leading-8",
                isNext ? "text-bg" : "text-text",
              ].join(" ")}
            >
              {visit.line}
            </p>
            {isChanged ? (
              <p
                className={[
                  "mt-2 inline-block rounded-box px-2 py-0.5 text-[13px] font-semibold",
                  isNext ? "bg-gold-on-ink text-ink" : "bg-wash-gold text-deep-gold",
                ].join(" ")}
              >
                {TEAM_STRINGS.changedSinceSeen}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
