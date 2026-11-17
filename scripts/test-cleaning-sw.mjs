/*
 * Drives public/cleaning-sw.js outside a browser.
 *
 *   npm run test:cleaning-sw
 *
 * **What it proves.** The worker's branching, which is where its risk is: what it refuses to
 * touch, what it saves, what it serves when fetch throws, and that a navigation coming back
 * redirected to the ask-Paul page wipes the cache. Seventeen cases, a line each, non-zero exit
 * on any failure. The door codes, the API and the enrolment link are passed through untouched
 * and never cached, and that is the case worth running before every change to this worker: a
 * door code written into a cache on a shared phone survives a revocation that the server
 * thinks it has carried out.
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
  clone() {
    return { ...this, clone: () => this.clone() };
  },
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

  const sandbox = {
    self,
    caches,
    URL,
    console,
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
  const sw = load();
  sw.setNetwork(async () => response("THE DOOR CODES"));
  const codes = await sw.request(request("/cleaning/codes", { mode: "navigate" }));
  const keys = await cachedKeys(sw);
  check(
    "the door codes are never touched",
    codes.responded === false && keys.length === 0,
    codes.responded ? "the worker answered it" : "passed straight through, nothing cached",
  );

  for (const path of ["/api/cleaning/pin", "/cleaning/enrol/abc123"]) {
    const out = await sw.request(request(path, { mode: "navigate" }));
    check(`${path} is never touched`, out.responded === false, out.responded ? "answered" : "passed through");
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
