import Link from "next/link";
import { NEW_RECORD } from "@/lib/admin/routes";
import type { RecordSpec } from "@/lib/admin/records";

/**
 * A list of CRM rows, driven by the record's `listColumns`.
 *
 * One component for owner leads and pool properties, because the two lists differ only in
 * which columns they show. The renter lead list is its own page: it carries shortlist
 * counts beside each lead, which come from a different file entirely.
 */
export function RecordList({
  spec,
  rows: allRows,
  pathFor,
  blurb,
  active = {},
}: {
  spec: RecordSpec;
  rows: Record<string, string>[];
  pathFor: (id: string) => string;
  blurb: string;
  /** The filters in the URL, by column. A plain GET form sets them, so a filtered list is a
   * link that can be sent to someone. */
  active?: Record<string, string>;
}) {
  const heading = spec.many.charAt(0).toUpperCase() + spec.many.slice(1);
  const filters = spec.filters ?? [];

  // Filtering on `icp` matches the suggestion too while nobody has confirmed one, because
  // that is what the list shows in the column.
  const shown = (row: Record<string, string>, key: string): string => {
    const column = spec.listColumns.find((item) => item.key === key);
    return row[key] || (column?.fallback ? row[column.fallback] ?? "" : "");
  };
  const rows = allRows.filter((row) =>
    filters.every(({ key }) => !active[key] || shown(row, key) === active[key]),
  );
  const filtering = filters.some(({ key }) => active[key]);

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1
          className="text-xl font-semibold text-text"
          style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
        >
          {heading}
        </h1>
        <Link
          href={pathFor(NEW_RECORD)}
          className="rounded-box bg-ink px-3 py-1.5 text-sm font-semibold text-bg"
        >
          Add a {spec.one}
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted">
        {filtering ? `${rows.length} of ${allRows.length}` : rows.length} in {spec.file}. {blurb}
      </p>

      {filters.length > 0 ? (
        <form method="get" className="mt-4 flex flex-wrap items-end gap-3 text-sm">
          {filters.map(({ key, label }) => {
            const values = Array.from(
              new Set(allRows.map((row) => shown(row, key)).filter((value) => value !== "")),
            ).sort();
            return (
              <label key={key} className="flex flex-col gap-1 text-xs font-semibold text-muted">
                {label}
                <select
                  name={key}
                  defaultValue={active[key] ?? ""}
                  className="rounded-box border border-hairline bg-bg px-2 py-1.5 text-sm font-normal text-text"
                >
                  <option value="">Any</option>
                  {values.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
          <button type="submit" className="rounded-box border border-hairline px-3 py-1.5 font-semibold">
            Filter
          </button>
          {filtering ? (
            <Link href="?" className="py-1.5 text-primary hover:underline">
              Clear
            </Link>
          ) : null}
        </form>
      ) : null}

      {rows.length === 0 ? (
        <p className="mt-6 rounded-panel border border-hairline bg-bg p-5 text-sm text-muted">
          {filtering ? "Nothing matches those filters." : "Nothing in that file yet."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto overscroll-x-contain rounded-panel border border-hairline bg-bg">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs font-semibold text-muted">
                <th className="px-3 py-2">ID</th>
                {spec.listColumns.map((column) => (
                  <th key={column.key} className="px-3 py-2">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[spec.idColumn]} className="border-b border-hairline last:border-0">
                  <td className="px-3 py-3 align-top">
                    <Link
                      href={pathFor(row[spec.idColumn])}
                      className="font-semibold text-primary hover:underline"
                    >
                      {row[spec.idColumn]}
                    </Link>
                  </td>
                  {spec.listColumns.map((column) => (
                    <td key={column.key} className="px-3 py-3 align-top">
                      {row[column.key] ? (
                        row[column.key]
                      ) : column.fallback && row[column.fallback] ? (
                        <span className="text-muted" title="Suggested by the form, not yet confirmed">
                          {row[column.fallback]} (suggested)
                        </span>
                      ) : (
                        <span className="text-muted">not set</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
