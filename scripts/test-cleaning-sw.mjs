/*
 * Drives public/cleaning-sw.js outside a browser.
 *
 *   npm run test:cleaning-sw
 *
 * **What it proves.** The worker's branching, which is where its risk is: what it refuses to
 * touch, what it saves, what it serves when fetch throws, and that a navigation coming back
 * redirected to the ask-Paul page wipes the cache. Twenty-six cases, a line each, non-zero
 * exit on any failure.
 *
 * Six of them are the door codes, which this worker keeps as of 17/11/2026 and used to refuse
 * outright, and that reversal is what makes them the cases worth running before every change
 * to this file. A codes page is saved only when the app put a deadline on that response,
 * served with no network only while that deadline holds, deleted rather than served once it
 * has passed, and wiped with everything else the moment a phone is revoked. The failure they
 * exist to catch is a door code sitting in a cache that outlives a revocation the server
 * thinks it has carried out, or one read out at a gate a month after it was fetched.
 *
 * Two more are about the PIN gate, which is the other way this worker can do harm.
 * /cleaning answers with the PIN form to a phone that has not given it and with her schedule
 * to one that has, so a worker that saved both would replace the schedule she needs offline
 * with a form whose submit cannot reach the network. The app marks the gate with a header;
 * these cases are what proves the worker honours it.
 *
 * **What it does not prove.** That a browser registers the script, installs it, or serves the
 * saved copy after a real network failure, and nothing about the install prompt on either
 * iOS or Android. Those need a real phone, which on this project means production, and they
 * are the half of README.md's known gap that is still open. The fakes below carry only the
 * properties the worker reads, so a browser's own Request and Response semantics are not
 * under test either: a case passing here means the logic is right, not that the platform
 * agrees.
 *
 * Plain node, no dependency, nothing fetched and nothing written. By hand, like everything
 * else in scripts/.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

/** The worker under test. Resolved from this file, so the script runs from anywhere, and
 * overridable by argument for a copy of the worker somewhere else. */
const swPath =
  process.argv[2] ?? fileURLToPath(new URL("../public/cleaning-sw.js", import.meta.url));

/** Arbitrary. The worker only ever compares a URL against self.location.origin, which is
 * this same value, so the number is the repo's dev port for readability and nothing more. */
const ORIGIN = "http://localhost:3000";

/* ---------------------------------------------------------------- fakes -- */

const keyOf = (r) => (typeof r === "string" ? r : r.url);
const bare = (u) => u.split("?")[0];

class FakeCache {
  constructor() {
    this.store = new Map();
  }
  async put(request, response) {
    this.store.set(keyOf(request), response);
  }
  async match(request, options) {
    const k = keyOf(request);
    if (this.store.has(k)) return this.store.get(k);
    if (options?.ignoreSearch) {
      for (const [stored, response] of this.store) {
        if (bare(stored) === bare(k)) return response;
      }
    }
    return undefined;
  }
  async delete(request, options) {
    const k = keyOf(request);
    if (this.store.delete(k)) return true;
    if (options?.ignoreSearch) {
      for (const stored of [...this.store.keys()]) {
        if (bare(stored) === bare(k)) return this.store.delete(stored);
      }
    }
    return false;
  }
  async keys() {
    return [...this.store.keys()];
  }
}

function makeCaches() {
  const map = new Map();
  return {
    map,
    async open(name) {
      if (!map.has(name)) map.set(name, new FakeCache());
      return map.get(name);
    },
    async keys() {
      return [...map.keys()];
    },
    async delete(name) {
      return map.delete(name);
    },
  };
}

const response = (body, extra = {}) => ({
  body,
  ok: true,
  type: "basic",
  redirected: false,
  url: extra.url ?? `${ORIGIN}/cleaning`,
  ...extra,
  headers: {
    get: (name) => (extra.headers ?? {})[name.toLowerCase()] ?? null,
  },
  clone() {
    return { ...this, clone: () => this.clone() };
  },
});

/** The PIN gate, which the app marks with a header so this worker serves it and saves
 * nothing. Keys in the fixture are lowercase because the fake's get() lowercases what it is
 * asked for, the way a real Headers does. */
const gate = () => response("enter your PIN", { headers: { "x-cleaning-gate": "1" } });

/** The door codes as /api/cleaning/codes answers them. The deadline is the whole difference
 * between a copy the worker may keep and one it may only serve: pass 0 for the answer a
 * phone gets when no live PIN session is behind it.
 *
 * They stopped being a page on 17/11/2026, when the codes moved onto the schedule itself.
 * The rule did not change and neither did these tests; the path did, and with it the request
 * shape: this is a fetch from a page rather than a navigation to one. */
const CODES_PATH = "/api/cleaning/codes";
const codesOf = (slug) => `${CODES_PATH}?slug=${slug}`;
const codesResponse = (until, slug = "job-one", body = "THE DOOR CODES") =>
  response(body, {
    url: `${ORIGIN}${codesOf(slug)}`,
    headers: until ? { "x-cleaning-keep-until": String(until) } : {},
  });

const request = (path, extra = {}) => ({
  url: path.startsWith("http") ? path : `${ORIGIN}${path}`,
  method: "GET",
  mode: "no-cors",
  ...extra,
});

/* ----------------------------------------------------------------- load -- */

/** A fresh worker in a fresh sandbox, so no case inherits another's cache. */
function load() {
  const listeners = new Map();
  const counts = { skipWaiting: 0, claim: 0, fetches: 0 };
  const caches = makeCaches();
  let network = async () => {
    throw new Error("the harness did not set a network for this case");
  };

  const self = {
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    location: { origin: ORIGIN },
    skipWaiting: async () => {
      counts.skipWaiting += 1;
    },
    clients: {
      claim: async () => {
        counts.claim += 1;
      },
    },
  };

  // The worker reads Date.now() and nothing else off Date, so the fake is one function and
  // the harness can move it. Without that, a deadline passing could only be tested by
  // seeding the cache by hand, which would not exercise the path that put it there.
  const clock = { now: Date.now() };

  const sandbox = {
    self,
    caches,
    URL,
    console,
    Date: { now: () => clock.now },
    fetch: async (r) => {
      counts.fetches += 1;
      return network(r);
    },
  };
  vm.runInNewContext(readFileSync(swPath, "utf8"), sandbox, { filename: swPath });

  const fire = async (type, event) => {
    const handlers = listeners.get(type) ?? [];
    if (!handlers.length) throw new Error(`no ${type} listener registered`);
    for (const handler of handlers) handler(event);
  };

  return {
    caches,
    counts,
    setNetwork(fn) {
      network = fn;
    },
    /** Moves this worker's clock forward, in milliseconds. */
    advance(ms) {
      clock.now += ms;
    },
    async install() {
      const waits = [];
      await fire("install", { waitUntil: (p) => waits.push(p) });
      await Promise.all(waits);
    },
    async activate() {
      const waits = [];
      await fire("activate", { waitUntil: (p) => waits.push(p) });
      await Promise.all(waits);
    },
    /** Returns {responded: bool, value, error}. responded false means the worker passed the
     * request through to the network untouched, which is what "never cached" looks like. */
    async request(req) {
      let promise = null;
      await fire("fetch", { request: req, respondWith: (p) => (promise = p) });
      if (!promise) return { responded: false };
      try {
        return { responded: true, value: await promise };
      } catch (error) {
        return { responded: true, error: String(error.message ?? error) };
      }
    },
  };
}

/* ---------------------------------------------------------------- cases -- */

const results = [];
const check = (name, pass, detail) => results.push({ name, pass, detail });

async function cachedKeys(sw) {
  const cache = await sw.caches.open("cleaning-v1");
  return (await cache.keys()).map((k) => k.replace(ORIGIN, ""));
}

{
  const sw = load();
  await sw.install();
  check("install calls skipWaiting", sw.counts.skipWaiting === 1, `${sw.counts.skipWaiting} call(s)`);
}

{
  const sw = load();
  sw.caches.map.set("cleaning-v0", new FakeCache());
  sw.caches.map.set("cleaning-v1", new FakeCache());
  sw.caches.map.set("something-else", new FakeCache());
  await sw.activate();
  const left = await sw.caches.keys();
  check(
    "activate drops every cache but cleaning-v1",
    left.length === 1 && left[0] === "cleaning-v1",
    `left: ${left.join(", ") || "none"}`,
  );
  check("activate claims the open pages", sw.counts.claim === 1, `${sw.counts.claim} call(s)`);
}

{
  const sw = load();
  sw.setNetwork(async () => response("her schedule, 18 Nov"));
  const first = await sw.request(request("/cleaning", { mode: "navigate" }));
  const keys = await cachedKeys(sw);
  check(
    "a schedule that loads is saved",
    first.responded && first.value.body === "her schedule, 18 Nov" && keys.includes("/cleaning"),
    `cached: ${keys.join(", ") || "nothing"}`,
  );

  sw.setNetwork(async () => {
    throw new TypeError("Failed to fetch");
  });
  const offline = await sw.request(request("/cleaning", { mode: "navigate" }));
  check(
    "with no network the saved schedule is served",
    offline.responded && offline.value?.body === "her schedule, 18 Nov",
    offline.error ? `threw: ${offline.error}` : `served: ${offline.value?.body}`,
  );

  const withQuery = await sw.request(request("/cleaning?from=line", { mode: "navigate" }));
  check(
    "a query string still finds the saved copy",
    withQuery.responded && withQuery.value?.body === "her schedule, 18 Nov",
    withQuery.error ? `threw: ${withQuery.error}` : "served the saved copy",
  );
}

{
  const sw = load();
  sw.setNetwork(async () => gate());
  const first = await sw.request(request("/cleaning", { mode: "navigate" }));
  const keys = await cachedKeys(sw);
  check(
    "the PIN gate is served but never saved",
    first.responded && first.value?.body === "enter your PIN" && keys.length === 0,
    `cached: ${keys.join(", ") || "nothing"}`,
  );
}

{
  // The sequence that costs her a schedule if the header is not honoured: she loads it on
  // wifi, the PIN expires a month later and she opens the app once at home, then she is at
  // a house with no signal. The saved copy has to still be the schedule.
  const sw = load();
  sw.setNetwork(async () => response("her schedule, 18 Nov"));
  await sw.request(request("/cleaning", { mode: "navigate" }));
  sw.setNetwork(async () => gate());
  await sw.request(request("/cleaning", { mode: "navigate" }));
  sw.setNetwork(async () => {
    throw new TypeError("Failed to fetch");
  });
  const offline = await sw.request(request("/cleaning", { mode: "navigate" }));
  check(
    "a PIN gate does not overwrite the saved schedule",
    offline.responded && offline.value?.body === "her schedule, 18 Nov",
    offline.error ? `threw: ${offline.error}` : `served: ${offline.value?.body}`,
  );
}

{
  const sw = load();
  sw.setNetwork(async () => {
    throw new TypeError("Failed to fetch");
  });
  const cold = await sw.request(request("/cleaning", { mode: "navigate" }));
  check(
    "no network and nothing saved fails rather than inventing a page",
    cold.responded && !!cold.error,
    cold.error ? `threw: ${cold.error}` : `served: ${cold.value?.body}`,
  );
}

{
  // The reversal, and the one moment the app exists for: she is at a gate, there is no
  // signal, and the number for the lock has to be on the screen.
  const sw = load();
  sw.setNetwork(async () => codesResponse(Date.now() + 60_000));
  const live = await sw.request(request(codesOf("job-one")));
  const keys = await cachedKeys(sw);
  check(
    "a door code the app put a deadline on is saved",
    live.responded && live.value?.body === "THE DOOR CODES" && keys.includes(codesOf("job-one")),
    `cached: ${keys.join(", ") || "nothing"}`,
  );

  sw.setNetwork(async () => {
    throw new TypeError("Failed to fetch");
  });
  const offline = await sw.request(request(codesOf("job-one")));
  check(
    "with no network the saved door code is served",
    offline.responded && offline.value?.body === "THE DOOR CODES",
    offline.error ? `threw: ${offline.error}` : `served: ${offline.value?.body}`,
  );
}

{
  // No live PIN session behind it, so the proxy vouches for nothing and neither does the
  // worker. This is also what a codes page fetched by anything outside the proxy looks like.
  const sw = load();
  sw.setNetwork(async () => codesResponse(0));
  const bare = await sw.request(request(codesOf("job-one")));
  const keys = await cachedKeys(sw);
  check(
    "a door code the app did not vouch for is served and not saved",
    bare.responded && bare.value?.body === "THE DOOR CODES" && keys.length === 0,
    `cached: ${keys.join(", ") || "nothing"}`,
  );
}

{
  // Saved properly, then the deadline passes with the phone never online again. A code a
  // month old read out at a gate is worse than no code, so it is not served, and it does
  // not sit there either.
  const sw = load();
  sw.setNetwork(async () => codesResponse(Date.now() + 60_000));
  await sw.request(request(codesOf("job-one")));
  sw.advance(120_000);
  sw.setNetwork(async () => {
    throw new TypeError("Failed to fetch");
  });
  const stale = await sw.request(request(codesOf("job-one")));
  const keys = await cachedKeys(sw);
  check(
    "a saved door code past its deadline is neither served nor kept",
    stale.responded && !!stale.error && keys.length === 0,
    stale.error
      ? `threw: ${stale.error}, holding: ${keys.join(", ") || "nothing"}`
      : `served: ${stale.value?.body}`,
  );
}

{
  // Two houses in one day, which is an ordinary Tuesday now. The old codes page carried
  // every house and was matched ignoring the query string, so one saved copy answered every
  // link. Per job it is the opposite rule: the query string IS which job, so a saved copy
  // must never answer for another one. Handing her the wrong gate code is the failure this
  // test exists to prevent.
  // Only the first house's codes were ever fetched, and then the signal goes. Asking for
  // the second house must fail, not answer with the first house's number: a wrong gate code
  // read out at a real gate is the worst thing this worker could do.
  const sw = load();
  sw.setNetwork(async (req) => {
    const slug = new URL(req.url).searchParams.get("slug");
    return codesResponse(Date.now() + 60_000, slug, `CODES FOR ${slug}`);
  });
  await sw.request(request(codesOf("job-one")));
  sw.setNetwork(async () => {
    throw new TypeError("Failed to fetch");
  });
  const one = await sw.request(request(codesOf("job-one")));
  const two = await sw.request(request(codesOf("job-two")));
  check(
    "a saved door code never answers for another job",
    one.value?.body === "CODES FOR job-one" && !!two.error && two.value === undefined,
    `one: ${one.value?.body ?? one.error}, two: ${two.value?.body ?? two.error}`,
  );
}

{
  // The other half of what makes keeping them carryable. Revocation does not wait for a
  // deadline: the first navigation that comes back redirected takes the codes with it.
  const sw = load();
  sw.setNetwork(async () => codesResponse(Date.now() + 60_000));
  await sw.request(request(codesOf("job-one")));
  const held = await cachedKeys(sw);
  sw.setNetwork(async () =>
    response("ask Paul", { url: `${ORIGIN}/cleaning/no-access`, redirected: true }),
  );
  await sw.request(request("/cleaning", { mode: "navigate" }));
  const left = await sw.caches.keys();
  check(
    "a revoked phone loses the saved door code too",
    held.includes(codesOf("job-one")) && left.length === 0,
    `held ${held.join(", ") || "nothing"}, caches left: ${left.join(", ") || "none"}`,
  );
}

{
  const sw = load();
  sw.setNetwork(async () => response("should not be reached"));
  for (const path of ["/api/cleaning/pin", "/cleaning/enrol/abc123"]) {
    const out = await sw.request(request(path, { mode: "navigate" }));
    check(`${path} is never touched`, out.responded === false, out.responded ? "answered" : "passed through");
  }

  // And not even when the answer carries a deadline of its own. Nothing sets one on these
  // paths today, and a deadline must never become the way in to a path that is refused.
  sw.setNetwork(async () => codesResponse(Date.now() + 60_000));
  for (const path of ["/api/cleaning/pin", "/cleaning/enrol/abc123"]) {
    const out = await sw.request(request(path, { mode: "navigate" }));
    const keys = await cachedKeys(sw);
    check(
      `${path} is never touched, deadline or not`,
      out.responded === false && keys.length === 0,
      out.responded ? "answered" : "passed through, nothing cached",
    );
  }
}

{
  const sw = load();
  let served = 0;
  sw.setNetwork(async () => {
    served += 1;
    return response("build file", { url: `${ORIGIN}/_next/static/chunk.js` });
  });
  const first = await sw.request(request("/_next/static/chunk.js"));
  const second = await sw.request(request("/_next/static/chunk.js"));
  check(
    "a hashed build file is fetched once and then read from the cache",
    first.responded && second.responded && served === 1,
    `${served} network call(s) for two requests`,
  );

  const icon = await sw.request(request("/cleaning/icon-192.png"));
  check("the app icon is cached too", icon.responded === true, icon.responded ? "cached" : "passed through");
}

{
  const sw = load();
  sw.setNetwork(async () => response("her schedule"));
  await sw.request(request("/cleaning", { mode: "navigate" }));
  check("a schedule is saved before the phone is revoked", (await cachedKeys(sw)).includes("/cleaning"));

  sw.setNetwork(async () =>
    response("ask Paul", { redirected: true, url: `${ORIGIN}/cleaning/no-access` }),
  );
  const revoked = await sw.request(request("/cleaning", { mode: "navigate" }));
  const names = await sw.caches.keys();
  check(
    "a revoked phone loses the saved schedule",
    revoked.responded && revoked.value.body === "ask Paul" && !names.includes("cleaning-v1"),
    `caches left: ${names.join(", ") || "none"}`,
  );
}

{
  const sw = load();
  sw.setNetwork(async () => response("never asked for"));
  const post = await sw.request(request("/cleaning", { method: "POST", mode: "navigate" }));
  check("a POST is left alone", post.responded === false, post.responded ? "answered" : "passed through");

  const other = await sw.request(request("https://example.com/x.js"));
  check("another origin is left alone", other.responded === false, other.responded ? "answered" : "passed through");

  const api = await sw.request(request("/cleaning/seen", { mode: "cors" }));
  check(
    "a same-origin request that is neither a page nor an asset is left alone",
    api.responded === false,
    api.responded ? "answered" : "passed through",
  );
}

/* --------------------------------------------------------------- report -- */

const failed = results.filter((r) => !r.pass);
for (const r of results) {
  console.log(`${r.pass ? "pass" : "FAIL"}  ${r.name}${r.detail ? `  (${r.detail})` : ""}`);
}
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
