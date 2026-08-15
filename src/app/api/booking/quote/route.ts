import { NextResponse } from "next/server";
import { BEDS24_READY, getQuote, isValidDate, nightsBetween, today } from "@/lib/beds24";
import { LOTUS_HOUSE } from "@/lib/property";

export const runtime = "nodejs";

/**
 * What a specific stay actually costs, straight from Beds24.
 *
 * Separate from /availability on purpose. The calendar shows nightly rates, which are a
 * guide; this is the number the guest is quoted, and the same number that reaches the
 * booking request. The panel never adds nights up itself -- length-of-stay pricing and
 * offer rules live in Beds24 and would be reimplemented wrong here.
 */

const MAX_NIGHTS = 365;

export async function GET(request: Request) {
  if (!BEDS24_READY) {
    return NextResponse.json({ error: "Booking is not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const arrival = searchParams.get("arrival") ?? "";
  const departure = searchParams.get("departure") ?? "";
  const adults = Number(searchParams.get("adults") ?? "2");
  const children = Number(searchParams.get("children") ?? "0");

  if (!isValidDate(arrival) || !isValidDate(departure) || departure <= arrival) {
    return NextResponse.json({ error: "Bad dates." }, { status: 400 });
  }
  if (arrival < today()) {
    return NextResponse.json({ error: "That arrival date has passed." }, { status: 400 });
  }
  if (nightsBetween(arrival, departure) > MAX_NIGHTS) {
    return NextResponse.json({ error: "That stay is too long to quote." }, { status: 400 });
  }
  if (!Number.isInteger(adults) || adults < 1 || adults > LOTUS_HOUSE.maxGuests) {
    return NextResponse.json({ error: "Bad guest count." }, { status: 400 });
  }
  if (!Number.isInteger(children) || children < 0 || adults + children > LOTUS_HOUSE.maxGuests) {
    return NextResponse.json({ error: "Bad guest count." }, { status: 400 });
  }

  try {
    const quote = await getQuote(arrival, departure, adults, children);
    return NextResponse.json({ ...quote, currency: LOTUS_HOUSE.currency });
  } catch (error) {
    console.error("[booking/quote]", error);
    return NextResponse.json({ error: "Could not price those dates." }, { status: 502 });
  }
}
