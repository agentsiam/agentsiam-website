"use client";

import { useEffect, useState } from "react";
import { TEAM_STRINGS } from "@/lib/cleaning/strings";

/**
 * Says, when the phone has no connection, that what is on screen is the saved copy.
 *
 * The line above it already says when the schedule was built, which is how old the saved
 * copy is. This only answers the other half: whether she is looking at something the app
 * has just fetched or something it kept.
 *
 * Starts hidden and is shown only once the browser says it is offline, so a phone that
 * never goes offline never shows it.
 */
export function OfflineNotice() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <p className="mt-2 rounded-box bg-wash-red px-3 py-2 text-[15px] text-deep-red">
      {TEAM_STRINGS.offline}
    </p>
  );
}
