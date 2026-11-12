import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/guard";
import {
  adminCandidatePath,
  adminLeadEditPath,
  adminLeadPath,
  NEW_CANDIDATE,
} from "@/lib/admin/routes";
import { LEAD_ID, readBlocked, readLead, readShortlist, storeProblem } from "@/lib/admin/store";
import { unmatchableOutlets } from "@/lib/admin/blocked";
import { isReadyToSend, missingForReady, type Candidate } from "@/lib/admin/types";

/**
 * One renter lead and its shortlist.
 *
 * The lead's own facts are read from guest-leads.csv and shown as they are written there,
 * including the requirements cell, because that cell is what the candidates have to answer
 * and reading it beside them is the point of the page.
 */

export const dynamic = "force-dynamic";

function statusTone(candidate: Candidate): string {
  if (candidate.status === "rejected") return "bg-wash-red text-deep-red";
  if (candidate.status === "booked") return "bg-wash-green text-deep-green";
  if (candidate.status === "sent to guest") return "bg-wash-green text-deep-green";
  if (isReadyToSend(candidate)) return "bg-wash-gold text-deep-gold";
  return "bg-surface-2 text-muted";
}

export default async function LeadPage({ params }: { params: Promise<{ leadId: string }> }) {
  await requireSession();
  const { leadId } = await params;
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

  const shortlist = await readShortlist(leadId);
  const blocked = await readBlocked().catch(() => null);
  const unmatchable = blocked ? unmatchableOutlets(blocked) : [];

  const facts: Array<[string, string]> = [
    ["Dates", lead.dates_requested],
    ["Nights", lead.nights],
    ["Guests", lead.guests],
    ["Area wanted", lead.area_wanted],
    ["Budget", lead.budget_thb || "not stated"],
    ["Stage", lead.stage],
    ["Owner", lead.owner],
    ["Next action", lead.next_action],
    ["Next action date", lead.next_action_date],
  ];

  return (
    <>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h1
          className="text-xl font-semibold text-text"
          style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
        >
          {lead.lead_id} {lead.name}
        </h1>
        <Link
          href={adminLeadEditPath(leadId)}
          className="text-xs text-primary hover:underline"
        >
          Edit this lead
        </Link>
      </div>

      <dl className="mt-5 grid gap-x-8 gap-y-3 rounded-panel border border-hairline bg-bg p-5 text-sm sm:grid-cols-2">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold text-muted">{label}</dt>
            <dd className="text-text">{value}</dd>
          </div>
        ))}
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold text-muted">Requirements, in their words</dt>
          <dd className="text-text">{lead.requirements}</dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-lg font-semibold text-text"
          style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
        >
          Shortlist
        </h2>
        <Link
          href={adminCandidatePath(leadId, NEW_CANDIDATE)}
          className="rounded-box bg-ink px-4 py-2 text-sm font-semibold text-bg"
        >
          Add a candidate
        </Link>
      </div>

      <p className="mt-2 text-sm text-muted">
        Ready to send needs all four: available yes, a total price, a short-stay licence
        status, and at least one photo link.
      </p>

      {shortlist.candidates.length === 0 ? (
        <p className="mt-6 rounded-panel border border-hairline bg-bg p-5 text-sm text-muted">
          Nothing on the shortlist yet.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {shortlist.candidates.map((candidate) => {
            const missing = missingForReady(candidate);
            return (
              <li
                key={candidate.id}
                className="rounded-panel border border-hairline bg-bg p-5 text-sm"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Link
                    href={adminCandidatePath(leadId, candidate.id)}
                    className="font-semibold text-primary hover:underline"
                  >
                    {candidate.property_name || candidate.id}
                  </Link>
                  <span
                    className={`rounded-box px-2 py-0.5 text-xs font-semibold ${statusTone(candidate)}`}
                  >
                    {candidate.status}
                  </span>
                  {missing.length === 0 ? (
                    <span className="text-xs font-semibold text-deep-green">
                      complete enough to send
                    </span>
                  ) : (
                    <span className="text-xs text-muted">still missing: {missing.join(", ")}</span>
                  )}
                </div>

                <div className="mt-2 grid gap-x-8 gap-y-1 text-xs text-muted sm:grid-cols-3">
                  <div>
                    {candidate.area || "area not recorded"}
                    {candidate.bedrooms ? `, ${candidate.bedrooms} bed` : ""}
                    {candidate.bed_set_up ? `, ${candidate.bed_set_up}` : ""}
                  </div>
                  <div>
                    {candidate.pool ? `pool: ${candidate.pool}` : "pool not recorded"}
                    {candidate.walkable ? `, walkable: ${candidate.walkable}` : ""}
                  </div>
                  <div>
                    {candidate.total_price_thb === null
                      ? "no total price yet"
                      : `${candidate.total_price_thb.toLocaleString("en-GB")} THB total`}
                    {candidate.available ? `, available: ${candidate.available}` : ""}
                  </div>
                </div>

                {candidate.rejected_reason ? (
                  <p className="mt-2 text-xs text-deep-red">
                    Rejected: {candidate.rejected_reason}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {unmatchable.length > 0 ? (
        <div className="mt-8 rounded-panel border border-hairline bg-wash-gold p-5 text-sm text-deep-gold">
          <p className="font-semibold">What the blocked check cannot catch</p>
          <ul className="mt-2 space-y-1">
            {unmatchable.map(({ operator, outlet }) => (
              <li key={`${operator}-${outlet.value}`}>
                {operator}
                {outlet.channel ? `, ${outlet.channel}` : ""}: {outlet.note ?? outlet.value}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-8 text-xs text-muted">
        <Link href={adminLeadPath(leadId)} className="text-primary hover:underline">
          Reload this lead
        </Link>{" "}
        to pick up a change someone else saved.
      </p>
    </>
  );
}
