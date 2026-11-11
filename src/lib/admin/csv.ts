/**
 * Reading guest-leads.csv, which the admin reads and never writes.
 *
 * Hand-rolled rather than a dependency, because the one thing this has to get right is the
 * quoting: nearly every interesting cell in that file carries commas, and the requirements
 * cell carries quotation marks inside a quoted field. A split on commas loses the lead.
 *
 * Follows RFC 4180: a field may be quoted, a quoted field may hold commas, newlines and
 * doubled quotation marks, and nothing else is special. Rows are returned as they are
 * written; no trimming, because a cell that ends in a space was typed that way.
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
