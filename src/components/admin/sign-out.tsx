"use client";

import { ADMIN_SIGN_IN } from "@/lib/admin/routes";

/** Clears the cookie, then a full page load back to sign-in so nothing of the session is
 * left rendered on screen. */
export function SignOut() {
  return (
    <button
      type="button"
      className="text-primary hover:underline"
      onClick={async () => {
        await fetch("/api/admin/session", { method: "DELETE" });
        window.location.assign(ADMIN_SIGN_IN);
      }}
    >
      Sign out
    </button>
  );
}
