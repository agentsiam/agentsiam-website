"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_API_CLEANING } from "@/lib/cleaning/routes";

/** One cleaner this clean could go to, the function her own document gives her, and whether
 * that document carries the codes for that house. A door code is never moved with a clean, so
 * the last of those is the difference between a cleaner who can get in and one who will be
 * standing at a gate. The function is there because the laundry run is somebody's whole job
 * here, and handing her a clean is a decision rather than a typo. */
export type Candidate = { person: string; role: string; hasCodes: boolean; self: boolean };

async function send(payload: Record<string, string>): Promise<string> {
  try {
    const response = await fetch(ADMIN_API_CLEANING, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    return response.ok ? "" : (body.error ?? "That did not work.");
  } catch {
    return "The request could not be sent.";
  }
}

/**
 * Give a clean somebody turned down to another cleaner.
 *
 * Paul, 18/11/2026: the cleaners are freelancers, so a clean one of them turns down comes back
 * to the admin and the admin gives it to another cleaner. This is that control, and it is the
 * first thing in this app that changes who does a job.
 *
 * **It sits on every clean still ahead of her, not only on one she refused.** Paul, 19/11/2026:
 * ป้า is the backup cleaner, she has no place in the rota, and she is assigned the work by hand.
 * A backup exists to be given work nobody has turned down, so the control cannot wait for a
 * refusal. On the first admin screen it still stands under the cleans that came back, which is
 * the queue of ones that need somebody; on a person's own page it stands under each of hers.
 *
 * **Her own name is in the list**, at the top of it, and picking it moves nothing: it forgets
 * her answer, so the clean reaches her again as new work. Paul, 19/11/2026: it does not have to
 * go to somebody else. A no on Tuesday and a conversation on Wednesday is the ordinary way this
 * ends, and the answer to it is the same cleaner being asked again.
 *
 * **It is an override and not the schedule.** The `cleaning-schedule` skill still decides who
 * cleans what and republishes the same clean to the same person on every run; this writes a
 * record the app lays over the top on every render. So the move survives the next run, and the
 * LINE Note from that run still prints the clean under the old name until the skill learns to
 * read the record. That disagreement is named on the screen, not hidden in a commit message.
 *
 * The warning about codes is not decoration. The access block in a document carries that
 * person's own code for that house, so moving a clean never moves a code: if her document has
 * none for that house, she arrives at a gate with nothing, and this is the moment to find out.
 */
export function CleaningMove({
  slug,
  from,
  candidates,
}: {
  slug: string;
  from: string;
  candidates: Candidate[];
}) {
  const router = useRouter();
  const [to, setTo] = useState(candidates[0]?.person ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const picked = candidates.find((one) => one.person === to);

  async function give() {
    if (!to || busy) return;
    setBusy(true);
    setMessage("");
    const error = await send({ action: "assign", person: from, slug, to });
    setMessage(error);
    setBusy(false);
    if (!error) router.refresh();
  }

  if (candidates.length === 0) {
    return (
      <p className="mt-2 text-xs text-muted">
        There is nobody else with a published schedule to give this to.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-muted" htmlFor={`to-${slug}`}>
          Give it to
        </label>
        <select
          id={`to-${slug}`}
          value={to}
          onChange={(event) => setTo(event.target.value)}
          className="rounded-box border border-hairline bg-bg px-2 py-1 text-sm text-text"
        >
          {candidates.map((one) => (
            <option key={one.person} value={one.person}>
              {one.self
                ? `${one.person} again`
                : one.role
                  ? `${one.person} (${one.role})`
                  : one.person}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={give}
          disabled={busy}
          className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-bg disabled:opacity-40"
        >
          {picked?.self ? "Ask her again" : "Move it"}
        </button>
      </div>
      {picked?.self ? (
        <p className="mt-2 text-xs text-muted">
          Nothing moves. {picked.person} is asked again, and this clean is back on her first
          screen waiting for an answer.
        </p>
      ) : null}
      {picked && !picked.self && !picked.hasCodes ? (
        <p className="mt-2 text-xs text-deep-red">
          {picked.person} has no door code for this house in her own schedule, and a code is
          never moved with a clean. She will see the job and not the number.
        </p>
      ) : null}
      {message ? <p className="mt-2 text-xs text-deep-red">{message}</p> : null}
    </div>
  );
}

/** Put a moved clean back where the skill published it. */
export function CleaningUndoMove({ slug, to }: { slug: string; to: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function undo() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    // The person field is the one the clean was published to, which the row already knows;
    // the route needs it only to name the action, since a slug names one clean on its own.
    const error = await send({ action: "unassign", person: to, slug });
    setMessage(error);
    setBusy(false);
    if (!error) router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={undo}
        disabled={busy}
        className="mt-2 rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold text-text disabled:opacity-40"
      >
        Give it back
      </button>
      {message ? <p className="mt-2 text-xs text-deep-red">{message}</p> : null}
    </>
  );
}
