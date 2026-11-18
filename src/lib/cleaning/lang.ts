import { cookies } from "next/headers";
import { CLEANING_LANG_COOKIE } from "./session";
import { DEFAULT_TEAM_LANG, asTeamLang, type TeamLang } from "./strings";

/**
 * Which language this phone reads the app in.
 *
 * Its own module rather than a function in src/lib/cleaning/guard.ts, because that file is
 * the access check and reaches the store, and the only thing this reads is one unsigned
 * cookie. The root layout asks for it on every render, including on the two screens that
 * answer without a device cookie at all.
 *
 * Node side only: it reaches for next/headers. The edge does not need it, because nothing
 * in src/proxy.ts turns on what language a screen is in.
 */
export async function teamLang(): Promise<TeamLang> {
  const store = await cookies();
  return asTeamLang(store.get(CLEANING_LANG_COOKIE)?.value) ?? DEFAULT_TEAM_LANG;
}
