import {
  TEAM_STRINGS_PENDING,
  TEAM_STRINGS_PENDING_KEYS,
  TEAM_STRINGS_TOTAL,
} from "@/lib/cleaning/strings";

/**
 * One honest warning, on every screen in this subtree, while any team string is still a
 * placeholder rather than Paul's own Thai.
 *
 * It exists because of how a placeholder fails. `[TH enter your PIN to see the door codes]`
 * is unmistakable to anyone reading the file and almost invisible on a phone held at arm's
 * length: it is Latin text on a screen that is mostly Thai, in a layout that looks finished,
 * and it reads as a label somebody meant to put there. The app would then demo cleanly and
 * ship wrong. This says the count out loud instead, so no screenshot of a pending screen
 * can be mistaken for a screenshot of the app.
 *
 * **English, because the audience is Paul.** The team never sees this: it disappears from
 * every screen the moment the last string is written, and until then the app is not for a
 * phone at all. It is wrapped in `lang="en"` so that a Thai screen reader on a page whose
 * html element says `th` does not read English aloud in Thai.
 *
 * A build-time constant, so this is server-rendered, costs a phone nothing and cannot be
 * out of date with the file it describes. It names the keys because Paul fills them in one
 * at a time, and a count alone would not say which ones are left.
 */
export function PendingStringsNotice() {
  if (!TEAM_STRINGS_PENDING) return null;

  const pending = TEAM_STRINGS_PENDING_KEYS.length;
  const count =
    pending === 1
      ? `1 of ${TEAM_STRINGS_TOTAL} Thai strings is still a placeholder.`
      : `${pending} of ${TEAM_STRINGS_TOTAL} Thai strings are still placeholders.`;

  return (
    <aside
      lang="en"
      dir="ltr"
      className="mb-5 rounded-box border border-dashed border-deep-gold bg-wash-gold px-3 py-2.5 text-deep-gold"
      style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
    >
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase">
        Not for the team yet
      </p>
      <p className="mt-1.5 text-[13px] leading-snug">
        {count} Every line in square brackets on these screens is English standing in for
        your Thai, in <span className="font-semibold">src/lib/cleaning/strings.ts</span>.
      </p>
      <p className="mt-1.5 text-[12px] leading-snug break-words opacity-80">
        {TEAM_STRINGS_PENDING_KEYS.join(", ")}
      </p>
    </aside>
  );
}
