/*
 * The service worker that makes the cleaning team's schedule and door codes open with no
 * signal.
 *
 * Signal inside a Thai house is not a given, and a cleaner standing at a gate watching a
 * spinner is worse off than one holding a week-old LINE message. So the last schedule she
 * actually loaded is kept, and served when the network does not answer. The line at the top
 * of her screen says when that schedule was built, so a saved copy says how old it is.
 *
 * The door codes are kept too, which reverses what this file used to call its firmest rule.
 * Paul's decision, 17/11/2026: the one moment the app exists for is a woman at a gate
 * needing the number for the lock, and that gate is exactly where the signal is not. Giving
 * her the dates offline and not the code sent her back to LINE, which is the thing this app
 * was built to replace. What makes it carryable is that the copy is not unconditional: it
 * exists only because the app said so on that response, it dies on a deadline the app set,
 * and a revocation wipes it. Those three things are the difference between a cache we can
 * reach and one we cannot, and they are why the page still answers no-store to everything
 * that is not this worker.
 *
 * Served from the root rather than from inside /cleaning on purpose: a worker's maximum
 * scope is the directory it is served from, so here it can claim /cleaning itself. At
 * /cleaning/sw.js it could claim only /cleaning/, which would leave the schedule page,
 * which has no trailing slash, outside its own worker's scope.
 *
 * Four rules:
 *
 *   never  every /api/ path and the enrolment link. The API answers are state, not pages.
 *          The enrolment link is single-use and a cached copy of its answer would be a lie.
 *          Neither is ever touched, whatever either one answers.
 *   codes  /api/cleaning/codes, the one path under /api/ that is kept at all: served
 *          always, and kept only when that answer carries a deadline from the app, until
 *          that deadline and no longer. One that arrives without a deadline was not
 *          answered to a live PIN session, so nothing is written down. On an offline read a
 *          copy past its deadline is deleted and the read fails, rather than reading out a
 *          code from yesterday. Matched exactly: the query string is which job.
 *   page   /cleaning and anything under it: network first, and the saved copy when the
 *          network does not answer. Network first rather than cache first because a
 *          schedule that changed this morning matters more than a few hundred milliseconds.
 *          One exception, and it is not about freshness: a page carrying the gate header is
 *          served and never saved, because /cleaning answers with the PIN form to a phone
 *          that has not given it, and saving that would overwrite the schedule she needs
 *          when the house has no signal.
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

/**
 * The one path under /api/ this worker is allowed to keep.
 *
 * It used to be a page, /cleaning/codes, and the codes used to be rendered into it. Since
 * 17/11/2026 they are data on the schedule itself, fetched rather than rendered, because the
 * page they appear on is one this worker saves **without** a deadline so she can read her
 * dates at a house with no signal. A door code in that copy would still be there next week.
 * So the page holds no code, this answer does, and this answer carries its own deadline.
 *
 * Kept exactly, query string included, never ignoreSearch: the slug in it names the job, and
 * two houses in one day would otherwise share one saved copy and hand her the wrong number.
 */
const CODES = "/api/cleaning/codes";

/**
 * The header the app sets on the PIN gate, which is the one page under /cleaning that is
 * served and never saved.
 *
 * /cleaning is one URL serving two documents: the PIN form to a phone that has not given
 * it, her schedule to one that has. A cache is keyed on the URL alone, so without this,
 * one load of the form would replace the saved schedule, and the next time she stood at a
 * gate with no signal the phone would show her a form whose submit cannot reach the
 * network.
 *
 * The same string is CLEANING_GATE_HEADER in src/lib/cleaning/routes.ts, which sets it in
 * src/proxy.ts and carries the full reasoning. Duplicated as a literal here because a
 * static file in public/ cannot import from src/, which is also why ROOT above repeats
 * CLEANING_ROOT. Changing one means changing both.
 */
const GATE_HEADER = "X-Cleaning-Gate";

/**
 * The header carrying the moment a saved door code page stops being allowed, in epoch
 * milliseconds.
 *
 * A deadline and never a flag, because this phone may have been offline for days and a flag
 * would mean "keep it forever". The app sets it only on a codes page with a live PIN
 * session behind it, and sets it to the shorter of what is left of that session and seven
 * days, so a phone lost and never online again holds the codes for a week at the outside
 * rather than for the month the session runs.
 *
 * The same string is CLEANING_KEEP_HEADER in src/lib/cleaning/routes.ts, which carries the
 * full reasoning, and the window itself is in src/lib/cleaning/session.ts. Duplicated as a
 * literal here for the same reason GATE_HEADER and ROOT are. Changing one means changing
 * both.
 */
const KEEP_HEADER = "X-Cleaning-Keep-Until";

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
  if (url.pathname === CODES) return false;
  return url.pathname.startsWith("/api/") || url.pathname.startsWith(`${ROOT}/enrol`);
}

/** The deadline a response carries, or 0 for one that carries none. A missing header, an
 * empty one and anything that is not a number are all 0, which means "do not keep this". */
function keptUntil(response) {
  const until = Number(response.headers.get(KEEP_HEADER));
  return Number.isFinite(until) ? until : 0;
}

/**
 * Whether this answer may be written down.
 *
 * Nothing about whether it may be served: everything that arrives is served, and the only
 * question here is what is kept. The two things that are not kept are the PIN gate, because
 * saving it would overwrite the schedule she needs offline, and a door code page the app
 * did not put a deadline on.
 */
function mayKeep(url, response) {
  if (!response.ok || response.type !== "basic") return false;
  if (response.headers.get(GATE_HEADER)) return false;
  if (url.pathname === CODES) return keptUntil(response) > Date.now();
  return true;
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
  const url = new URL(request.url);
  try {
    const response = await fetch(request);
    if (response.redirected && new URL(response.url).pathname === NO_ACCESS) {
      await caches.delete(CACHE);
      return response;
    }
    if (mayKeep(url, response)) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const saved = await cache.match(request, { ignoreSearch: true });
    if (!saved) throw error;
    // A copy past its deadline is deleted rather than served, so a door code a month old is
    // never read out at a gate. Deleted with the same ignoreSearch the match used, or a
    // copy saved under a query string would keep being found and never cleared.
    const until = keptUntil(saved);
    if (until && until <= Date.now()) {
      await cache.delete(request, { ignoreSearch: true });
      throw error;
    }
    return saved;
  }
}

/**
 * The door codes: served from the network, and from the saved copy only while the day lasts.
 *
 * The same rule the codes page carried, moved to the answer that replaced it. Matched
 * exactly rather than ignoring the query string, because the query string is which job.
 */
async function codes(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (mayKeep(new URL(request.url), response)) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const saved = await cache.match(request);
    if (!saved) throw error;
    const until = keptUntil(saved);
    if (until && until <= Date.now()) {
      await cache.delete(request);
      throw error;
    }
    return saved;
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
  if (url.pathname === CODES) {
    event.respondWith(codes(request));
    return;
  }
  if (isAsset(url)) {
    event.respondWith(asset(request));
  }
});
