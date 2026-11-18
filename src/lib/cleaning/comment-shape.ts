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

/**
 * The one prefix every photograph this app stores sits under.
 *
 * It lives in this file, with the shapes and the limits, rather than beside the store,
 * because both ends need it: the module that writes a blob, and the screens that turn a
 * stored pathname into the URL of the route that streams it. Those screens are client
 * components, and the module that writes a blob reaches the store, so the two cannot import
 * from each other.
 *
 * It is also what makes the sweep safe: it lists this prefix and nothing else, so no other
 * part of this project can be caught by it and nothing of ours can escape it.
 */
export const PHOTO_PREFIX = "cleaning/";

/**
 * How long a photo lives, and the one rule about photos that is not about storage.
 *
 * Paul, 18/11/2026: photos are deleted after one month, automatically. Vercel Blob has no
 * expiry of its own, so a scheduled job does it, and this number is what that job reads.
 * It is also what a thread reads before showing an image at all, so a photo stops being
 * shown the day it is a month old rather than the next time the sweep happens to run.
 *
 * The comment itself outlives its photo, deliberately: "I could not find the spare sheets"
 * is worth keeping after the picture of the bed has gone.
 */
export const PHOTO_KEPT_DAYS = 30;

/**
 * The most a photo may weigh when it reaches the server.
 *
 * The phone shrinks it first, to the longest edge in MAX_PHOTO_EDGE, which puts an ordinary
 * camera photo somewhere around 200KB. This is the backstop for a phone whose shrink failed
 * and for anything that did not come from the app at all.
 */
export const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

/** The longest edge a photo is shrunk to before it is sent. Proof that a room is clean and
 * proof that a transfer went through are both legible well under this. */
export const MAX_PHOTO_EDGE = 1600;

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
  /**
   * A photo, as its pathname inside the private store, or null.
   *
   * Proof of work from her end and proof of payment from ours. **Not a URL**, which is the
   * whole of Paul's decision of 18/11/2026: the store is private, it answers nothing to a
   * link, and the bytes only come back through /api/cleaning/photo, which checks the same
   * gates as every other screen in this app before it streams one. So a comment that leaked
   * carries a name for a file nobody outside the app can fetch.
   *
   * A comment may carry a photo and no words, words and no photo, or both, but never
   * neither.
   */
  image: string | null;
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

/** Whether a photo taken `at` is still within the month it is kept for. The thread asks
 * this before rendering, so an image stops showing on time rather than whenever the sweep
 * next runs. */
export function photoStillKept(at: string, now: number = Date.now()): boolean {
  const taken = Date.parse(at);
  if (Number.isNaN(taken)) return false;
  return now - taken < PHOTO_KEPT_DAYS * 24 * 60 * 60 * 1000;
}

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
