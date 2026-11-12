import { NextResponse } from "next/server";
import { currentSession } from "@/lib/admin/guard";
import { candidateFacts, findBlocked, refusalReason } from "@/lib/admin/blocked";
import {
  LEAD_ID,
  linkCandidateToPool,
  readBlocked,
  readLead,
  updateShortlist,
} from "@/lib/admin/store";
import {
  CANDIDATE_STATUSES,
  CONTACT_CHANNELS,
  LICENCES,
  POOL_KINDS,
  STATUSES_NEEDING_READY,
  WALKABLE,
  YES_NO_UNKNOWN,
  candidateId,
  emptyCandidate,
  missingForReady,
  today,
  type Candidate,
  type CandidateStatus,
} from "@/lib/admin/types";

// Node runtime: the store reads the filesystem when it is pointed at a local checkout.
export const runtime = "nodejs";

/**
 * Saving and removing a shortlist candidate.
 *
 * Three things happen in order, and the order is the design. The session is checked, so a
 * signed-out caller never reaches the store even though the proxy already turned them
 * away. The candidate is validated, so a hand-rolled POST cannot write a status or a
 * licence value the document store does not recognise. Then the blocked list is checked,
 * and a match is refused with the outlet named: a candidate from another management
 * company's channel is never written, however it arrived.
 *
 * The write itself is a read, a change and a write of one JSON file, retried against the
 * newer file if it changed underneath. Two people saving two candidates on the same lead
 * in the same second cannot lose one.
 */

const MAX = {
  property_name: 120,
  source_link: 500,
  contact_handle: 120,
  area: 120,
  map_link: 500,
  bedrooms: 40,
  bed_set_up: 120,
  transport_if_not_walkable: 300,
  availability_confirmed_on: 10,
  rejected_reason: 400,
  notes: 4000,
  photo_link: 500,
};

const MAX_PHOTO_LINKS = 20;

/** 50 million baht for one stay is not a price, it is a typo or a hand-rolled POST. */
const MAX_PRICE_THB = 50_000_000;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function oneOf(value: unknown, allowed: readonly string[], fallback = ""): string | null {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (trimmed === "") return fallback;
  return allowed.includes(trimmed) ? trimmed : null;
}

type Incoming = Record<string, unknown>;

function badRequest(error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, ...extra }, { status: 400 });
}

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { leadId?: unknown; candidate?: unknown };
  try {
    body = (await request.json()) as { leadId?: unknown; candidate?: unknown };
  } catch {
    return badRequest("Malformed request.");
  }

  const leadId = typeof body.leadId === "string" ? body.leadId : "";
  if (!LEAD_ID.test(leadId)) return badRequest("That is not a lead ID.");

  const incoming = (body.candidate ?? {}) as Incoming;

  // A shortlist only exists for a lead that exists. Without this, a crafted lead ID would
  // create a file in the document store for a renter nobody has ever spoken to.
  const lead = await readLead(leadId);
  if (!lead) return NextResponse.json({ error: `No lead ${leadId}.` }, { status: 404 });

  const propertyName = text(incoming.property_name, MAX.property_name);
  if (!propertyName) return badRequest("A candidate needs a property name.");

  const channel = oneOf(incoming.contact_channel, CONTACT_CHANNELS);
  const pool = oneOf(incoming.pool, POOL_KINDS);
  const walkable = oneOf(incoming.walkable, WALKABLE);
  const licence = oneOf(incoming.licence, LICENCES, "unknown");
  const available = oneOf(incoming.available, YES_NO_UNKNOWN, "unknown");
  const includesEverything = oneOf(incoming.price_includes_everything, YES_NO_UNKNOWN, "unknown");
  const status = oneOf(incoming.status, CANDIDATE_STATUSES, "to contact");

  if (
    channel === null ||
    pool === null ||
    walkable === null ||
    licence === null ||
    available === null ||
    includesEverything === null ||
    status === null
  ) {
    return badRequest("One of the fixed-choice fields holds a value this does not recognise.");
  }

  let price: number | null = null;
  if (incoming.total_price_thb !== null && incoming.total_price_thb !== undefined && incoming.total_price_thb !== "") {
    const parsed = Number(incoming.total_price_thb);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_PRICE_THB) {
      return badRequest("The total price has to be a number of baht, or left empty.");
    }
    price = Math.round(parsed);
  }

  const confirmedOn = text(incoming.availability_confirmed_on, MAX.availability_confirmed_on);
  if (confirmedOn && !ISO_DATE.test(confirmedOn)) {
    return badRequest("The date the owner confirmed has to be a date.");
  }

  const photoLinks = Array.isArray(incoming.photo_links)
    ? incoming.photo_links
        .map((link) => text(link, MAX.photo_link))
        .filter(Boolean)
        .slice(0, MAX_PHOTO_LINKS)
    : [];

  const candidate: Candidate = {
    ...emptyCandidate(),
    id: text(incoming.id, 64),
    // Carried through from the stored candidate rather than typed. A pool id the caller
    // invented is checked against the pool before it is believed, in linkCandidateToPool.
    property_id: text(incoming.property_id, 16),
    property_name: propertyName,
    source_link: text(incoming.source_link, MAX.source_link),
    contact_channel: channel,
    contact_handle: text(incoming.contact_handle, MAX.contact_handle),
    area: text(incoming.area, MAX.area),
    map_link: text(incoming.map_link, MAX.map_link),
    bedrooms: text(incoming.bedrooms, MAX.bedrooms),
    bed_set_up: text(incoming.bed_set_up, MAX.bed_set_up),
    pool,
    walkable,
    transport_if_not_walkable: walkable === "no"
      ? text(incoming.transport_if_not_walkable, MAX.transport_if_not_walkable)
      : "",
    licence,
    available,
    availability_confirmed_on: confirmedOn,
    total_price_thb: price,
    price_includes_everything: includesEverything,
    photo_links: photoLinks,
    status: status as CandidateStatus,
    rejected_reason:
      status === "rejected" ? text(incoming.rejected_reason, MAX.rejected_reason) : "",
    notes: text(incoming.notes, MAX.notes),
  };

  if (candidate.status === "rejected" && !candidate.rejected_reason) {
    return badRequest("A rejection needs a reason.");
  }

  const missing = missingForReady(candidate);
  if (STATUSES_NEEDING_READY.includes(candidate.status) && missing.length > 0) {
    return NextResponse.json(
      {
        error: `Not complete enough for "${candidate.status}". Still missing: ${missing.join(", ")}.`,
        missing,
      },
      { status: 422 },
    );
  }

  // The blocked list is read on every save rather than cached, so an outlet added a minute
  // ago is enforced a minute later.
  let blockedList;
  try {
    blockedList = await readBlocked();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The blocked list is not readable." },
      { status: 503 },
    );
  }

  const match = findBlocked(blockedList, candidateFacts(candidate));
  if (match) {
    return NextResponse.json({ error: refusalReason(match), blocked: true }, { status: 422 });
  }

  // The pool row first, so the candidate is saved already carrying its `property_id` and
  // one shortlist commit covers the whole save. A pool row written here and then a
  // shortlist save that fails leaves a property in the pool with no candidate pointing at
  // it, which is visible on the Property pool screen and is adopted rather than duplicated
  // on the next attempt, because the match falls back to the name.
  let propertyId = candidate.property_id;
  try {
    propertyId = await linkCandidateToPool(candidate, leadId, session.who);
  } catch (error) {
    return NextResponse.json(
      {
        error: `The candidate was not saved, because the property pool could not be ${
          candidate.property_id ? "updated" : "added to"
        }. ${error instanceof Error ? error.message : ""}`.trim(),
      },
      { status: 502 },
    );
  }
  candidate.property_id = propertyId;

  const now = today();
  try {
    const saved = await updateShortlist(
      leadId,
      (current) => {
        const candidates = [...current.candidates];
        const existing = candidate.id
          ? candidates.findIndex((entry) => entry.id === candidate.id)
          : -1;

        if (existing >= 0) {
          candidates[existing] = {
            ...candidate,
            added_by: candidates[existing].added_by,
            added_on: candidates[existing].added_on,
            updated_by: session.who,
            updated_on: now,
          };
        } else {
          candidates.push({
            ...candidate,
            id: candidateId(
              candidate.property_name,
              candidates.map((entry) => entry.id),
            ),
            added_by: session.who,
            added_on: now,
            updated_by: session.who,
            updated_on: now,
          });
        }

        return { lead_id: leadId, updated_on: now, candidates };
      },
      `Shortlist ${leadId}: ${candidate.id ? "update" : "add"} ${candidate.property_name} (${session.who} via the admin)`,
    );

    const stored =
      saved.candidates.find((entry) => entry.id === candidate.id) ??
      saved.candidates[saved.candidates.length - 1];
    return NextResponse.json({ ok: true, candidate: stored });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The save did not land." },
      { status: 502 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { leadId?: unknown; id?: unknown };
  try {
    body = (await request.json()) as { leadId?: unknown; id?: unknown };
  } catch {
    return badRequest("Malformed request.");
  }

  const leadId = typeof body.leadId === "string" ? body.leadId : "";
  const id = typeof body.id === "string" ? body.id : "";
  if (!LEAD_ID.test(leadId) || !id) return badRequest("Which candidate, on which lead?");

  try {
    await updateShortlist(
      leadId,
      (current) => ({
        lead_id: leadId,
        updated_on: today(),
        candidates: current.candidates.filter((entry) => entry.id !== id),
      }),
      `Shortlist ${leadId}: remove ${id} (${session.who} via the admin)`,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The removal did not land." },
      { status: 502 },
    );
  }
}
