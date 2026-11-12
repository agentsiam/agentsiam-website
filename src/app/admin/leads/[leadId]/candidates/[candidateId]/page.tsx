import Link from "next/link";
import { notFound } from "next/navigation";
import { CandidateForm } from "@/components/admin/candidate-form";
import { requireSession } from "@/lib/admin/guard";
import { adminLeadPath, NEW_CANDIDATE } from "@/lib/admin/routes";
import { LEAD_ID, readLead, readShortlist, storeProblem } from "@/lib/admin/store";
import { emptyCandidate } from "@/lib/admin/types";

/** One candidate's thirteen fields, for adding or changing. */

export const dynamic = "force-dynamic";

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ leadId: string; candidateId: string }>;
}) {
  await requireSession();
  const { leadId, candidateId } = await params;
  if (!LEAD_ID.test(leadId)) notFound();

  const problem = storeProblem();
  if (problem) {
    return (
      <div className="rounded-panel border border-hairline bg-wash-red p-5 text-sm text-deep-red">
        {problem}
      </div>
    );
  }

  const lead = await readLead(leadId);
  if (!lead) notFound();

  const isNew = candidateId === NEW_CANDIDATE;
  const shortlist = await readShortlist(leadId);
  const candidate = isNew
    ? emptyCandidate()
    : shortlist.candidates.find((entry) => entry.id === candidateId);
  if (!candidate) notFound();

  return (
    <>
      <p className="text-xs text-muted">
        <Link href={adminLeadPath(leadId)} className="text-primary hover:underline">
          {lead.lead_id} {lead.name}
        </Link>
      </p>
      <h1
        className="mt-1 text-xl font-semibold text-text"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        {isNew ? "Add a candidate" : candidate.property_name || candidate.id}
      </h1>
      <p className="mt-2 text-sm text-muted">
        What this lead asked for: {lead.requirements}
      </p>

      <CandidateForm leadId={leadId} candidate={candidate} isNew={isNew} />
    </>
  );
}
