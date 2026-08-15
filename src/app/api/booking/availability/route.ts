import { NextResponse } from "next/server";
import { addDays, BEDS24_READY, getCalendar, isValidDate, today } from "@/lib/beds24";

// Node runtime, matching /api/contact. The Beds24 calls are plain fetches either way.
export const runtime = "nodejs";

/**
 * Per-night availability and rates for the booking calendar.
 *
 * The browser cannot call Beds24 directly -- that would put a write-scoped credential in
 * the bundle -- so this is the read side of the panel. It returns nights, not ranges, and
 * nothing else: no guest data passes through here, so there is nothing to rate limit
 * beyond the window cap below.
 *
 * Called either as `?days=365` from today, or with an explicit `?from=&to=`. The window
 * is capped at 400 days: Beds24 will happily return further out, but rates are only
 * loaded about eighteen months ahead and a calendar of unpriced nights is noise.
 */

const MAX_WINDOW_DAYS = 400;
const DEFAULT_WINDOW_DAYS = 180;

export async function GET(request: Request) {
  if (!BEDS24_READY) {
    return NextResponse.json({ error: "Booking is not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days"));
  const window =
    Number.isInteger(days) && days > 0 ? Math.min(days, MAX_WINDOW_DAYS) : DEFAULT_WINDOW_DAYS;

  // `from` is validated before anything is derived from it. addDays() on a malformed
  // date produces an Invalid Date, whose toISOString() throws -- so deriving `to` first
  // turned a bad query string into a 500 rather than the 400 it should be.
  const from = searchParams.get("from") ?? today();
  if (!isValidDate(from)) {
    return NextResponse.json({ error: "Bad date range." }, { status: 400 });
  }

  const to = searchParams.get("to") ?? addDays(from, window);
  if (!isValidDate(to) || to <= from) {
    return NextResponse.json({ error: "Bad date range." }, { status: 400 });
  }

  // Never quote the past, whatever was asked for: a calendar that offers yesterday is a
  // bug the guest gets to discover at the payment step.
  const start = from < today() ? today() : from;
  const end = to > addDays(start, MAX_WINDOW_DAYS) ? addDays(start, MAX_WINDOW_DAYS) : to;

  try {
    const nights = await getCalendar(start, end);
    return NextResponse.json({ from: start, to: end, nights });
  } catch (error) {
    // Beds24 being down is our problem to see, not the visitor's to decode. The panel
    // falls back to the enquiry call to action on any failure here.
    console.error("[booking/availability]", error);
    return NextResponse.json({ error: "Could not load availability." }, { status: 502 });
  }
}
