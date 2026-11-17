/**
 * What a comment is, and the limits on one, with nothing underneath it.
 *
 * Split from src/lib/cleaning/comments.ts, which does the storing, because both ends of a
 * conversation need to agree on the shape and only one of them runs on a server. The box
 * she types into is a client component; the module that stores what she typed reaches the
 * store, which reaches `node:fs`. Importing one from the other put the store in the browser
 * bundle and the build said so.
 *
 * So: no imports here, no store, no secrets, nothing that cannot be sent to a phone. The
 * limits live here because the box has to stop her at the same number the route refuses
 * her at, and a limit written down twice is a limit that will disagree with itself.
 */

export type CommentAuthor = "team" | "agentsiam";

export type Comment = {
  /** Sortable, and the second half of its own key in the store. */
  id: string;
  /** When it was written, ISO. A screen turns this into digits and never into a Thai date. */
  at: string;
  by: CommentAuthor;
  /** Her name as her document gives it, or the company. Stored rather than looked up, so a
   * thread still reads correctly after a roster key changes hands. */
  name: string;
  body: string;
};

/** Long enough for "the cot is under the stairs, I could not find the spare sheets", short
 * enough that nothing here is a document. */
export const MAX_COMMENT_LENGTH = 500;

/** Per thread. A clean does not need a sixtieth comment, and a phone somebody else is
 * holding does not get to write one. */
export const MAX_COMMENTS = 60;

/**
 * What a visit slug is allowed to look like before it is concatenated into a store key.
 *
 * src/lib/cleaning/document.ts builds one from an ISO date, digits of the time and the
 * property id, and the property id comes from a payload, so it is the one part nobody here
 * controls. This is what stands between it and a crafted key.
 */
export const VISIT_SLUG = /^[A-Za-z0-9_-]{1,80}$/;

/** Trimmed, with runs of blank lines collapsed and the length capped. Returns "" for
 * anything that is not worth storing, which every caller refuses. */
export function cleanBody(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_COMMENT_LENGTH);
}
