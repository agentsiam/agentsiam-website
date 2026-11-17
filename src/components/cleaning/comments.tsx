"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_COMMENT_LENGTH, type Comment } from "@/lib/cleaning/comment-shape";
import { builtAtDigits } from "@/lib/cleaning/document";
import { CLEANING_API_COMMENT } from "@/lib/cleaning/routes";
import { TEAM_STRINGS, written } from "@/lib/cleaning/strings";

/**
 * The conversation about one clean.
 *
 * Paul's instruction, 17/11/2026: a comment section where an AgentSiam colleague and the
 * cleaning lady can talk, like the comments under a post. It is the first thing in this app
 * that anybody on the team types into, and everything about its shape follows from where it
 * is read: a phone, one-handed, often at a house.
 *
 * **It never formats a date.** A comment carries the moment it was written and the moment
 * is printed as digits, by the same function that prints how old the schedule is. The rule
 * that this app composes no Thai date holds here exactly as it holds everywhere else.
 *
 * **A sent comment reloads the thread rather than guessing at it.** The list is rendered on
 * the server, so after a send the page is refreshed and what comes back is what the store
 * actually holds. An optimistic row would be a second place this app decides what a thread
 * says, and the one failure worth protecting against is a comment that looks sent and is
 * not.
 *
 * Offline it fails and says so. That is honest: the schedule and the codes are saved on the
 * phone, and a message to somebody else is not something a phone with no signal can do.
 */
export function Comments({ slug, comments }: { slug: string; comments: Comment[] }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch(CLEANING_API_COMMENT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, body: text }),
      });
      if (response.ok) {
        setBody("");
        router.refresh();
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    }
    setBusy(false);
  }

  const placeholder = written(TEAM_STRINGS.commentPlaceholder);
  const sendLabel = written(TEAM_STRINGS.commentSend);

  return (
    <div className="mt-3">
      {comments.length > 0 ? (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const when = builtAtDigits(comment.at);
            const fromUs = comment.by === "agentsiam";
            return (
              <li
                key={comment.id}
                className={`rounded-panel p-4 ${fromUs ? "bg-wash-gold" : "bg-surface"}`}
              >
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span
                    className={`text-[15px] font-semibold ${
                      fromUs ? "text-deep-gold" : "text-text"
                    }`}
                  >
                    {comment.name}
                  </span>
                  {when ? (
                    <span
                      className="text-[12px] text-muted"
                      style={{ fontFamily: "var(--font-plex-sans), system-ui, sans-serif" }}
                    >
                      {when}
                    </span>
                  ) : null}
                </p>
                {/* Plain text in a React child, so a comment is escaped and stays text. The
                    line breaks somebody typed are kept and nothing else is. */}
                <p className="mt-1 whitespace-pre-wrap text-[16px] leading-7 text-body">
                  {comment.body}
                </p>
              </li>
            );
          })}
        </ul>
      ) : null}

      <form onSubmit={send} className="mt-3">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={MAX_COMMENT_LENGTH}
          rows={3}
          placeholder={placeholder || undefined}
          className="w-full rounded-box border border-border bg-bg px-4 py-3 text-[16px] leading-7 text-text placeholder:text-muted"
        />
        <button
          type="submit"
          aria-label={TEAM_STRINGS.commentSend}
          disabled={busy || body.trim().length === 0}
          className="mt-2 w-full rounded-full bg-ink px-4 py-3.5 text-[17px] font-semibold text-gold-on-ink transition-opacity duration-150 disabled:opacity-30"
        >
          {sendLabel}
        </button>
        {failed && written(TEAM_STRINGS.commentFailed) ? (
          <p className="mt-3 rounded-box bg-wash-red px-4 py-3 text-center text-[15px] leading-6 text-deep-red">
            {written(TEAM_STRINGS.commentFailed)}
          </p>
        ) : null}
      </form>
    </div>
  );
}
