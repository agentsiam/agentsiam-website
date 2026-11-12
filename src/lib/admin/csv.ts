/**
 * Reading and writing the CRM's CSV files.
 *
 * Hand-rolled rather than a dependency, because the one thing this has to get right is the
 * quoting: nearly every interesting cell in that file carries commas, and the requirements
 * cell carries quotation marks inside a quoted field. A split on commas loses the lead.
 *
 * Follows RFC 4180: a field may be quoted, a quoted field may hold commas, newlines and
 * doubled quotation marks, and nothing else is special. Rows are returned as they are
 * written; no trimming, because a cell that ends in a space was typed that way.
 *
 * The writing half exists because the admin now edits lead rows rather than only reading
 * them, and these files are worked by hand and by Claude as well. So writing is defined by
 * one rule: a cell nobody edited comes back out byte for byte, column order never changes,
 * and a column the header does not name cannot be invented by a typo in a form field.
 * `scripts/check-csv-roundtrip.mjs` holds that rule to the three real files.
 */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let index = 0;

  // Strip a byte order mark. Excel writes one and it would otherwise become part of the
  // first column's name, so `lead_id` would not be found.
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (index < source.length) {
    const character = source[index];

    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        quoted = false;
        index += 1;
        continue;
      }
      field += character;
      index += 1;
      continue;
    }

    if (character === '"') {
      quoted = true;
      index += 1;
      continue;
    }
    if (character === ",") {
      endField();
      index += 1;
      continue;
    }
    if (character === "\r") {
      // A CRLF line ending, or a lone CR from an old Mac export.
      if (source[index + 1] === "\n") index += 1;
      endRow();
      index += 1;
      continue;
    }
    if (character === "\n") {
      endRow();
      index += 1;
      continue;
    }

    field += character;
    index += 1;
  }

  // A file that ends without a newline still has a last row, and one that ends with a
  // newline must not gain an empty one.
  if (field.length > 0 || row.length > 0) endRow();

  return rows;
}

/**
 * Rows keyed by the header line. A column the header does not name is dropped, and a
 * column the header names but the row does not reach is an empty string, which is what a
 * trailing empty cell means in this file.
 */
export function parseCsvObjects(text: string): Record<string, string>[] {
  const rows = parseCsv(text).filter((row) => row.some((cell) => cell.length > 0));
  if (rows.length === 0) return [];
  const [header, ...body] = rows;
  return body.map((row) => {
    const record: Record<string, string> = {};
    header.forEach((name, column) => {
      record[name] = row[column] ?? "";
    });
    return record;
  });
}

/**
 * One field, quoted only where RFC 4180 requires it or where bare writing would lose
 * something. Leading and trailing spaces are in the second group: they survive a parse
 * either way, but a reader opening the file in a spreadsheet would not see them, and a
 * cell that ends in a space was typed that way.
 */
export function formatCsvField(value: string): string {
  const mustQuote =
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r") ||
    value !== value.trim();
  if (!mustQuote) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Rows back to text, LF line endings, with the trailing newline the file had. Every CRM
 * file ends with one; a file that did not is written back without one rather than being
 * quietly tidied, because tidying shows up as a diff nobody asked for.
 */
export function formatCsv(rows: string[][], trailingNewline = true): string {
  const text = rows.map((row) => row.map(formatCsvField).join(",")).join("\n");
  return trailingNewline && text.length > 0 ? `${text}\n` : text;
}

export class CsvError extends Error {}

function headerOf(rows: string[][]): string[] {
  if (rows.length === 0) throw new CsvError("The file is empty, so it has no header row.");
  return rows[0];
}

function checkColumns(header: string[], changes: Record<string, string>): void {
  for (const name of Object.keys(changes)) {
    if (!header.includes(name)) {
      throw new CsvError(
        `${name} is not a column in this file. Its columns are: ${header.join(", ")}.`,
      );
    }
  }
}

/**
 * Change named cells in the row whose `idColumn` holds `id`, and leave everything else
 * exactly as it was, the other rows included.
 *
 * Throws rather than appending when the id is not there. An update that silently becomes
 * an insert is how a typo in a URL turns into a duplicate record.
 */
export function updateCsvRow(
  text: string,
  idColumn: string,
  id: string,
  changes: Record<string, string>,
): string {
  const rows = parseCsv(text);
  const header = headerOf(rows);
  checkColumns(header, changes);

  const idIndex = header.indexOf(idColumn);
  if (idIndex === -1) throw new CsvError(`${idColumn} is not a column in this file.`);

  let found = false;
  const next = rows.map((row, rowIndex) => {
    if (rowIndex === 0 || row[idIndex] !== id) return row;
    found = true;
    // Pad first: a row that stopped short of the last column has implicit empty cells, and
    // writing to one of those must not land in the wrong column.
    const padded = header.map((_, column) => row[column] ?? "");
    for (const [name, value] of Object.entries(changes)) {
      padded[header.indexOf(name)] = value;
    }
    return padded;
  });

  if (!found) throw new CsvError(`No row in this file has ${idColumn} ${id}.`);
  return formatCsv(next, text.endsWith("\n"));
}

/**
 * Add a row, filling every column the header names and nothing else. A column left out of
 * `values` is written empty, which is what an unanswered field means in these files.
 */
export function appendCsvRow(text: string, values: Record<string, string>): string {
  const rows = parseCsv(text);
  const header = headerOf(rows);
  checkColumns(header, values);
  rows.push(header.map((name) => values[name] ?? ""));
  return formatCsv(rows, text.endsWith("\n") || text.length === 0);
}

/** The ids already in a file, in the order they appear. */
export function csvColumn(text: string, column: string): string[] {
  const rows = parseCsv(text);
  const header = headerOf(rows);
  const index = header.indexOf(column);
  if (index === -1) throw new CsvError(`${column} is not a column in this file.`);
  return rows.slice(1).map((row) => row[index] ?? "").filter((value) => value.length > 0);
}

/**
 * The next `PREFIX-####` id for a file, one above the highest already there. Never reuses
 * a number, the same rule the CRM applies to lead IDs, so a deleted row does not hand its
 * id to the next property.
 */
export function nextId(existing: string[], prefix: string): string {
  let highest = 0;
  for (const value of existing) {
    const match = new RegExp(`^${prefix}-(\\d+)$`).exec(value.trim());
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return `${prefix}-${String(highest + 1).padStart(4, "0")}`;
}
