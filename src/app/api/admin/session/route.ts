import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { callerIp, rateLimit } from "@/lib/rate-limit";
import {
  ADMIN_CONFIGURED,
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  issueSession,
  whoSignedIn,
} from "@/lib/admin/session";

// Node runtime, like the other POST routes on this site.
export const runtime = "nodejs";

/**
 * Signing in and out of the renter shortlist admin.
 *
 * POST takes a passphrase and sets the cookie. DELETE clears it. There is nothing to
 * register, nothing to reset and no account: the two passphrases live in the Vercel
 * project's environment variables, and rotating one means editing a variable and
 * redeploying.
 *
 * Throttled per instance, ten tries in ten minutes. That is the same crude, honest limit
 * the contact and stay-request routes use: module scope on a serverless platform means one
 * bucket per warm instance, so it stops a script rather than a determined attacker. What
 * actually protects a passphrase here is its length.
 */

export async function POST(request: Request) {
  if (!ADMIN_CONFIGURED) {
    return NextResponse.json(
      { error: "This admin has no passphrases set, so nobody can sign in." },
      { status: 503 },
    );
  }

  if (rateLimit("admin-session", callerIp(request), { max: 10, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json(
      { error: "Too many tries. Wait ten minutes." },
      { status: 429 },
    );
  }

  let body: { passphrase?: unknown };
  try {
    body = (await request.json()) as { passphrase?: unknown };
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const passphrase = typeof body.passphrase === "string" ? body.passphrase : "";
  const who = whoSignedIn(passphrase);
  if (!who) {
    return NextResponse.json({ error: "That passphrase is not right." }, { status: 401 });
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, await issueSession(who), {
    httpOnly: true,
    sameSite: "lax",
    // Off in development only, because a secure cookie is dropped over plain http and
    // `npm run dev` serves plain http.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });

  return NextResponse.json({ who });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
