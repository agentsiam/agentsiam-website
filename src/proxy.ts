import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/config";

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

const PREFIXED = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
