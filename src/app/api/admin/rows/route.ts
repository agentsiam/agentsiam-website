import { NextResponse } from "next/server";
import { currentSession } from "@/lib/admin/guard";
import { CsvError } from "@/lib/admin/csv";
import { cleanChanges, recordSpec } from "@/lib/admin/records";
import {
  addLead,
  addOwnerLead,
  addProperty,
  updateLead,
  updateOwnerLead,
  updateProperty,
  StoreError,
} from "@/lib/admin/store";

// Node runtime, like the other POST routes on this site.
export const runtime = "nodejs";

/**
 * Saving one row of one CRM table: a renter lead, an owner lead, a pool property.
 *
 * One route for the three because the rules are the same three rules, and three routes
 * would be three places for them to drift. What may be written comes from the record's
 * field spec in src/lib/admin/records.ts, which is the same file the form renders from, so
 * a column the form does not offer is a column this will not write however the request is
 * shaped.
 *
 * With an `id` it changes that row and refuses if it is not there. Without one it adds a
 * row and answers with the id it was given. The store's own retry handles two people saving
 * at once; nothing here needs to know about that.
 */

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { kind?: unknown; id?: unknown; changes?: unknown; historyEntry?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const spec = typeof body.kind === "string" ? recordSpec(body.kind) : null;
  if (!spec) {
    return NextResponse.json({ error: "That is not a record this admin edits." }, { status: 400 });
  }

  if (typeof body.changes !== "object" || body.changes === null) {
    return NextResponse.json({ error: "No changes were sent." }, { status: 400 });
  }

  const cleaned = cleanChanges(spec, body.changes as Record<string, unknown>);
  if ("error" in cleaned) {
    return NextResponse.json({ error: cleaned.error }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const historyEntry = typeof body.historyEntry === "string" ? body.historyEntry : "";

  if (id && !new RegExp(`^${spec.idPrefix}-\\d{4}$`).test(id)) {
    return NextResponse.json({ error: `${id} is not a ${spec.one} ID.` }, { status: 400 });
  }

  try {
    if (id) {
      if (spec.kind === "renter") await updateLead(id, cleaned.changes, session.who);
      if (spec.kind === "owner") {
        await updateOwnerLead(id, cleaned.changes, session.who, historyEntry);
      }
      if (spec.kind === "property") await updateProperty(id, cleaned.changes, session.who);
      return NextResponse.json({ id });
    }

    const added =
      spec.kind === "renter"
        ? await addLead(cleaned.changes, session.who)
        : spec.kind === "owner"
          ? await addOwnerLead(cleaned.changes, session.who)
          : await addProperty(cleaned.changes, session.who);
    return NextResponse.json({ id: added });
  } catch (error) {
    // A CsvError is the request's fault: an id that is not in the file, or a column that
    // file does not have. A StoreError is the store's: unreachable, or still conflicting
    // after three attempts. They are different answers, so they get different codes.
    if (error instanceof CsvError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof StoreError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
