"use client";

import { useEffect } from "react";
import { CLEANING_API_SEEN } from "@/lib/cleaning/routes";

/**
 * Tells the server what she was just shown, once the screen is on her phone.
 *
 * Recorded from here and not during the render, for two reasons. A page that was prepared
 * and never seen should not count as having been looked at. And a phone with no signal
 * cannot record anything, which is the behaviour we want: her markers survive until the
 * next time she opens the app with a connection, rather than being cleared by a render she
 * read in the dark.
 *
 * Fire and forget. Nothing on screen waits for it and nothing on screen reports it
 * failing: the only cost of a lost write is that a marker she has now read stays up until
 * the next open.
 */
export function SeenRecorder({ stamp }: { stamp: string }) {
  useEffect(() => {
    const controller = new AbortController();
    fetch(CLEANING_API_SEEN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stamp }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      /* Offline, or the tab closed. The marker stays up, which is the safe failure. */
    });
    return () => controller.abort();
  }, [stamp]);
  return null;
}
