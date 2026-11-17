import { NextResponse } from "next/server";
import { currentSession } from "@/lib/admin/guard";
import { PIN_SHAPE, createEnrolToken, revokeDevice, setPin } from "@/lib/cleaning/devices";
import { cleaningEnrolPath } from "@/lib/cleaning/routes";
import { PERSON_KEY } from "@/lib/cleaning/session";
import { storeProblem } from "@/lib/cleaning/store";

export const runtime = "nodejs";

/**
 * The three things Paul does to the cleaning app: issue a link, revoke a phone, set a PIN.
 *
 * Behind the admin session, because Paul is already signed in to one and a second sign-in
 * for the same person is a second thing to lose. Nothing here reads a door code or a
 * schedule: it is device bookkeeping, and the codes live in the published document, which
 * only the person they belong to can open.
 *
 * The session is checked here as well as in src/proxy.ts, for the same reason every other
 * admin route checks it: an edge check reads a cookie and cannot be the only thing standing
 * in front of a route that mints an enrolment link.
 */
export async function POST(request: Request) {
  if (!(await currentSession())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const problem = storeProblem();
  if (problem) return NextResponse.json({ error: problem }, { status: 503 });

  let body: { action?: unknown; person?: unknown; device?: unknown; pin?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const person = typeof body.person === "string" ? body.person : "";
  if (!PERSON_KEY.test(person)) {
    return NextResponse.json({ error: "That is not a roster key." }, { status: 400 });
  }

  try {
    if (body.action === "link") {
      const token = await createEnrolToken(person);
      return NextResponse.json({ url: enrolUrl(request, token) });
    }

    if (body.action === "revoke") {
      const device = typeof body.device === "string" ? body.device : "";
      const gone = await revokeDevice(person, device);
      if (!gone) {
        return NextResponse.json({ error: "No such device for that person." }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "pin") {
      const pin = typeof body.pin === "string" ? body.pin : "";
      if (!PIN_SHAPE.test(pin)) {
        return NextResponse.json({ error: "A PIN is four to eight digits." }, { status: 400 });
      }
      await setPin(person, pin);
      return NextResponse.json({ ok: true });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "That did not work." },
      { status: 500 },
    );
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

/**
 * The link Paul pastes into LINE, absolute, because a relative path is not something a
 * person can tap out of a chat.
 *
 * On the team's own subdomain the /cleaning prefix is not in the URL, so the link is built
 * without it. Off that subdomain it is built from the host this request arrived on, which is
 * whatever Paul has open.
 */
function enrolUrl(request: Request, token: string): string {
  const host = (process.env.CLEANING_HOST ?? "").trim();
  if (host) return `https://${host}/enrol/${token}`;
  return new URL(cleaningEnrolPath(token), request.url).toString();
}
