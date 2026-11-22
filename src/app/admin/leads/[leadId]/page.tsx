import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/guard";
import {
  adminCandidatePath,
  adminLeadEditPath,
  adminLeadPath,
  NEW_CANDIDATE,
} from "@/lib/admin/routes";
import {
  LEAD_ID,
  readBlocked,
  readInquiry,
  readLead,
  readPriceBook,
  readProperties,
  readShortlist,
  storeProblem,
} from "@/lib/admin/store";
import {
  askOwnerMessage,
  introductionFee,
  matchPool,
  renterDetailsMessage,
  requirementOf,
} from "@/lib/admin/owner-delivery";
import { CONTACT_SLOT } from "@/lib/admin/owner-delivery-slot";
import { OwnerDelivery, type DeliveryRow } from "@/components/admin/owner-delivery";
import { unmatchableOutlets } from "@/lib/admin/blocked";
import { isReadyToSend, missingForReady, type Candidate } from "@/lib/admin/types";

/**
 * One renter lead and its shortlist.
 *
 * The lead's own facts are read from renter-leads.csv and shown as they are written there,
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

  // Putting the requirement to pool owners. Each read fails soft: a pool or price book that
  // cannot be read is reported on the screen rather than taking the lead page down with it.
  const inquiry = await readInquiry(leadId).catch(() => null);
  const requirement = requirementOf(lead, inquiry);
  const poolProblem: string[] = [];
  const properties = await readProperties().catch((error) => {
    poolProblem.push(`The property pool could not be read: ${error instanceof Error ? error.message : "unknown error"}`);
    return [];
  });
  const priceBook = await readPriceBook().catch(() => null);
  const fee = priceBook ? introductionFee(priceBook) : null;
  const earlierIds = [...requirement.repeatOf.matchAll(/G-\d{4}/g)].map((hit) => hit[0]);
  const earlier = await Promise.all(
    earlierIds.map(async (id) => ({
      leadId: id,
      candidates: (await readShortlist(id).catch(() => null))?.candidates ?? [],
    })),
  );
  const deliveryRows: DeliveryRow[] = matchPool(
    requirement,
    properties,
    shortlist.candidates,
    earlier,
  ).map((match) => ({
    propertyId: match.property.property_id,
    name: match.property.name,
    area: match.property.area,
    bedrooms: match.property.bedrooms,
    channel: match.property.contact_channel,
    handle: match.property.contact_handle,
    status: match.property.status,
    fits: match.fits,
    misses: match.misses,
    termsAgreed: match.termsAgreed,
    candidateId: match.candidate?.id ?? null,
    askedOn: match.candidate?.asked_on ?? "",
    askedForEarlier: match.askedForEarlier,
    ask: {
      th: askOwnerMessage(requirement, match.property.name, fee, match.termsAgreed, "th"),
      en: askOwnerMessage(requirement, match.property.name, fee, match.termsAgreed, "en"),
    },
    details: {
      th: renterDetailsMessage(requirement, lead.name, CONTACT_SLOT, "th"),
      en: renterDetailsMessage(requirement, lead.name, CONTACT_SLOT, "en"),
    },
  }));
  if (!fee) {
    poolProblem.push(
      "The introduction fee could not be read from the price book (renter_introduction, status agreed), so the owner message leaves it out. Do not send it to an owner who has not accepted the terms until this is fixed.",
    );
  } else if (fee.cap !== "one month's rent") {
    poolProblem.push(
      `The price book's cap now reads "${fee.cap}", which the Thai message has no wording for, so it is shown in English there.`,
    );
  }

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

      <div className="mt-10">
        <h2
          className="text-lg font-semibold text-text"
          style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
        >
          Ask pool owners
        </h2>
        <p className="mt-2 text-sm text-muted">
          Every property in the pool, closest fit first. Nothing here sends anything: copy the
          message, send it from your own LINE, Facebook or email, then record it.
          {requirement.fromForm
            ? ""
            : " This lead was entered by hand, so the message is built from the lead row alone."}
        </p>
        {requirement.repeatOf ? (
          <p className="mt-3 rounded-panel border border-hairline bg-wash-gold p-4 text-sm text-deep-gold">
            Repeat of {requirement.repeatOf}. An owner already asked for the earlier lead is
            marked below; ask them only once.
          </p>
        ) : null}
        {poolProblem.map((line) => (
          <p
            key={line}
            className="mt-3 rounded-panel border border-hairline bg-wash-red p-4 text-sm text-deep-red"
          >
            {line}
          </p>
        ))}
        <OwnerDelivery leadId={leadId} rows={deliveryRows} consent={requirement.consent} />
      </div>

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
