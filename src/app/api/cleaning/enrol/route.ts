import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { callerIp, rateLimit } from "@/lib/rate-limit";
import { spendEnrolToken } from "@/lib/cleaning/devices";
import { CLEANING_NO_ACCESS, CLEANING_SCHEDULE } from "@/lib/cleaning/routes";
import {
  CLEANING_CONFIGURED,
  CLEANING_COOKIE,
  CLEANING_COOKIE_MAX_AGE,
  issueDeviceCookie,
} from "@/lib/cleaning/session";

export const runtime = "nodejs";

/**
 * Spends an enrolment link and binds this phone to the person it was for.
 *
 * The only route in this app that can be reached without a cookie, because it is the one
 * that hands one out. What stands in front of it is the token: 32 random bytes, held in the
 * store for a week, read and deleted in a single operation so a forwarded link cannot open
 * on two phones.
 *
 * Answers a redirect rather than JSON, because the page that posts here is a plain form and
 * has to work on a phone with no working JavaScript. Both the success and the failure land
 * on a page: her schedule, or the one line telling her to ask Paul for a new link.
 *
 * Rate limited per instance, which is the crude limiter this site uses in front of its
 * other POST routes. It is honest about being one bucket per warm instance, and that is
 * enough here: what protects an enrolment link is that it is unguessable and single-use,
 * not that guesses are counted. The PIN, which is six digits, counts them in the shared
 * store instead.
 */
export async function POST(request: Request) {
  const back = (path: string) => NextResponse.redirect(new URL(path, request.url), 303);

  if (!CLEANING_CONFIGURED) return back(CLEANING_NO_ACCESS);

  if (rateLimit("cleaning-enrol", callerIp(request), { max: 20, windowMs: 10 * 60 * 1000 })) {
    return back(CLEANING_NO_ACCESS);
  }

  let token = "";
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const body = (await request.json()) as { token?: unknown };
      token = typeof body.token === "string" ? body.token : "";
    } else {
      const form = await request.formData();
      const value = form.get("token");
      token = typeof value === "string" ? value : "";
    }
  } catch {
    return back(CLEANING_NO_ACCESS);
  }

  let enrolled: { person: string; device: string } | null = null;
  try {
    // The user agent is kept as a label so Paul can tell two phones apart on the revocation
    // screen. It is bookkeeping and never an identity check: a cookie resolves because the
    // device record exists, not because the agent still matches.
    enrolled = await spendEnrolToken(token, request.headers.get("user-agent") ?? undefined);
  } catch {
    enrolled = null;
  }
  if (!enrolled) return back(CLEANING_NO_ACCESS);

  const store = await cookies();
  store.set(CLEANING_COOKIE, await issueDeviceCookie(enrolled.person, enrolled.device), {
    httpOnly: true,
    sameSite: "lax",
    // Off in development only: a secure cookie is dropped over plain http and `npm run dev`
    // serves plain http.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CLEANING_COOKIE_MAX_AGE,
  });

  return back(CLEANING_SCHEDULE);
}
