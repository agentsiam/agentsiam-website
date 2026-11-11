import Link from "next/link";
import { requireSession } from "@/lib/admin/guard";
import { adminLeadPath } from "@/lib/admin/routes";
import { LEADS_FILE, readLeads, readShortlist, storeProblem } from "@/lib/admin/store";
import { isReadyToSend, type Lead, type Shortlist } from "@/lib/admin/types";

/**
 * Every renter lead, with how far its shortlist has got.
 *
 * The leads are read from guest-leads.csv in the document store and never written here:
 * the CSV stays the source of truth for the lead, worked there and through Claude as it is
 * today. The shortlist beside each one is this admin's own file.
 *
 * Dynamic on every request. A cached lead list would show a stage somebody has already
 * moved on from, and this page exists to be looked at before picking up the phone.
 */

export const dynamic = "force-dynamic";

function Problem({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-panel border border-hairline bg-wash-red p-5 text-sm text-deep-red">
      {children}
    </div>
  );
}

export default async function AdminHome() {
  await requireSession();

  const problem = storeProblem();
  if (problem) return <Problem>{problem}</Problem>;

  let leads: Lead[];
  let shortlists: Shortlist[];
  try {
    leads = await readLeads();
    shortlists = await Promise.all(leads.map((lead) => readShortlist(lead.lead_id)));
  } catch (error) {
    return (
      <Problem>
        {error instanceof Error ? error.message : `Could not read ${LEADS_FILE}.`}
      </Problem>
    );
  }

  const byLead = new Map(shortlists.map((shortlist) => [shortlist.lead_id, shortlist]));

  return (
    <>
      <h1
        className="text-xl font-semibold text-text"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        Renter leads
      </h1>
      <p className="mt-2 text-sm text-muted">
        {leads.length} in {LEADS_FILE}. Open one to build its shortlist. Stage, dates and the
        next action are read from that file and changed there.
      </p>

      <div className="mt-6 overflow-x-auto rounded-panel border border-hairline bg-bg">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs font-semibold text-muted">
              <th className="px-3 py-2">Lead</th>
              <th className="px-3 py-2">Dates</th>
              <th className="px-3 py-2">Nights</th>
              <th className="px-3 py-2">Guests</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">Next action</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Shortlist</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const shortlist = byLead.get(lead.lead_id);
              const candidates = shortlist?.candidates ?? [];
              const ready = candidates.filter(isReadyToSend).length;
              const sent = candidates.filter(
                (candidate) =>
                  candidate.status === "sent to guest" || candidate.status === "booked",
              ).length;
              return (
                <tr key={lead.lead_id} className="border-b border-hairline last:border-0">
                  <td className="px-3 py-3 align-top">
                    <Link
                      href={adminLeadPath(lead.lead_id)}
                      className="font-semibold text-primary hover:underline"
                    >
                      {lead.lead_id}
                    </Link>
                    <div className="text-text">{lead.name}</div>
                    <div className="text-xs text-muted">{lead.area_wanted}</div>
                  </td>
                  <td className="px-3 py-3 align-top">{lead.dates_requested}</td>
                  <td className="px-3 py-3 align-top">{lead.nights}</td>
                  <td className="px-3 py-3 align-top">{lead.guests}</td>
                  <td className="px-3 py-3 align-top">{lead.stage}</td>
                  <td className="px-3 py-3 align-top text-xs">{lead.next_action_date}</td>
                  <td className="px-3 py-3 align-top">{lead.owner}</td>
                  <td className="px-3 py-3 align-top">
                    {candidates.length === 0 ? (
                      <span className="text-muted">none yet</span>
                    ) : (
                      <>
                        <div>{candidates.length} candidates</div>
                        <div className="text-xs text-muted">
                          {ready} ready to send{sent > 0 ? `, ${sent} sent or booked` : ""}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
