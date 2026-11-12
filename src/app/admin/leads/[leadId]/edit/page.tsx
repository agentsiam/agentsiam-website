import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/guard";
import { Problem } from "@/components/admin/problem";
import { RowForm } from "@/components/admin/row-form";
import { adminLeadPath } from "@/lib/admin/routes";
import { RENTER } from "@/lib/admin/records";
import { LEAD_ID, readLead, storeProblem } from "@/lib/admin/store";

/**
 * The renter lead's own row.
 *
 * On a page of its own rather than inline on the lead, so the lead page stays about the
 * shortlist. Editable since 12/11/2026; before that the row was changed in the CSV by hand.
 */

export const dynamic = "force-dynamic";

export default async function EditLeadPage({ params }: { params: Promise<{ leadId: string }> }) {
  await requireSession();
  const { leadId } = await params;
  if (!LEAD_ID.test(leadId)) notFound();

  const problem = storeProblem();
  if (problem) return <Problem>{problem}</Problem>;

  const lead = await readLead(leadId);
  if (!lead) notFound();

  return (
    <>
      <h1
        className="text-xl font-semibold text-text"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        {lead.lead_id} {lead.name}
      </h1>
      <p className="mt-2 text-sm text-muted">
        The lead&apos;s own row in {RENTER.file}. Its shortlist is on the lead page.
      </p>

      <RowForm
        spec={RENTER}
        values={lead as unknown as Record<string, string>}
        isNew={false}
        backTo={adminLeadPath(leadId)}
        newRowBase="/admin/leads"
      />
    </>
  );
}
