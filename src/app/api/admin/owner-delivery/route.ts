import { NextResponse } from "next/server";
import { currentSession } from "@/lib/admin/guard";
import { candidateFacts, findBlocked, refusalReason } from "@/lib/admin/blocked";
import { candidateFromPool } from "@/lib/admin/owner-delivery";
import {
  LEAD_ID,
  PROPERTY_ID,
  linkCandidateToPool,
  readBlocked,
  readLead,
  readProperty,
  updateProperty,
  updateShortlist,
} from "@/lib/admin/store";
import { candidateId, emptyCandidate, today, type Candidate } from "@/lib/admin/types";

// Node runtime: the store reads the filesystem when it is pointed at a local checkout.
export const runtime = "nodejs";

/**
 * The three things a person records while putting a renter's requirement to pool owners by
 * hand. Nothing here sends a message to anyone: the admin writes the message, a person sends
 * it from their own account, and these record that it happened.
 *
 *   add    a pool property goes on the lead's shortlist, through the same blocked check and
 *          pool link a candidate typed into the form goes through
 *   asked  the owner was asked today: `asked_on`, and `contacted` if it was still `to contact`
 *   terms  the owner accepted the introduction terms: `g2_terms_agreed` yes on the pool row,
 *          which is what lets the admin offer the renter's details for that property
 */

type Body = { action?: unknown; leadId?: unknown; propertyId?: unknown; candidateId?: unknown };

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function failed(error: unknown, fallback: string) {
  return bad(error instanceof Error ? error.message : fallback, 502);
}

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return bad("Not signed in.", 401);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return bad("Malformed request.");
  }

  const action = typeof body.action === "string" ? body.action : "";
  const leadId = typeof body.leadId === "string" ? body.leadId : "";
  const propertyId = typeof body.propertyId === "string" ? body.propertyId : "";
  const id = typeof body.candidateId === "string" ? body.candidateId : "";

  if (!LEAD_ID.test(leadId)) return bad("That is not a lead ID.");
  const lead = await readLead(leadId);
  if (!lead) return bad(`No lead ${leadId}.`, 404);

  if (action === "add") {
    if (!PROPERTY_ID.test(propertyId)) return bad("That is not a property ID.");
    const property = await readProperty(propertyId);
    if (!property) return bad(`No property ${propertyId} in the pool.`, 404);

    const candidate: Candidate = { ...emptyCandidate(), ...candidateFromPool(property) };

    let blocked;
    try {
      blocked = await readBlocked();
    } catch (error) {
      return bad(error instanceof Error ? error.message : "The blocked list is not readable.", 503);
    }
    const match = findBlocked(blocked, candidateFacts(candidate));
    if (match) return bad(refusalReason(match), 422);

    try {
      candidate.property_id = await linkCandidateToPool(candidate, leadId, session.who);
      const now = today();
      await updateShortlist(
        leadId,
        (current) => {
          // Already there: nothing to add, and no second candidate for one property.
          if (current.candidates.some((entry) => entry.property_id === candidate.property_id)) {
            return current;
          }
          return {
            lead_id: leadId,
            updated_on: now,
            candidates: [
              ...current.candidates,
              {
                ...candidate,
                id: candidateId(
                  candidate.property_name,
                  current.candidates.map((entry) => entry.id),
                ),
                added_by: session.who,
                added_on: now,
                updated_by: session.who,
                updated_on: now,
              },
            ],
          };
        },
        `Shortlist ${leadId}: add ${property.name} from the pool, ${propertyId} (${session.who} via the admin)`,
      );
      return NextResponse.json({ ok: true });
    } catch (error) {
      return failed(error, "The property was not added.");
    }
  }

  if (action === "asked") {
    if (!id) return bad("Which candidate?");
    const now = today();
    try {
      let found = false;
      await updateShortlist(
        leadId,
        (current) => ({
          lead_id: leadId,
          updated_on: now,
          candidates: current.candidates.map((entry) => {
            if (entry.id !== id) return entry;
            found = true;
            return {
              ...entry,
              asked_on: now,
              status: entry.status === "to contact" ? "contacted" : entry.status,
              updated_by: session.who,
              updated_on: now,
            };
          }),
        }),
        `Shortlist ${leadId}: owner of ${id} asked (${session.who} via the admin)`,
      );
      if (!found) return bad(`No candidate ${id} on ${leadId}.`, 404);
      return NextResponse.json({ ok: true, asked_on: now });
    } catch (error) {
      return failed(error, "The date was not recorded.");
    }
  }

  if (action === "terms") {
    if (!PROPERTY_ID.test(propertyId)) return bad("That is not a property ID.");
    const property = await readProperty(propertyId);
    if (!property) return bad(`No property ${propertyId} in the pool.`, 404);
    try {
      await updateProperty(
        propertyId,
        { g2_terms_agreed: "yes", last_contact_date: today() },
        session.who,
      );
      return NextResponse.json({ ok: true });
    } catch (error) {
      return failed(error, "The acceptance was not recorded.");
    }
  }

  return bad("Unknown action.");
}
