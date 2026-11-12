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
  rows,
  pathFor,
  blurb,
}: {
  spec: RecordSpec;
  rows: Record<string, string>[];
  pathFor: (id: string) => string;
  blurb: string;
}) {
  const heading = spec.many.charAt(0).toUpperCase() + spec.many.slice(1);

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
        {rows.length} in {spec.file}. {blurb}
      </p>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-panel border border-hairline bg-bg p-5 text-sm text-muted">
          Nothing in that file yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-panel border border-hairline bg-bg">
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
                      {row[column.key] || <span className="text-muted">not set</span>}
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
