import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/config";
import { ADMIN_COOKIE, readSession } from "@/lib/admin/session";
import { ADMIN_ROOT, ADMIN_SIGN_IN } from "@/lib/admin/routes";

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

const PREFIXED = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

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
