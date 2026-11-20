import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { callerIp, rateLimit } from "@/lib/rate-limit";
import { spendEnrolToken, type EnrolSpend } from "@/lib/cleaning/devices";
import {
  CLEANING_NO_ACCESS,
  CLEANING_SCHEDULE,
  cleaningEnrolPath,
} from "@/lib/cleaning/routes";
import {
  CLEANING_CONFIGURED,
  CLEANING_COOKIE,
  CLEANING_COOKIE_MAX_AGE,
  CLEANING_PIN_COOKIE,
  CLEANING_PIN_MAX_AGE,
  issueDeviceCookie,
  issuePinCookie,
} from "@/lib/cleaning/session";

export const runtime = "nodejs";

/**
 * Enrols this browser against an enrolment link and her PIN.
 *
 * The only route in this app that can be reached without a cookie, because it is the one
 * that hands one out. What stands in front of it is the link, 32 random bytes held in the
 * store for thirty days, **and her PIN, which since 20/11/2026 is the part that proves it
 * is her.** The link survives being opened, so one link enrols LINE's in-app browser and
 * her own browser and a new phone, each as a record of its own; what a forwarded or
 * screenshotted link is worth is whatever the holder knows of her code, and five wrong
 * answers delete it. src/lib/cleaning/devices.ts carries that argument.
 *
 * **It hands out the PIN cookie as well as the device cookie**, because she has just typed
 * the PIN to get here and the next screen's gate would otherwise ask for it again. The gate
 * moved one screen earlier; it was not added to.
 *
 * Answers a redirect rather than JSON, because the page that posts here is a plain form and
 * has to work on a phone with no working JavaScript. Every answer lands on a page: her
 * schedule, the same screen again with one line about her code, or the one line telling her
 * to ask Paul for a new link.
 *
 * Rate limited per instance, which is the crude limiter this site uses in front of its other
 * POST routes. It is honest about being one bucket per warm instance, which is why it is not
 * what counts the PIN tries: those are counted against the link, in the shared store.
 */
export async function POST(request: Request) {
  const back = (path: string) => NextResponse.redirect(new URL(path, request.url), 303);

  if (!CLEANING_CONFIGURED) return back(CLEANING_NO_ACCESS);

  if (rateLimit("cleaning-enrol", callerIp(request), { max: 20, windowMs: 10 * 60 * 1000 })) {
    return back(CLEANING_NO_ACCESS);
  }

  let token = "";
  let pin = "";
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const body = (await request.json()) as { token?: unknown; pin?: unknown };
      token = typeof body.token === "string" ? body.token : "";
      pin = typeof body.pin === "string" ? body.pin : "";
    } else {
      const form = await request.formData();
      const sent = form.get("token");
      const offered = form.get("pin");
      token = typeof sent === "string" ? sent : "";
      pin = typeof offered === "string" ? offered : "";
    }
  } catch {
    return back(CLEANING_NO_ACCESS);
  }

  let spent: EnrolSpend;
  try {
    // The user agent is kept on the record as the fallback label, behind the name Paul types
    // on his own screen. It is bookkeeping and never an identity check: a cookie resolves
    // because the device record exists, not because the agent still matches.
    spent = await spendEnrolToken(token, pin, request.headers.get("user-agent") ?? undefined);
  } catch {
    spent = { state: "dead" };
  }

  // **A wrong code is not a dead link**, and telling her to ask Paul for a new one would be
  // the wrong instruction as well as a lie: the link is still good and she has tries left.
  // Back to the same screen, which says which of the two it was. The token in this path came
  // out of the store a moment ago, so it is a link and not something she typed.
  if (spent.state === "wrong" || spent.state === "unset") {
    return back(`${cleaningEnrolPath(token)}?${spent.state}=1`);
  }
  if (spent.state !== "ok") return back(CLEANING_NO_ACCESS);

  const store = await cookies();
  const held = {
    httpOnly: true,
    sameSite: "lax" as const,
    // Off in development only: a secure cookie is dropped over plain http and `npm run dev`
    // serves plain http.
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  store.set(CLEANING_COOKIE, await issueDeviceCookie(spent.person, spent.device), {
    ...held,
    maxAge: CLEANING_COOKIE_MAX_AGE,
  });
  store.set(CLEANING_PIN_COOKIE, await issuePinCookie(spent.person, spent.device), {
    ...held,
    maxAge: CLEANING_PIN_MAX_AGE,
  });

  return back(CLEANING_SCHEDULE);
}
