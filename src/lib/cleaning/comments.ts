import {
  MAX_COMMENTS,
  VISIT_SLUG,
  cleanBody,
  type Comment,
  type CommentAuthor,
} from "./comment-shape";
import { get, keysUnder, set } from "./store";

/**
 * A conversation about one clean, between the person doing it and AgentSiam.
 *
 * Paul's instruction, 17/11/2026: a comment section where an AgentSiam colleague and the
 * cleaning lady can talk, like the comments under a post.
 *
 * **This is the first thing in the app the team can write into.** Everything until now ran
 * one way: the skill publishes, the app renders, and anything she had to say went back
 * through LINE. The one exception wrote no content, only the moment she last looked. So the
 * guards here are the feature, not paperwork around it.
 *
 * Five of them, and each one closes a specific hole:
 *
 *   - **A thread is per job, not per person.** Both people on a clean, the cleaner and the
 *     laundry round, see the same thread, because they are talking about the same house on
 *     the same afternoon. The key is the visit's own slug, which both of their documents
 *     carry identically.
 *   - **A slug has to be in the asking person's own published document.** Checked by the
 *     two routes that write, not here: a document holds that person's jobs and nobody
 *     else's, so it is the one list that cannot be argued with. Without it, a slug is a
 *     guessable string and another person's thread is a request away.
 *   - **One key per comment, never a list rewritten in place.** Two people typing at once
 *     would otherwise mean one of them silently losing what they wrote, and the case this
 *     exists for is exactly two people talking at once.
 *   - **A cap per thread and a cap per comment.** A phone somebody else is holding cannot
 *     fill the store, and nothing here holds an essay.
 *   - **A deadline.** Longer than the schedule's, because a conversation about a clean
 *     outlives the schedule it was on, and short enough that this does not become a filing
 *     cabinet nobody empties.
 *
 * Nothing in here is rendered as HTML anywhere: a comment is text in a React child, which
 * is escaped, and it is never put in a URL, a header or a key.
 *
 * The shape and the limits are `comment-shape.ts`, which has nothing underneath it, so the
 * box she types into can agree with this module without dragging the store into a phone's
 * bundle. Re-exported here because every server-side caller wants both halves and should
 * not have to know there are two files.
 */

export type { Comment, CommentAuthor };
export { MAX_COMMENT_LENGTH, MAX_COMMENTS, VISIT_SLUG, cleanBody } from "./comment-shape";

export const COMMENT_PREFIX = "cleaning:comment:";

/** Four months. A conversation about a clean outlives the schedule it sat on, and this is
 * not a filing cabinet. */
const COMMENT_TTL_SECONDS = 60 * 60 * 24 * 120;

function threadPrefix(slug: string): string {
  return `${COMMENT_PREFIX}${slug}:`;
}

function parse(raw: string | null, id: string): Comment | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    const at = typeof value.at === "string" ? value.at : "";
    const by: CommentAuthor = value.by === "agentsiam" ? "agentsiam" : "team";
    const name = typeof value.name === "string" ? value.name : "";
    const body = typeof value.body === "string" ? value.body : "";
    if (!at || !body) return null;
    return { id, at, by, name, body };
  } catch {
    return null;
  }
}

/**
 * One job's thread, oldest first.
 *
 * The id carries the millisecond it was written, so sorting the keys is sorting the
 * conversation. A comment that cannot be read back is dropped rather than rendered as a
 * gap: half a thread is better than a screen that says something was said and will not say
 * what.
 */
export async function listComments(slug: string): Promise<Comment[]> {
  if (!VISIT_SLUG.test(slug)) return [];
  const prefix = threadPrefix(slug);
  const keys = (await keysUnder(prefix)).sort();
  const comments: Comment[] = [];
  for (const key of keys) {
    const comment = parse(await get(key), key.slice(prefix.length));
    if (comment) comments.push(comment);
  }
  return comments;
}

export type AddResult = "ok" | "full" | "empty" | "bad-slug";

/**
 * Add one comment to a job's thread.
 *
 * The caller has already decided that this person may write here. This decides only whether
 * what they wrote can be stored, and says which answer it gave rather than throwing, so a
 * full thread and an unreachable store do not arrive at a screen as the same thing.
 */
export async function addComment(
  slug: string,
  comment: { by: CommentAuthor; name: string; body: string },
): Promise<AddResult> {
  if (!VISIT_SLUG.test(slug)) return "bad-slug";
  const body = cleanBody(comment.body);
  if (!body) return "empty";

  const existing = await keysUnder(threadPrefix(slug));
  if (existing.length >= MAX_COMMENTS) return "full";

  const at = new Date();
  // The millisecond, so the key sorts, and six random characters so two people writing in
  // the same millisecond cannot write over each other.
  const id = `${at.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
  const stored: Omit<Comment, "id"> = {
    at: at.toISOString(),
    by: comment.by,
    name: comment.name,
    body,
  };
  await set(`${threadPrefix(slug)}${id}`, JSON.stringify(stored), COMMENT_TTL_SECONDS);
  return "ok";
}
