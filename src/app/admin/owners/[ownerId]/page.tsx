import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/guard";
import { Problem } from "@/components/admin/problem";
import { RowForm } from "@/components/admin/row-form";
import { ADMIN_OWNERS, NEW_RECORD } from "@/lib/admin/routes";
import { OWNER } from "@/lib/admin/records";
import { OWNER_ID, readOwnerLead, storeProblem } from "@/lib/admin/store";
import { emptyOwnerLead, historyEntries } from "@/lib/admin/types";

/** One owner lead, with its history shown beside the form that appends to it. */

export const dynamic = "force-dynamic";

export default async function OwnerPage({ params }: { params: Promise<{ ownerId: string }> }) {
  await requireSession();
  const { ownerId } = await params;

  const isNew = ownerId === NEW_RECORD;
  if (!isNew && !OWNER_ID.test(ownerId)) notFound();

  const problem = storeProblem();
  if (problem) return <Problem>{problem}</Problem>;

  let values = emptyOwnerLead();
  if (!isNew) {
    const lead = await readOwnerLead(ownerId);
    if (!lead) notFound();
    values = lead;
  }

  const history = historyEntries(values.history);

  return (
    <>
      <h1
        className="text-xl font-semibold text-text"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        {isNew ? "New owner lead" : `${values.lead_id} ${values.name}`}
      </h1>

      <RowForm
        spec={OWNER}
        values={values as unknown as Record<string, string>}
        isNew={isNew}
        backTo={ADMIN_OWNERS}
        newRowBase={ADMIN_OWNERS}
      />

      {history.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-text">History</h2>
          <ol className="mt-3 space-y-2 rounded-panel border border-hairline bg-bg p-5 text-sm">
            {history.map((entry, index) => (
              <li key={`${index}-${entry.slice(0, 24)}`} className="text-text">
                {entry}
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-muted">
            Newest last, as the CRM keeps it. Added to by the box above, never edited away.
          </p>
        </section>
      ) : null}
    </>
  );
}
