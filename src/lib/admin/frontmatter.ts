/**
 * Reading and writing the YAML frontmatter of a client file.
 *
 * The same rule the CSV writer follows, for the same reason: a client record is edited by
 * hand and by Claude as well as in the admin, so a key nobody touched comes back out
 * exactly as it was, comments and blank lines and key order included. That rules out
 * parsing to an object and serialising it back, which would reformat the whole block.
 *
 * Deliberately not a YAML library. What these files hold is one level deep: a key, a colon,
 * a scalar, and one list written inline as `[275645]`. A real parser would accept nesting,
 * anchors and multi-line strings that nothing here can render or write back, and would
 * reformat the file to its own taste on the way out.
 */

export class FrontmatterError extends Error {}

export type Document = { frontmatter: string; body: string };

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function splitDocument(text: string): Document {
  const match = FENCE.exec(text);
  if (!match) throw new FrontmatterError("This file has no frontmatter block.");
  return { frontmatter: match[1], body: text.slice(match[0].length) };
}

export function joinDocument(document: Document): string {
  return `---\n${document.frontmatter}\n---\n${document.body}`;
}

/**
 * The value of a key, without the guidance comment the template carries after it.
 *
 * A `#` only starts a comment when it follows whitespace, so `fee_pct: 20 # of gross` reads
 * as `20` while a value that genuinely contains a hash keeps it. A quoted value is returned
 * unquoted.
 */
export function readValue(frontmatter: string, key: string): string {
  const line = lineFor(frontmatter, key);
  if (line === -1) return "";
  const lines = frontmatter.split("\n");
  const raw = lines[line].slice(lines[line].indexOf(":") + 1);
  const withoutComment = raw.replace(/\s+#.*$/, "");
  const trimmed = withoutComment.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 1) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length > 1)
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function lineFor(frontmatter: string, key: string): number {
  const lines = frontmatter.split("\n");
  const pattern = new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`);
  return lines.findIndex((line) => pattern.test(line));
}

/**
 * Set a key, keeping the rest of the block as it was. The guidance comment after a value is
 * dropped once a real value is written: it is there to say what the choices are, and a
 * filled-in record has already chosen.
 *
 * A value that could be read back as something other than a string is quoted. `yes`, `no`,
 * `on` and `off` are YAML booleans, and a value with a colon in it would split the line, so
 * those get quotes whatever they look like.
 */
export function setValue(frontmatter: string, key: string, value: string): string {
  const lines = frontmatter.split("\n");
  const index = lineFor(frontmatter, key);
  const written = `${key}: ${quoteIfNeeded(value)}`;
  if (index === -1) return [...lines, written].join("\n");
  lines[index] = written;
  return lines.join("\n");
}

function quoteIfNeeded(value: string): boolean | string {
  if (value === "") return "";
  const risky =
    /[:#]/.test(value) ||
    /^(yes|no|on|off|true|false|null|~)$/i.test(value.trim()) ||
    /^[>|&*!%@`]/.test(value) ||
    value !== value.trim();
  return risky ? `"${value.replace(/"/g, '\\"')}"` : value;
}

/** Every key in the block, in the order it is written. */
export function keys(frontmatter: string): string[] {
  return frontmatter
    .split("\n")
    .map((line) => /^([A-Za-z0-9_-]+)\s*:/.exec(line)?.[1] ?? "")
    .filter(Boolean);
}
