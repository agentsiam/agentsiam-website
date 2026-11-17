import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/config";
import { ADMIN_COOKIE, readSession } from "@/lib/admin/session";
import { ADMIN_ROOT, ADMIN_SIGN_IN } from "@/lib/admin/routes";
import { CLEANING_COOKIE, readDeviceCookie } from "@/lib/cleaning/session";
import {
  CLEANING_CODES,
  CLEANING_ENROL,
  CLEANING_NO_ACCESS,
  CLEANING_ROOT,
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
// person's own published document, and shut to a phone with no enrolled device cookie.

const PREFIXED = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

/**
 * The subdomain the cleaning team's app is served on, when one is pointed at this project.
 *
 * Unset, which it is until Paul sets it, nothing below changes and the app answers on
 * /cleaning like any other path. Set, a request to that host is served from the /cleaning
 * tree with the prefix off the URL, so the team's phones see a bare path on their own
 * subdomain and never the marketing site's locale rewrite.
 *
 * Untested against a real subdomain: no preview deployment on this project can reach the
 * team, so this cannot be rehearsed anywhere but production. See the README section on this
 * app.
 */
const CLEANING_HOST = (process.env.CLEANING_HOST ?? "").trim().toLowerCase();

function onCleaningHost(request: NextRequest): boolean {
  if (!CLEANING_HOST) return false;
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  return host === CLEANING_HOST;
}

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
    // The codes are never written to a disk anywhere: not in a browser cache, not in a
    // proxy in between, and not by the service worker, which refuses this path for itself.
    // Set here rather than in next.config.ts because a header set there is overridden in
    // development, which is the one place this can be checked.
    if (pathname === CLEANING_CODES) {
      response.headers.set("Cache-Control", "no-store, must-revalidate");
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

  // On the team's own subdomain the /cleaning prefix comes off the URL and goes back on
  // internally. A path that already carries it is left alone, so a redirect built from
  // src/lib/cleaning/routes.ts works on the subdomain as well as on the main host.
  if (onCleaningHost(request)) {
    if (pathname === CLEANING_ROOT || pathname.startsWith(`${CLEANING_ROOT}/`)) {
      return cleaning(request, pathname);
    }
    const mapped = pathname === "/" ? CLEANING_ROOT : `${CLEANING_ROOT}${pathname}`;
    const gate = await cleaning(request, mapped);
    if (gate.status !== 200) return gate;
    const url = request.nextUrl.clone();
    url.pathname = mapped;
    return NextResponse.rewrite(url);
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
