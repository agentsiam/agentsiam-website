import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/config";
import { ADMIN_COOKIE, readSession } from "@/lib/admin/session";
import { ADMIN_ROOT, ADMIN_SIGN_IN } from "@/lib/admin/routes";
import {
  CLEANING_COOKIE,
  CLEANING_PIN_COOKIE,
  codesKeepUntil,
  readDeviceCookie,
  readPinCookie,
} from "@/lib/cleaning/session";
import {
  CLEANING_CODES,
  CLEANING_ENROL,
  CLEANING_GATE_HEADER,
  CLEANING_KEEP_HEADER,
  CLEANING_NO_ACCESS,
  CLEANING_ROOT,
  CLEANING_SCHEDULE,
} from "@/lib/cleaning/routes";

// `proxy` is Next 16's rename of `middleware`. Same file position, same API.
//
// Every page lives under src/app/[locale], but English has to stay on the bare path so the
// URLs already published (/how-it-works, /lotushouse) do not change. Two rules do that:
//
//   /how-it-works     -> rewritten to /en/how-it-works   (URL bar unchanged)
//   /en/how-it-works  -> redirected to /how-it-works     (one canonical URL, not two)
//   /th/how-it-works  -> passed through untouched
//
// Deliberately no Accept-Language redirect. A visitor who follows a link to an English
// page should land on that page; a browser language header is a weaker signal than the URL
// someone chose, and auto-redirecting breaks shared links and confuses crawlers.
//
// /admin is the exception to all of it. It is not localised, so it is answered before the
// locale rules and never rewritten, and it is the one part of the site that refuses a
// visitor who is not signed in.
//
// /cleaning is the second exception, for the same reasons. It is the cleaning team's
// schedule app: not localised, because the language is a roster fact carried by each
// person's own published document, and shut to a phone with no enrolled device cookie. It
// answers on this one host and at this one prefix. There is deliberately no subdomain for
// it; the README section on that app says why, and nothing here reads a host.

const PREFIXED = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

/**
 * The cleaning team's app: the first gate in front of three phones and a door code.
 *
 * It reads the cookie's signature and nothing else, which is all an edge check should do.
 * Every page and every /api/cleaning route then checks again for itself, and that second
 * check is the one that counts: revocation is a store lookup, the edge does not reach the
 * store, and a cookie Paul has revoked still carries a valid signature.
 *
 * Two paths answer without a cookie, and only two. The enrolment link, because it is how a
 * phone gets a cookie in the first place, and the page that says to ask Paul for a new
 * link, because that is the whole of the recovery flow.
 */
async function cleaning(request: NextRequest, pathname: string) {
  if (pathname === CLEANING_NO_ACCESS) return NextResponse.next();
  if (pathname === CLEANING_ENROL || pathname.startsWith(`${CLEANING_ENROL}/`)) {
    return NextResponse.next();
  }

  const session = await readDeviceCookie(request.cookies.get(CLEANING_COOKIE)?.value);
  if (session) {
    const response = NextResponse.next();

    // Both paths below turn on whether her PIN is live, so it is read once. On every other
    // path under /cleaning it is not read at all.
    const pin =
      pathname === CLEANING_SCHEDULE || pathname === CLEANING_CODES
        ? await readPinCookie(
            request.cookies.get(CLEANING_PIN_COOKIE)?.value,
            session.person,
            session.device,
          )
        : null;

    if (pathname === CLEANING_CODES) {
      // Still no-store, and that is not the contradiction it looks like next to the header
      // below. No cache we cannot reach may hold a door code: not the browser's own, not a
      // proxy in between. The service worker's is the one exception because it is ours, it
      // takes a deadline, and a revoked phone's copy is wiped on its next navigation. Set
      // here rather than in next.config.ts because a header set there is overridden in
      // development, which is the one place this can be checked.
      response.headers.set("Cache-Control", "no-store, must-revalidate");
      // What lets her read the code at a gate with no signal, which is the one moment this
      // app exists for. Only with a live PIN session behind it, and only until the deadline
      // in src/lib/cleaning/session.ts, which is the shorter of that session and seven
      // days. Without this header the worker serves the page and writes nothing down.
      if (pin) response.headers.set(CLEANING_KEEP_HEADER, String(codesKeepUntil(pin.expires)));
    }

    // The schedule URL answers with the PIN gate to a phone that has not given it, and the
    // service worker saves every schedule that loads. Marked so the worker can tell the
    // two apart, because one save of the gate would overwrite the saved schedule she needs
    // when the house has no signal. A hint about storage, never the gate itself: the gate
    // is the pinGiven check inside the page, which also knows about revocation.
    if (pathname === CLEANING_SCHEDULE && !pin) {
      response.headers.set(CLEANING_GATE_HEADER, "1");
    }

    return response;
  }

  // No "next" parameter and no sign-in form to carry it to. A phone with no working cookie
  // has exactly one thing to do, which is ask Paul in LINE for a new link.
  const url = request.nextUrl.clone();
  url.pathname = CLEANING_NO_ACCESS;
  url.search = "";
  return NextResponse.redirect(url);
}

/**
 * The admin's first gate. It reads the cookie and nothing else, which is all an edge check
 * should do, so every admin page and every /api/admin route verifies the session again for
 * itself. This one exists so a signed-out visitor never reaches a page at all, and so the
 * locale rewrite below never touches /admin: without this branch, /admin would be rewritten
 * to /en/admin, which nothing serves.
 */
async function admin(request: NextRequest, pathname: string) {
  if (pathname === ADMIN_SIGN_IN) return NextResponse.next();

  const session = await readSession(request.cookies.get(ADMIN_COOKIE)?.value);
  if (session) return NextResponse.next();

  // Sent back to where they were going, once they are in. Nothing else is carried: the
  // original query string could hold anything, and the sign-in page only honours a path
  // inside /admin anyway.
  const url = request.nextUrl.clone();
  url.pathname = ADMIN_SIGN_IN;
  url.search = "";
  if (pathname !== ADMIN_ROOT) url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === ADMIN_ROOT || pathname.startsWith(`${ADMIN_ROOT}/`)) {
    return admin(request, pathname);
  }

  if (pathname === CLEANING_ROOT || pathname.startsWith(`${CLEANING_ROOT}/`)) {
    return cleaning(request, pathname);
  }

  // /en/... is the internal shape, never the public one.
  if (pathname === `/${DEFAULT_LOCALE}` || pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(`/${DEFAULT_LOCALE}`.length) || "/";
    return NextResponse.redirect(url, 308);
  }

  if (PREFIXED.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`))) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Everything except the API, Next's own assets, and files in public/ (anything with a
  // dot in the last segment). Without this the rewrite would mangle asset URLs.
  //
  // `opengraph-image` is listed explicitly because it is the one metadata route with no
  // dot in it: robots.txt, sitemap.xml and favicon.ico are caught by the dot rule, but
  // /opengraph-image was being rewritten to /en/opengraph-image, which nothing serves.
  // That 404'd the og:image and twitter:image on every page in every language -- every
  // share card on the site was broken, silently, because nothing on the site links to it.
  matcher: ["/((?!api|_next/static|_next/image|opengraph-image|.*\\..*).*)"],
};
