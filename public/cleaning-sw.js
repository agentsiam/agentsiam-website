/*
 * The service worker that makes the cleaning team's schedule open with no signal.
 *
 * Signal inside a Thai house is not a given, and a cleaner standing at a gate watching a
 * spinner is worse off than one holding a week-old LINE message. So the last schedule she
 * actually loaded is kept, and served when the network does not answer. The line at the top
 * of her screen says when that schedule was built, so a saved copy says how old it is.
 *
 * Served from the root rather than from inside /cleaning on purpose: a worker's maximum
 * scope is the directory it is served from, so here it can claim /cleaning itself. At
 * /cleaning/sw.js it could claim only /cleaning/, which would leave the schedule page,
 * which has no trailing slash, outside its own worker's scope.
 *
 * Three rules, and the first one is the important one:
 *
 *   never  /cleaning/codes, every /api/ path, and the enrolment link. The door codes are
 *          the one thing in this app worth stealing and they are never written to a disk on
 *          the phone. The API answers are state, not pages. The enrolment link is
 *          single-use and a cached copy of its answer would be a lie.
 *   page   /cleaning and anything under it: network first, and the saved copy when the
 *          network does not answer. Network first rather than cache first because a
 *          schedule that changed this morning matters more than a few hundred milliseconds.
 *   asset  Next's hashed build files and the icons: cache first. The hash in the name is
 *          what makes that safe.
 *
 * One more thing it does, which is not caching. When a navigation comes back having been
 * redirected to the "ask Paul" page, this phone has been revoked, so the saved schedule is
 * deleted. A revoked phone that is offline keeps what it already had, which no server can
 * prevent; the first time it has signal, the copy goes.
 */

const CACHE = "cleaning-v1";
const ROOT = "/cleaning";
const NO_ACCESS = "/cleaning/no-access";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name !== CACHE) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

function neverCached(url) {
  return (
    url.pathname === `${ROOT}/codes` ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith(`${ROOT}/enrol`)
  );
}

function isAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith(`${ROOT}/icon-`) ||
    url.pathname === `${ROOT}/manifest.webmanifest`
  );
}

async function page(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.redirected && new URL(response.url).pathname === NO_ACCESS) {
      await caches.delete(CACHE);
      return response;
    }
    if (response.ok && response.type === "basic") {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const saved = await cache.match(request, { ignoreSearch: true });
    if (saved) return saved;
    throw error;
  }
}

async function asset(request) {
  const cache = await caches.open(CACHE);
  const saved = await cache.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (neverCached(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(page(request));
    return;
  }
  if (isAsset(url)) {
    event.respondWith(asset(request));
  }
});
