import { NextResponse } from "next/server";
import { currentSession } from "@/lib/admin/guard";
import { OUTLET_KINDS, type BlockedOutlet } from "@/lib/admin/blocked";
import { updateBlocked } from "@/lib/admin/store";
import { today } from "@/lib/admin/types";

export const runtime = "nodejs";

/**
 * Adding an outlet to the blocked list.
 *
 * Only ever an addition. Taking an operator off the list, or changing what one covers, is
 * a decision about who AgentSiam will deal with, and it belongs in the document store with
 * a commit message that says why, not behind a button in a form. The folder's README and
 * the CRM README carry the rule.
 */

const MAX = { operator: 120, value: 200, channel: 60, known_as: 120, note: 600 };

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const operatorName = text(body.operator, MAX.operator);
  const kind = text(body.kind, 20);
  const value = text(body.value, MAX.value);

  if (!operatorName) return NextResponse.json({ error: "Which operator?" }, { status: 400 });
  if (!OUTLET_KINDS.includes(kind as (typeof OUTLET_KINDS)[number])) {
    return NextResponse.json(
      { error: `An outlet is one of: ${OUTLET_KINDS.join(", ")}.` },
      { status: 400 },
    );
  }
  if (value.length < 4) {
    return NextResponse.json(
      { error: "An outlet shorter than four characters would match half the world." },
      { status: 400 },
    );
  }

  const outlet: BlockedOutlet = {
    kind,
    value,
    ...(text(body.channel, MAX.channel) ? { channel: text(body.channel, MAX.channel) } : {}),
    ...(text(body.known_as, MAX.known_as) ? { known_as: text(body.known_as, MAX.known_as) } : {}),
    ...(text(body.note, MAX.note) ? { note: text(body.note, MAX.note) } : {}),
  };

  try {
    let already = false;
    await updateBlocked(
      (current) => {
        const operators = current.operators.map((operator) => ({
          ...operator,
          outlets: [...operator.outlets],
        }));
        const existing = operators.find(
          (operator) => operator.operator.toLowerCase() === operatorName.toLowerCase(),
        );

        if (
          existing?.outlets.some(
            (entry) =>
              entry.kind === outlet.kind &&
              entry.value.toLowerCase() === outlet.value.toLowerCase(),
          )
        ) {
          already = true;
          return current;
        }

        if (existing) {
          existing.outlets.push(outlet);
        } else {
          operators.push({
            operator: operatorName,
            blocked_since: today(),
            outlets: [outlet],
          });
        }

        return { ...current, operators };
      },
      `Blocked operators: ${operatorName}, ${outlet.kind} ${outlet.value} (${session.who} via the admin)`,
    );

    if (already) {
      return NextResponse.json(
        { error: `${outlet.value} is already on the list for ${operatorName}.` },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The addition did not land." },
      { status: 502 },
    );
  }
}
