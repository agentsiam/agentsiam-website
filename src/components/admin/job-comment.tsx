"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_COMMENT_LENGTH } from "@/lib/cleaning/comment-shape";
import { ADMIN_API_CLEANING } from "@/lib/cleaning/routes";

/**
 * Paul's half of a conversation about one clean.
 *
 * The same thread her phone shows, written from the other end. It posts to the admin route
 * rather than to hers, so the comment is signed AgentSiam rather than with her name, and so
 * the admin session is what authorises it.
 *
 * English, like the rest of the admin. The team's screens are Thai because the team reads
 * Thai; this one has two readers and they wrote the rules file.
 */
export function JobComment({ person, slug }: { person: string; slug: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(ADMIN_API_CLEANING, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", person, slug, body: text }),
      });
      const answer = (await response.json().catch(() => ({}))) as { error?: string };
      if (response.ok) {
        setBody("");
        router.refresh();
      } else {
        setError(answer.error ?? "That did not send.");
      }
    } catch {
      setError("That did not send.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={send} className="mt-3">
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={MAX_COMMENT_LENGTH}
        rows={2}
        placeholder="Reply to her about this clean"
        className="w-full rounded-box border border-hairline bg-bg px-3 py-2 text-sm text-text placeholder:text-muted"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={busy || body.trim().length === 0}
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg disabled:opacity-30"
        >
          Send
        </button>
        {error ? <span className="text-sm text-deep-red">{error}</span> : null}
      </div>
    </form>
  );
}
