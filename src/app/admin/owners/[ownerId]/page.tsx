import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/guard";
import { Problem } from "@/components/admin/problem";
import { RowForm } from "@/components/admin/row-form";
import { ADMIN_OWNERS, NEW_RECORD } from "@/lib/admin/routes";
import { OWNER } from "@/lib/admin/records";
import { OWNER_ID, readOwnerInquiry, readOwnerLead, storeProblem } from "@/lib/admin/store";
import { emptyOwnerLead, historyEntries, type OwnerInquiry } from "@/lib/admin/types";

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
  let inquiry: OwnerInquiry | null = null;
  if (!isNew) {
    const lead = await readOwnerLead(ownerId);
    if (!lead) notFound();
    // Rows written before the newer columns existed come back without them, and an absent
    // key would leave a form input uncontrolled. The stored value always wins.
    values = { ...emptyOwnerLead(), ...lead };
    // Only leads that came through the owner form have one. A failed read is not worth
    // losing the page over: the row above is the record.
    inquiry = await readOwnerInquiry(ownerId).catch(() => null);
  }

  const attribution = inquiry
    ? ([
        ["Captured from", inquiry.attribution.captured],
        ["Landing page", inquiry.attribution.landing_path],
        ["Form page", inquiry.form_page],
        ["Referrer", inquiry.attribution.referrer],
        ["UTM source", inquiry.attribution.utm_source],
        ["UTM medium", inquiry.attribution.utm_medium],
        ["UTM campaign", inquiry.attribution.utm_campaign],
        ["UTM term", inquiry.attribution.utm_term],
        ["UTM content", inquiry.attribution.utm_content],
        ["Google click ID", inquiry.attribution.gclid],
        ["Facebook click ID", inquiry.attribution.fbclid],
      ] as [string, string][])
    : [];

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

      {inquiry ? (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-text">Where this lead came from</h2>
          <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1.5 rounded-panel border border-hairline bg-bg p-5 text-sm">
            {attribution.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted">{label}</dt>
                <dd className="text-text">{value || <span className="text-muted">none</span>}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-muted">
            From the enquiry as it arrived on {inquiry.received_on}, kept in owner-inquiries/
            beside the lead file.
          </p>
        </section>
      ) : null}

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
