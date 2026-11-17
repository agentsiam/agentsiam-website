/**
 * Every Thai string this app has to supply itself, in one file, and nowhere else.
 *
 * The published document carries finished text for everything the team already reads in
 * LINE: the queue title, every job line, the contact block, the access block and the change
 * lines. That text is rendered by the `cleaning-schedule` skill, which owns Thai dates
 * because the day of week is the easiest thing in the whole system to get wrong and the
 * hardest for Paul to spot. **This app composes, formats and translates nothing.** It
 * positions what the document hands it.
 *
 * What is left is the handful of sentences that exist only because this is an app and not a
 * text message: a PIN prompt, a marker on a visit that moved since she last looked, a line
 * saying how old the schedule is, and the two or three things a phone has to say when
 * something is wrong.
 *
 * **Paul writes all of them.** He is a native speaker and every string the team reads is his
 * own or approved by him, so each one below is a placeholder in Latin script that cannot be
 * mistaken for finished copy. They are deliberately ugly on screen: a half-translated app
 * that looks finished is how a wrong string ships.
 *
 * Replacing one is a one-line edit here and nothing else. Nothing in this file is translated
 * into the other locales: the public site's three dictionaries are for guests and owners, and
 * this app has one audience reading one language per person, which the document states.
 */

/** What makes a placeholder visible, and what a check can grep for. */
export const PENDING_MARK = "[TH";

export type TeamStringKey = keyof typeof TEAM_STRINGS;

export const TEAM_STRINGS = {
  /**
   * The line under the title saying how old this schedule is.
   *
   * `{when}` is substituted with a date and time in digits, Bangkok time, so that no Thai
   * date is ever composed here. Paul's wording goes around it. It has to work when she is
   * offline looking at a saved copy, which is the case it exists for.
   */
  builtAt: "[TH schedule built at {when}]",

  /**
   * The marker on a visit that is new, or whose line has changed, since the last time she
   * opened the app. Short: it sits beside a job line, on a phone.
   *
   * It must not read as a correction of the change lines at the foot of her schedule. Those
   * say what changed since the last schedule was **posted**; this one says what changed
   * since **she** last looked. On a week she did not open the app those are different
   * answers and both are true.
   */
  changedSinceSeen: "[TH new or moved since you last looked]",

  /** The prompt above the PIN field on the codes screen. Says that the codes are behind it
   * and that Paul gave her the number in LINE. */
  pinPrompt: "[TH enter your PIN to see the door codes]",

  /** A wrong PIN. Says nothing about how many tries are left and nothing about whose PIN
   * it is. */
  pinWrong: "[TH that PIN is not right]",

  /** Too many wrong tries. Says that she has to wait, and that Paul can be asked in LINE.
   * Distinct from a wrong PIN, because the thing she should do next is different. */
  pinLocked: "[TH too many tries, wait a while or ask Paul in LINE]",

  /** No PIN has been set for her yet, so the codes screen cannot open at all. She cannot
   * fix this herself: it says to ask Paul. */
  pinMissing: "[TH no PIN set yet, ask Paul in LINE]",

  /**
   * The only thing a phone with no working access is ever told, and the whole of the
   * recovery flow: ask Paul for a new link in LINE.
   *
   * It is one string on purpose. A dead link, a link already used, a link opened on a
   * second phone and a device Paul has revoked all end here, and all four have the same
   * answer. Saying which of them happened would tell whoever is holding the phone something
   * about the others.
   */
  askPaul: "[TH this phone cannot open the schedule, ask Paul for a new link in LINE]",

  /** The button that finishes enrolment, on the link Paul sent her. One tap, after which
   * this phone is hers and the link is dead. */
  enrolOpen: "[TH open my schedule]",

  /** Nothing has been published for her yet, or what was published has expired. Not an
   * error she can act on, so it says to ask Paul. */
  noSchedule: "[TH no schedule yet, ask Paul in LINE]",

  /** Shown when the phone has no connection and she is reading a saved copy. The age of
   * that copy is the builtAt line above it. */
  offline: "[TH no connection, this is the saved copy]",
} as const;

/** Paul's wording with `{when}` filled in. The value is digits and punctuation, never a
 * month name or a day name: those belong to the skill. */
export function builtAtLine(when: string): string {
  return TEAM_STRINGS.builtAt.replace("{when}", when);
}

/** Whether any string here is still a placeholder. Used to put one honest warning on the
 * screens Paul tests on, rather than letting a placeholder pass for copy. */
export const TEAM_STRINGS_PENDING: boolean = Object.values(TEAM_STRINGS).some((value) =>
  value.includes(PENDING_MARK),
);
