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
 * **EVERY THAI SENTENCE BELOW IS A DRAFT I WROTE AND NOT A NATIVE SPEAKER'S.** Paul shipped
 * them on his instruction of 17/11/2026, knowing exactly that: the screens had been rendering
 * nothing at all, because an unwritten string takes its element off the page, and three
 * people were being shown blank panels while seventeen sentences waited to be written from
 * scratch. Shipping a draft he can correct in place beat shipping silence.
 *
 * So treat none of this as approved copy. A sentence here is wrong until he has read it, the
 * register may be off, and the correction sheet with every slot and its draft is
 * `as-work/2026-11-16-cleaning-app-scope/thai-strings-to-write.txt` in the document store.
 * Correcting one is a one-line edit in this file and nothing else. **Anything new added here
 * still starts as a `[TH ...]` placeholder**, which `written()` below renders as nothing, so
 * a slot nobody has words for cannot ship English by accident.
 *
 * The seven calendar headings are a narrower case and are marked where they sit: those are
 * the conventional abbreviations, documented in several places rather than invented here.
 *
 * Nothing in this file is translated into the other locales: the public site's three dictionaries are for guests and owners, and
 * this app has one audience reading one language per person, which the document states.
 */

/** What marks a slot nobody has written yet. `written()` at the foot of this file renders
 * anything carrying it as nothing, and it is what a check greps for. */
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
  builtAt: "อัปเดต {when}",

  /**
   * The marker on a visit that is new, or whose line has changed, since the last time she
   * opened the app. Short: it sits beside a job line, on a phone.
   *
   * It must not read as a correction of the change lines at the foot of her schedule. Those
   * say what changed since the last schedule was **posted**; this one says what changed
   * since **she** last looked. On a week she did not open the app those are different
   * answers and both are true.
   */
  changedSinceSeen: "มีการเปลี่ยนแปลง",

  /**
   * The prompt above the PIN field, which is now the front door of the whole app rather
   * than a second gate in front of the codes.
   *
   * So it says to enter the PIN, and that Paul gave her the number in LINE, and it does not
   * mention the codes: after this one screen she has her schedule and her codes both, and a
   * prompt naming only the codes would be telling her the wrong thing about what she is
   * unlocking.
   */
  pinPrompt: "ใส่รหัส PIN ที่พอลส่งให้ในไลน์",

  /** A wrong PIN. Says nothing about how many tries are left and nothing about whose PIN
   * it is. */
  pinWrong: "รหัสไม่ถูกต้อง",

  /** Too many wrong tries. Says that she has to wait, and that Paul can be asked in LINE.
   * Distinct from a wrong PIN, because the thing she should do next is different. */
  pinLocked: "ใส่ผิดหลายครั้ง รอสักครู่ หรือถามพอลในไลน์",

  /** No PIN has been set for her yet, so the codes screen cannot open at all. She cannot
   * fix this herself: it says to ask Paul. */
  pinMissing: "ยังไม่ได้ตั้งรหัส PIN ถามพอลในไลน์",

  /**
   * The only thing a phone with no working access is ever told, and the whole of the
   * recovery flow: ask Paul for a new link in LINE.
   *
   * It is one string on purpose. A dead link, a link already used, a link opened on a
   * second phone and a device Paul has revoked all end here, and all four have the same
   * answer. Saying which of them happened would tell whoever is holding the phone something
   * about the others.
   */
  askPaul: "โทรศัพท์เครื่องนี้เปิดตารางงานไม่ได้ ขอลิงก์ใหม่จากพอลในไลน์",

  /** The button that finishes enrolment, on the link Paul sent her. One tap, after which
   * this phone is hers and the link is dead. */
  enrolOpen: "เปิดตารางงานของฉัน",

  /** Nothing has been published for her yet, or what was published has expired. Not an
   * error she can act on, so it says to ask Paul. */
  noSchedule: "ยังไม่มีตารางงาน ถามพอลในไลน์",

  /** Shown when the phone has no connection and she is reading a saved copy. The age of
   * that copy is the builtAt line above it. */
  offline: "ไม่มีสัญญาณ นี่คือข้อมูลที่บันทึกไว้",

  /** Above the address on a job, which is a line of text with a pin beside it and nothing
   * saying that tapping it opens a map. */
  jobAddressHeading: "ที่อยู่",

  /** Above the people on a job. Their names and numbers are on the screen with a phone
   * beside them and nothing saying who they are to her. */
  jobPeopleHeading: "ทำงานกับ",

  /** Under her name on the enrolment link Paul sends in LINE, which otherwise shows a name
   * and a button and no account of what pressing it does. The link works once and binds this
   * phone, which is the part she cannot undo and is not told. */
  enrolHelp: "ลิงก์นี้ใช้ได้ครั้งเดียว และใช้ได้เฉพาะโทรศัพท์เครื่องนี้",

  /** The control that opens the days already behind her. It carries a count and a chevron
   * and no word for what is behind it. */
  pastJobs: "งานที่ผ่านมา",

  /**
   * What kind of clean this is, in words, under its own heading.
   *
   * The document has carried `type` since the first run and the app drew it as a figure and
   * nothing else. Paul, 17/11/2026: a job should say whether it is a turnover for a new
   * check-in or a clean during somebody's stay. These are the two values that field can
   * hold, so these are the two sentences; a third value would render no sentence rather
   * than a guessed one.
   *
   * Her job line already carries the occupied marker on a mid-stay. This is the same fact
   * said plainly, which is the difference between a marker she has learned and a sentence
   * she can read the first time.
   */
  jobDetailsHeading: "รายละเอียดงาน",
  jobTurnover: "แขกเช็คเอาท์ แล้วมีแขกใหม่เช็คอิน",
  jobMidstay: "แขกยังพักอยู่ ทำความสะอาดระหว่างที่แขกพัก",

  /** Above anything true of this one clean: a cot, an extra bed, something to prepare. The
   * text under it is the skill's, from the payload, and is never written here. */
  jobRequestsHeading: "คำขอพิเศษ",

  /**
   * The conversation about one clean, and the two words its box needs.
   *
   * The first place in this app where somebody on the team types something. The heading is
   * what the section is; the placeholder sits in an empty box; the button sends it; the
   * last one is what a phone says when the send did not land, which offline is the ordinary
   * case rather than the exception.
   */
  commentsHeading: "ข้อความ",
  commentPlaceholder: "เขียนข้อความ",
  commentSend: "ส่ง",
  commentFailed: "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง",
} as const;

/** Paul's wording with `{when}` filled in, or nothing while the wording is unwritten. The
 * value is digits and punctuation, never a month name or a day name: those belong to the
 * skill. */
export function builtAtLine(when: string): string {
  const line = written(TEAM_STRINGS.builtAt);
  return line ? line.replace("{when}", when) : "";
}

/**
 * The seven column headings on the month grid, Sunday first.
 *
 * Sunday first because a Thai calendar starts on Sunday, not on Monday as ISO does, and the
 * grid is read by three Thai speakers and nobody else.
 *
 * These are the one place this app needs a word that no Note has ever had to print. A job
 * line carries the day name in full, `พฤหัส 26 พย`, which is the skill's and is far too long
 * for a column one seventh of a phone wide, so a grid needs its own short forms.
 *
 * **These seven are the conventional abbreviations**, documented in several places rather
 * than written here, which makes them the one set in this file that is not really a draft of
 * mine. Documented is still not approved, so they are Paul's to change like the rest.
 *
 * One entry per column, index 0 Sunday through index 6 Saturday. Order is positional and is
 * not his to change: the grid reads the index, not the word. Two or three characters each,
 * because a column a seventh of a phone wide wraps anything longer onto two lines.
 */
export const CALENDAR_WEEKDAYS: readonly string[] = [
  "อา.",
  "จ.",
  "อ.",
  "พ.",
  "พฤ.",
  "ศ.",
  "ส.",
];

/**
 * A string somebody has written, or nothing at all.
 *
 * **Every screen in this app runs its text through this**, and what comes back empty is not
 * rendered: no empty paragraph, no bare badge, no button with nothing on it. The element
 * goes, not just its words.
 *
 * It replaces a band that used to sit at the top of every screen counting the strings still
 * unwritten and naming them. Paul asked for that band and the bracketed English gone,
 * 17/11/2026, and this is the shape of "gone" that does not leave holes.
 *
 * **Every slot carries words today, so nothing here is currently hiding anything.** What it
 * costs is worth knowing anyway, because it is what a new slot does: an app whose unwritten
 * sentences are invisible looks finished when it is not. That was the state for one day, and
 * it is why these screens were bare rather than badly designed. A new slot starts as a
 * `[TH ...]` placeholder and this function renders it as nothing, which is still the right
 * trade, as long as somebody greps `[TH` in this file before calling a screen finished.
 */
export function written(value: string): string {
  return value.includes(PENDING_MARK) ? "" : value;
}

/** The column headings, or none, so a grid with unwritten ones drops the row rather than
 * printing seven empty cells. */
export function weekdaysWritten(): boolean {
  return CALENDAR_WEEKDAYS.every((day) => written(day) !== "");
}
