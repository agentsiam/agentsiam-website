"use client";

import { useEffect } from "react";
import { CLEANING_SERVICE_WORKER, CLEANING_ROOT } from "@/lib/cleaning/routes";

/**
 * Registers the worker that makes the schedule open with no signal.
 *
 * Signal inside a Thai house is not a given, and a cleaner standing at a gate with a
 * spinner is worse off than one holding a week-old LINE message. The worker keeps the last
 * schedule she actually loaded and serves it when the network does not answer.
 *
 * The worker file is served from the root rather than from inside /cleaning: a worker's
 * maximum scope is the directory it is served from, so at the root it can claim /cleaning
 * itself, and at /cleaning/sw.js it could only claim /cleaning/ and would leave the
 * schedule page, which has no trailing slash, outside its own scope.
 *
 * Registration is deliberately quiet. A phone that refuses a worker, which is any browser
 * in a private window, still gets a schedule over the network; it just does not get one
 * offline. Nothing on screen depends on this succeeding.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register(CLEANING_SERVICE_WORKER, { scope: CLEANING_ROOT })
      .catch(() => {
        /* No worker, no offline copy, everything else works. */
      });
  }, []);
  return null;
}
