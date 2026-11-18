import { NextResponse } from "next/server";
import {
  CLEANING_LANG_COOKIE,
  CLEANING_LANG_MAX_AGE,
} from "@/lib/cleaning/session";
import { CLEANING_ROOT, CLEANING_SCHEDULE } from "@/lib/cleaning/routes";
import { asTeamLang } from "@/lib/cleaning/strings";

export const runtime = "nodejs";

/**
 * Sets which language this phone reads the app in, and sends her back to where she was.
 *
 * **The one route under /api/cleaning that does not check whose phone this is**, and the
 * reason is the enrolment screen. That screen answers without a device cookie, because it is
 * how a phone gets one, and it is the first thing a new cleaner ever sees; a switch she
 * cannot use until she is enrolled is a switch she cannot use on the one screen where she
 * might need it most. What this route reads is nothing, what it writes is one unsigned
 * display preference, and the worst a forged post can do is show somebody their own schedule
 * in the other language.
 *
 * A plain form post, so it works on a phone with JavaScript off or broken, the same
 * reasoning as the enrolment button. The language arrives as the value of whichever submit
 * button was pressed, which is why there is no hidden field and no client component.
 *
 * **Where she goes back to is the Referer, path only.** A form in the root layout is on every
 * screen and a server component cannot know which one it is rendering, so the browser tells
 * us. Anything that is not a path inside this app lands her on the schedule, which is the one
 * screen every other screen in here is reachable from.
 *
 * The answer carries a relative `Location` and never an absolute one, which is not a style
 * choice. `request.url` inside a route handler is not the address the phone is on: in
 * development it reads `localhost` while the browser is on `127.0.0.1`, which made the first
 * version of this file compare two origins that were the same screen, decide the Referer was
 * foreign, and send her to the schedule from whatever page she switched on. A relative
 * Location is resolved by the browser against the page it is already on, so nothing here has
 * to know the host. The Referer is checked against the `Host` header for the same reason:
 * that one is what the phone sent.
 */
export async function POST(request: Request) {
  let lang = null;
  try {
    const form = await request.formData();
    lang = asTeamLang(String(form.get("lang") ?? ""));
  } catch {
    lang = null;
  }

  const back = safePath(request.headers.get("referer"), request.headers.get("host"));
  const response = new NextResponse(null, { status: 303, headers: { Location: back } });

  // Nothing to set is not an error worth a screen: a post with no language, or a language
  // this app does not have, leaves the cookie as it was and returns her to the same page.
  if (lang) {
    response.cookies.set(CLEANING_LANG_COOKIE, lang, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      // The whole site, like the other two cleaning cookies, rather than /cleaning alone:
      // this route is under /api/cleaning and would not be sent a cookie scoped to the app's
      // own prefix. It guards nothing, so the extra reach costs nothing.
      path: "/",
      maxAge: CLEANING_LANG_MAX_AGE,
    });
  }

  return response;
}

/** The path she came from, if it is one of this app's own on this host, or the schedule.
 * Only ever a path: nothing from the Referer but its pathname is used, so the answer cannot
 * point off this site whatever the header says. */
function safePath(referer: string | null, host: string | null): string {
  if (!referer) return CLEANING_SCHEDULE;
  try {
    const from = new URL(referer);
    if (host && from.host !== host) return CLEANING_SCHEDULE;
    const inside =
      from.pathname === CLEANING_ROOT || from.pathname.startsWith(`${CLEANING_ROOT}/`);
    return inside ? from.pathname : CLEANING_SCHEDULE;
  } catch {
    return CLEANING_SCHEDULE;
  }
}
