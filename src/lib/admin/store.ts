/**
 * The document store, read and written from the admin.
 *
 * Paul's decision of 11/11/2026: the shortlist lives in files in the document store, not in
 * a database. guest-leads.csv stays the source of truth for the lead itself and is read
 * here, never written. The candidates live one JSON file per lead beside it, and the
 * blocked-operator list is a file in the same folder. Every save is a commit, so git
 * history is the audit trail and Claude can still read a candidate.
 *
 * Two backends, picked from the environment and never mixed:
 *
 *   CRM_GITHUB_TOKEN set  -> the GitHub contents API, which is how production works. A
 *                            fine-grained token limited to agentsiam-consulting with
 *                            contents read and write, and nothing else.
 *   CRM_LOCAL_PATH set    -> the checkout on this disk, which is how `npm run dev` works.
 *                            Writes land in the working tree and are committed by hand.
 *
 * Neither set is not a fallback to an empty list. The store says it is not configured and
 * the screen says so too: a lookup that reaches across a boundary and finds its source
 * absent stops rather than passing with partial data.
 *
 * Node only. The filesystem import would break the edge bundle, so nothing on the edge,
 * src/proxy.ts included, may import this file.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { CONTACT_EMAIL } from "@/lib/site";
import { parseCsvObjects } from "./csv";
import type { BlockedList } from "./blocked";
import type { Lead, Shortlist } from "./types";

const REPO = process.env.CRM_REPO ?? "agentsiam/agentsiam-consulting";
const BRANCH = process.env.CRM_BRANCH ?? "main";
const TOKEN = process.env.CRM_GITHUB_TOKEN ?? "";
const LOCAL = process.env.CRM_LOCAL_PATH ?? "";

/** The CRM folder inside the document store. One place, so a rename is one edit. */
const CRM = "as-salesmarketing/01-crm";

export const LEADS_FILE = `${CRM}/guest-leads.csv`;
export const BLOCKED_FILE = `${CRM}/blocked-operators.json`;

/** Lead IDs are `G-####` and nothing else. This is the only thing standing between a
 * crafted URL and an arbitrary path in the document store, so it is strict rather than
 * tolerant. */
export const LEAD_ID = /^G-\d{4}$/;

export function shortlistFile(leadId: string): string {
  if (!LEAD_ID.test(leadId)) throw new StoreError(`Not a lead ID: ${leadId}`);
  return `${CRM}/shortlists/${leadId}.json`;
}

export class StoreError extends Error {}

export type StoreMode = "github" | "local" | "none";

export function storeMode(): StoreMode {
  if (TOKEN) return "github";
  if (LOCAL) return "local";
  return "none";
}

/** What is missing, in words, for the screen to print. Null when the store is usable. */
export function storeProblem(): string | null {
  if (storeMode() !== "none") return null;
  return (
    "The document store is not configured, so there is nothing to read. Set CRM_GITHUB_TOKEN " +
    "to a fine-grained GitHub token with contents read and write on agentsiam-consulting, or " +
    "CRM_LOCAL_PATH to a checkout of it on this machine."
  );
}

function requireStore(): StoreMode {
  const mode = storeMode();
  if (mode === "none") throw new StoreError(storeProblem() as string);
  return mode;
}

type Stored = { text: string; sha: string | null };

function localPath(path: string): string {
  const root = resolve(LOCAL);
  const full = resolve(join(root, path));
  // Belt and braces behind LEAD_ID: a path that escapes the checkout is a bug, not a file.
  if (full !== root && !full.startsWith(`${root}/`)) {
    throw new StoreError(`Path outside the document store: ${path}`);
  }
  return full;
}

async function readStored(path: string): Promise<Stored | null> {
  const mode = requireStore();

  if (mode === "local") {
    try {
      return { text: await readFile(localPath(path), "utf8"), sha: null };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  const response = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${encodeURI(path)}?ref=${encodeURIComponent(BRANCH)}`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      // Never cached. A stale shortlist would be written back over a newer one.
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    await failUnlessRepoIsReachable(path);
    return null;
  }
  if (!response.ok) {
    throw new StoreError(
      `GitHub answered ${response.status} reading ${path}. ${await shortBody(response)}`,
    );
  }

  const body = (await response.json()) as { content?: string; encoding?: string; sha?: string };
  if (body.encoding !== "base64" || typeof body.content !== "string") {
    throw new StoreError(`GitHub returned ${path} in an encoding this cannot read.`);
  }
  return {
    text: Buffer.from(body.content, "base64").toString("utf8"),
    sha: body.sha ?? null,
  };
}

/** Set once the repository has answered for this process. A token that can see it keeps
 * seeing it, and a 404 on a shortlist that genuinely does not exist yet is common enough
 * that asking GitHub about the repository every time would be a second request for nothing. */
let repositoryIsReachable = false;

/**
 * A 404 from the contents API carries two meanings that look identical from here: the file
 * is not there, or this token cannot see the repository at all. A fine-grained token left on
 * "Public repositories" gets the second one against a private document store, and calling
 * that a missing file sends whoever reads the screen looking for the wrong thing entirely.
 *
 * So before believing a path is absent, ask after the repository itself. Costs one request,
 * and only on the 404 path, and only until the repository has answered once.
 */
async function failUnlessRepoIsReachable(path: string): Promise<void> {
  if (repositoryIsReachable) return;

  const response = await fetch(`https://api.github.com/repos/${REPO}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (response.ok) {
    repositoryIsReachable = true;
    return;
  }
  if (response.status === 404) {
    throw new StoreError(
      `CRM_GITHUB_TOKEN cannot see ${REPO}, so nothing in it can be read, ${path} included. ` +
        `The document store is private, so a fine-grained token needs Repository access set to ` +
        `that one repository rather than "Public repositories", and Contents read and write ` +
        `under Repository permissions. A token that cannot see a repository is answered with ` +
        `the same 404 as a file that is not there, which is why this says so rather than ` +
        `reporting a missing file.`,
    );
  }
  throw new StoreError(
    `GitHub answered ${response.status} for ${REPO}, asked while working out whether ${path} is ` +
      `missing or merely out of reach. ${await shortBody(response)}`,
  );
}

async function writeStored(
  path: string,
  text: string,
  message: string,
  sha: string | null,
): Promise<void> {
  const mode = requireStore();

  if (mode === "local") {
    const full = localPath(path);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, text, "utf8");
    return;
  }

  const response = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${encodeURI(path)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(text, "utf8").toString("base64"),
        branch: BRANCH,
        ...(sha ? { sha } : {}),
        // The repository's own identity, so the history reads as one author. Who made the
        // change is in the commit message, where a person reading `git log` will see it.
        committer: { name: "agentsiam", email: CONTACT_EMAIL },
        author: { name: "agentsiam", email: CONTACT_EMAIL },
      }),
      cache: "no-store",
    },
  );

  if (response.status === 409) {
    throw new ConflictError(`${path} changed between the read and the write.`);
  }
  if (!response.ok) {
    throw new StoreError(
      `GitHub answered ${response.status} writing ${path}. ${await shortBody(response)}`,
    );
  }
}

export class ConflictError extends StoreError {}

async function shortBody(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? "";
  } catch {
    return "";
  }
}

/**
 * Read a JSON file, change it, write it back, once. On a conflict the whole thing runs
 * again against the newer file, so two people saving different candidates in the same
 * second cannot lose one.
 *
 * A change that produces the same bytes is not written. Without that, a save that turns
 * out to be a no-op, adding an outlet that is already on the blocked list, would still
 * leave a commit in the document store saying something happened.
 */
async function updateJson<T>(
  path: string,
  fallback: () => T,
  change: (current: T) => T,
  message: string,
): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const stored = await readStored(path);
    const current = stored ? (JSON.parse(stored.text) as T) : fallback();
    const next = change(current);
    const text = `${JSON.stringify(next, null, 2)}\n`;
    if (stored && stored.text === text) return next;
    try {
      await writeStored(path, text, message, stored?.sha ?? null);
      return next;
    } catch (error) {
      if (!(error instanceof ConflictError)) throw error;
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new StoreError(`Could not write ${path} after three attempts.`);
}

export async function readLeads(): Promise<Lead[]> {
  const stored = await readStored(LEADS_FILE);
  if (!stored) {
    throw new StoreError(
      `${LEADS_FILE} is not in the document store, so there are no renter leads to show.`,
    );
  }
  return parseCsvObjects(stored.text).filter((row) => LEAD_ID.test(row.lead_id ?? "")) as Lead[];
}

export async function readLead(leadId: string): Promise<Lead | null> {
  const leads = await readLeads();
  return leads.find((lead) => lead.lead_id === leadId) ?? null;
}

export async function readShortlist(leadId: string): Promise<Shortlist> {
  const stored = await readStored(shortlistFile(leadId));
  if (!stored) return { lead_id: leadId, updated_on: "", candidates: [] };
  const parsed = JSON.parse(stored.text) as Shortlist;
  return {
    lead_id: parsed.lead_id ?? leadId,
    updated_on: parsed.updated_on ?? "",
    candidates: Array.isArray(parsed.candidates) ? parsed.candidates : [],
  };
}

export async function updateShortlist(
  leadId: string,
  change: (current: Shortlist) => Shortlist,
  message: string,
): Promise<Shortlist> {
  return updateJson<Shortlist>(
    shortlistFile(leadId),
    () => ({ lead_id: leadId, updated_on: "", candidates: [] }),
    change,
    message,
  );
}

export async function readBlocked(): Promise<BlockedList> {
  const stored = await readStored(BLOCKED_FILE);
  if (!stored) {
    // Never an empty list. An absent blocked list would let every outlet through, and a
    // check that silently passes is worse than no check.
    throw new StoreError(
      `${BLOCKED_FILE} is not in the document store. Until it is readable, no candidate can ` +
        `be saved, because nothing can be checked against the blocked operators.`,
    );
  }
  const parsed = JSON.parse(stored.text) as BlockedList;
  if (!Array.isArray(parsed.operators)) {
    throw new StoreError(`${BLOCKED_FILE} has no operators list.`);
  }
  return parsed;
}

export async function updateBlocked(
  change: (current: BlockedList) => BlockedList,
  message: string,
): Promise<BlockedList> {
  return updateJson<BlockedList>(
    BLOCKED_FILE,
    () => {
      throw new StoreError(`${BLOCKED_FILE} is not in the document store, so nothing can be added to it.`);
    },
    change,
    message,
  );
}

/** Where a change made here lands, for the screen to say out loud. */
export function storeDescription(): string {
  const mode = storeMode();
  if (mode === "github") return `${REPO} on ${BRANCH}, through GitHub`;
  if (mode === "local") return `${LOCAL}, on this machine`;
  return "nowhere: the document store is not configured";
}
