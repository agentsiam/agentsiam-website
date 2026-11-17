"use client";

import { useEffect, useState } from "react";
import {
  CLEANING_CODES,
  CLEANING_KEEP_HEADER,
  CLEANING_ROOT,
  CLEANING_SCHEDULE,
  CLEANING_SERVICE_WORKER,
} from "@/lib/cleaning/routes";

/**
 * What the phone says about its own offline copy.
 *
 * The app's whole offline promise rests on three things happening on a real phone: the
 * worker registers, it takes control of the page, and the schedule it fetched gets written
 * down. Every one of those is invisible from here. The registration is deliberately quiet,
 * src/components/cleaning/service-worker.tsx swallows its error so a browser that refuses a
 * worker still gets a schedule, and a phone has no console to read.
 *
 * So on 17/11/2026 the first airplane-mode test on a real phone failed and nothing on
 * either side could say which of the three it was. This screen is the answer to that: the
 * phone reads its own worker and its own cache and prints what it finds.
 *
 * **Everything here is read, nothing is changed**, with one exception that changes nothing
 * either: it calls register() again and prints what that call says, because that is the only
 * way to see the error the app throws away. Registering a worker that is already registered
 * for the same scope resolves to the same registration.
 *
 * Not her screen, so it is in English and says so plainly. Nothing on it is a secret: a
 * cache holds the pages this phone already fetched, and reading one back is what the phone
 * does for her at a gate anyway.
 */

/**
 * The cache public/cleaning-sw.js opens.
 *
 * A literal here for the same reason that file carries /cleaning and both of the header
 * names as literals: a static file in public/ cannot be imported from. Changing one means
 * changing both.
 */
const CACHE = "cleaning-v1";

type Row = { label: string; value: string; bad?: boolean };

function describe(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

/** The path and query of a cached request, which is the part worth reading. */
function pathOf(url: string): string {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

export function OfflineCheck({ person }: { person: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      const found: Row[] = [];
      const say = (label: string, value: string, bad?: boolean) => {
        found.push({ label, value, bad });
      };

      say("person", person);
      say("online now", navigator.onLine ? "yes" : "no");
      say("secure context", window.isSecureContext ? "yes" : "no", !window.isSecureContext);
      say(
        "opened from home screen",
        window.matchMedia("(display-mode: standalone)").matches ? "yes" : "no",
      );

      if (!("serviceWorker" in navigator)) {
        // The answer on its own: an in-app browser, or a private window, and no amount of
        // code in this repository changes it.
        say("service worker", "NOT SUPPORTED by this browser", true);
      } else {
        const controller = navigator.serviceWorker.controller;
        say("worker controls this page", controller ? "yes" : "NO", !controller);
        if (controller) say("worker script", pathOf(controller.scriptURL));

        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          say("registrations", String(registrations.length), registrations.length === 0);
          for (const registration of registrations) {
            const worker =
              registration.active ?? registration.waiting ?? registration.installing;
            say(
              "registration",
              `${pathOf(registration.scope)} ${worker ? worker.state : "no worker"}`,
            );
          }
        } catch (error) {
          say("registrations", describe(error), true);
        }

        try {
          const registration = await navigator.serviceWorker.register(CLEANING_SERVICE_WORKER, {
            scope: CLEANING_ROOT,
          });
          say("register() scope", pathOf(registration.scope));
        } catch (error) {
          say("register() FAILED", describe(error), true);
        }
      }

      if (!("caches" in window)) {
        say("cache storage", "NOT SUPPORTED by this browser", true);
      } else {
        try {
          const names = await caches.keys();
          say("caches", names.length ? names.join(", ") : "none", !names.includes(CACHE));

          if (names.includes(CACHE)) {
            const cache = await caches.open(CACHE);
            const paths = (await cache.keys()).map((request) => pathOf(request.url));
            const pages = paths.filter((path) => !path.startsWith("/_next/"));
            const build = paths.filter((path) => path.startsWith("/_next/"));

            say("saved pages", String(pages.length), pages.length === 0);
            for (const path of pages) say("saved", path);
            say("saved build files", String(build.length), build.length === 0);

            // The two that matter, matched exactly the way the worker matches them when the
            // network does not answer, so a yes here is a yes at a gate.
            const schedule = await cache.match(CLEANING_SCHEDULE, { ignoreSearch: true });
            say("schedule saved", schedule ? "yes" : "NO", !schedule);

            const codes = await cache.match(CLEANING_CODES, { ignoreSearch: true });
            say("codes saved", codes ? "yes" : "NO", !codes);
            if (codes) {
              const until = Number(codes.headers.get(CLEANING_KEEP_HEADER));
              const live = Number.isFinite(until) && until > Date.now();
              say(
                "codes kept until",
                until ? `${until} ${live ? "(still allowed)" : "(expired)"}` : "no deadline",
                !live,
              );
            }
          }
        } catch (error) {
          say("cache storage", describe(error), true);
        }
      }

      if (alive) setRows(found);
    })();

    return () => {
      alive = false;
    };
  }, [person]);

  return (
    <section className="mt-6">
      <h1 className="text-[19px] font-semibold leading-7 text-text">Offline check</h1>
      <p className="mt-1 text-[14px] leading-6 text-muted">
        What this phone says about its own saved copy. Nothing here is shown to the team.
      </p>

      <div
        className="mt-5 rounded-panel border border-border bg-bg p-3 text-[13px] leading-6"
        style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
      >
        {rows === null ? (
          <p className="text-muted">reading...</p>
        ) : (
          <dl className="divide-y divide-hairline">
            {rows.map((row, index) => (
              <div key={index} className="flex gap-3 py-1.5">
                <dt className="w-[46%] shrink-0 break-words text-muted">{row.label}</dt>
                <dd
                  className={`min-w-0 flex-1 break-words ${
                    row.bad ? "font-semibold text-deep-red" : "text-text"
                  }`}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Last, and the one line that identifies the browser itself. An in-app browser, LINE's
          among them, says so here and explains a refused worker on its own. */}
      <p
        className="mt-4 break-words text-[11px] leading-5 text-muted"
        style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
      >
        {typeof navigator === "undefined" ? "" : navigator.userAgent}
      </p>
    </section>
  );
}
