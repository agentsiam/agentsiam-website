import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { checkPin } from "@/lib/cleaning/devices";
import { currentHolder } from "@/lib/cleaning/guard";
import {
  CLEANING_PIN_COOKIE,
  CLEANING_PIN_MAX_AGE,
  issuePinCookie,
} from "@/lib/cleaning/session";

export const runtime = "nodejs";

/**
 * Checks a PIN and, when it is right, says so for the next few minutes.
 *
 * The device cookie is checked here again rather than trusted from the edge, because the
 * edge reads a signature and revocation is a store lookup: a phone Paul has revoked still
 * carries a correctly signed cookie, and this is one of the places that notices.
 *
 * **The failure counter is in the shared store**, per person and per phone. The
 * per-instance limiter in src/lib/rate-limit.ts is one bucket per warm instance by its own
 * admission, so an attacker spread across cold starts gets as many tries as they like, and
 * that is the one thing a four-digit number in front of a door code cannot survive.
 * Counting per phone rather than per person means the phone doing the guessing is the one
 * that stops answering, and a stolen handset cannot lock its owner out of her own codes.
 *
 * The answer says which of three things happened, in one word, and nothing else: no tries
 * remaining, no PIN set, or wrong. The wording the team reads is her own copy, chosen on
 * the client from that word.
 */
export async function POST(request: Request) {
  const holder = await currentHolder();
  if (!holder) return NextResponse.json({ state: "no-device" }, { status: 401 });

  let pin = "";
  try {
    const body = (await request.json()) as { pin?: unknown };
    pin = typeof body.pin === "string" ? body.pin : "";
  } catch {
    return NextResponse.json({ state: "wrong" }, { status: 400 });
  }

  let state;
  try {
    state = await checkPin(holder.person, holder.device, pin);
  } catch {
    return NextResponse.json({ state: "wrong" }, { status: 503 });
  }

  if (state !== "ok") {
    return NextResponse.json({ state }, { status: state === "locked" ? 429 : 401 });
  }

  const store = await cookies();
  store.set(CLEANING_PIN_COOKIE, await issuePinCookie(holder.person, holder.device), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CLEANING_PIN_MAX_AGE,
  });

  return NextResponse.json({ state: "ok" });
}
