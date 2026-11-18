import { NextResponse } from "next/server";
import { currentSession } from "@/lib/admin/guard";
import { storePhoto } from "@/lib/cleaning/photos";

export const runtime = "nodejs";

/**
 * Paul's proof that she has been paid.
 *
 * The same store and the same month-long life as her photographs, written from the admin
 * session rather than from a phone. Separate from her route because the thing it checks is
 * different: there is no device, no PIN and no roster key here, only whether whoever is
 * asking is signed in to the admin.
 */
export async function POST(request: Request) {
  if (!(await currentSession())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const stored = await storePhoto(await request.blob());
  if (!stored.ok) {
    const status = stored.reason === "unconfigured" || stored.reason === "failed" ? 503 : 400;
    return NextResponse.json({ error: `The photo was not stored: ${stored.reason}.` }, { status });
  }
  return NextResponse.json({ ok: true, path: stored.path });
}
