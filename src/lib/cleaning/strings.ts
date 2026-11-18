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
 * **THE THAI HAS BEEN READ BY A THAI SPEAKER, 18/11/2026.** It had not been until then. The
 * seventeen sentences shipped on 17/11/2026 as drafts of mine, on Paul's instruction, because
 * the screens had been rendering nothing at all: an unwritten string takes its element off
 * the page, and three people were being shown blank panels while the sentences waited to be
 * written from scratch.
 *
 * Eleven came back corrected and are here exactly as they were given, not adapted. Two of the
 * corrections turned on a question about this app rather than about Thai, and both were
 * answered from the code: the enrolment link is not tied to a phone in advance but binds
 * whichever phone opens it, so it now asks her to open it on the phone she will use; and the
 * marker on a changed visit fires on any difference in the whole job line, the per-clean note
 * included, so it says the job details changed rather than naming the date and the time.
 *
 * The rest were confirmed as they stood. **The English table is still mine and has had no
 * read**; it is moved only where a correction moved the meaning. The sheet that carries every
 * slot, what it has to say and what it must not, is
 * `as-work/2026-11-16-cleaning-app-scope/thai-strings-to-write.txt` in the document store;
 * correcting one is still a one-line edit in this file and nothing else. **Anything new added
 * here starts as a `[TH ...]` or `[EN ...]` placeholder**, which `written()` below renders as
 * nothing, so a slot nobody has words for cannot ship the other language by accident.
 *
 * The seven calendar headings are a narrower case and are marked where they sit: those are
 * the conventional abbreviations, documented in several places rather than invented here.
 *
 * **Since 18/11/2026 there are two tables, Thai and English, and a switch.** Paul's
 * instruction: the cleaner should be able to switch between English and Thai, and the Thai
 * version must carry no English at all. The switch is
 * src/components/cleaning/lang-switch.tsx, the choice is a cookie on her phone, and what it
 * changes is this file and nothing else. The Thai table is checked for Latin letters by
 * scripts/test-cleaning-strings.mjs, so the no-English half of that instruction is a test
 * rather than a promise.
 *
 * Nothing in this file is translated into the public site's three dictionaries, and nothing
 * there is read here: those are for guests and owners, this is for three phones.
 */

/** What marks a slot nobody has written yet, one per language. `written()` at the foot of
 * this file renders anything carrying one as nothing, and they are what a check greps for. */
export const PENDING_MARKS = ["[TH", "[EN"] as const;

/**
 * The two languages a phone can be set to.
 *
 * Thai first and Thai by default, because the team reads Thai and a phone nobody has
 * touched the switch on is a phone whose owner reads Thai. English exists because Paul
 * asked for the switch on 18/11/2026.
 */
export const TEAM_LANGS = ["th", "en"] as const;

export type TeamLang = (typeof TEAM_LANGS)[number];

export const DEFAULT_TEAM_LANG: TeamLang = "th";

/** Whichever of the two a string is, or null for anything else: a cookie somebody edited,
 * an old value, a query parameter. Null means Thai, by way of DEFAULT_TEAM_LANG. */
export function asTeamLang(value: string | null | undefined): TeamLang | null {
  return TEAM_LANGS.find((lang) => lang === value) ?? null;
}

/**
 * What each language is called, on the switch itself.
 *
 * **The one Latin word on a Thai screen that is there on purpose.** A language is named in
 * its own language, which is the convention everywhere this switch exists, and the whole
 * point of the English option is that somebody who cannot read Thai can find it. Every
 * other string in TEAM_STRINGS_TH is checked for Latin letters; this export is exempt by
 * name and nothing else is.
 */
export const TEAM_LANG_NAMES: Record<TeamLang, string> = {
  th: "ไทย",
  en: "English",
};

export type TeamStringKey = keyof typeof TEAM_STRINGS_TH;

export const TEAM_STRINGS_TH = {
  /**
   * The line under the title saying how old this schedule is.
   *
   * `{when}` is substituted with a date and time in digits, Bangkok time, so that no Thai
   * date is ever composed here. Paul's wording goes around it. It has to work when she is
   * offline looking at a saved copy, which is the case it exists for.
   */
  builtAt: "อัปเดตล่าสุด {when}",

  /**
   * The marker on a visit that is new, or whose line has changed, since the last time she
   * opened the app. It sits beside a job line, on a phone, so it wraps rather than running on.
   *
   * It names the job's details rather than its date and time, which is the correction of
   * 18/11/2026 and is a fact about this app: `sinceLastSeen` compares the whole rendered
   * line, so a new per-clean note or a newly occupied stay flips it exactly as a moved date
   * does. A marker that said the date had changed would be wrong on most of what trips it.
   *
   * It must not read as a correction of the change lines at the foot of her schedule. Those
   * say what changed since the last schedule was **posted**; this one says what changed
   * since **she** last looked. On a week she did not open the app those are different
   * answers and both are true.
   */
  changedSinceSeen: "รายละเอียดงานมีการเปลี่ยนแปลง",

  /**
   * The prompt above the PIN field, which is now the front door of the whole app rather
   * than a second gate in front of the codes.
   *
   * The Thai says the code rather than the PIN, because the word PIN is Latin letters and
   * the Thai version carries none. It says Paul gave her the number in LINE, and it does not
   * mention the door codes: after this one screen she has her schedule and her codes both, and a
   * prompt naming only the codes would be telling her the wrong thing about what she is
   * unlocking.
   */
  pinPrompt: "ใส่รหัสที่พอลส่งให้ทางไลน์",

  /** A wrong PIN. Says nothing about how many tries are left and nothing about whose PIN
   * it is. */
  pinWrong: "รหัสไม่ถูกต้อง",

  /** Too many wrong tries. Says that she has to wait, and that Paul can be asked in LINE.
   * Distinct from a wrong PIN, because the thing she should do next is different. */
  pinLocked: "ใส่รหัสผิดหลายครั้ง กรุณารอสักครู่แล้วลองใหม่ หรือติดต่อพอลทางไลน์",

  /** No PIN has been set for her yet, so the codes screen cannot open at all. She cannot
   * fix this herself: it says to ask Paul. */
  pinMissing: "ยังไม่ได้ตั้งรหัสสำหรับคุณ ติดต่อพอลทางไลน์",

  /**
   * The only thing a phone with no working access is ever told, and the whole of the
   * recovery flow: ask Paul for a new link in LINE.
   *
   * It is one string on purpose. A dead link, a link already used, a link opened on a
   * second phone and a device Paul has revoked all end here, and all four have the same
   * answer. Saying which of them happened would tell whoever is holding the phone something
   * about the others.
   */
  askPaul: "โทรศัพท์เครื่องนี้ยังเข้าดูตารางงานไม่ได้ ขอลิงก์ใหม่จากพอลทางไลน์",

  /** The button that finishes enrolment, on the link Paul sent her. One tap, after which
   * this phone is hers and the link is dead. */
  enrolOpen: "เปิดตารางงานของฉัน",

  /** Nothing has been published for her yet, or what was published has expired. Not an
   * error she can act on, so it says to ask Paul. */
  noSchedule: "ยังไม่มีตารางงานให้ดู สอบถามพอลทางไลน์",

  /** Shown when the phone has no connection and she is reading a saved copy. The age of
   * that copy is the builtAt line above it. */
  offline: "ขณะนี้ออฟไลน์ กำลังแสดงข้อมูลที่บันทึกไว้ล่าสุด",

  /** Above the address on a job, which is a line of text with a pin beside it and nothing
   * saying that tapping it opens a map. */
  jobAddressHeading: "ที่อยู่",

  /** Above the people on a job. Their names and numbers are on the screen with a phone
   * beside them and nothing saying who they are to her. */
  jobPeopleHeading: "ผู้ร่วมงาน",

  /**
   * Under her name on the enrolment link Paul sends in LINE, which otherwise shows a name and
   * a button and no account of what pressing it does.
   *
   * It asks her to open the link on the phone she will use, rather than saying the link works
   * on this phone only. That is the correction of 18/11/2026 and it is the truer sentence:
   * the GET answers on any phone and the POST binds whichever one presses the button, so the
   * choice of phone is hers to make once and cannot be undone.
   */
  enrolHelp: "ลิงก์นี้ใช้ได้ครั้งเดียว กรุณาเปิดบนโทรศัพท์ที่จะใช้ดูตารางงาน",

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
  jobTurnover: "ทำความสะอาดหลังแขกเช็กเอาต์ เพื่อเตรียมรับแขกใหม่",
  jobMidstay: "ทำความสะอาดระหว่างเข้าพัก",

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

/**
 * The same slots in English.
 *
 * Why each one says what it says is written above its Thai twin and is not repeated here.
 * What is worth saying once more is what this table cannot reach. **The schedule itself is
 * not translated.** The title, every job line, the day headings, the address, the contact
 * block, the door codes and the change lines are finished text, published per person by the
 * `cleaning-schedule` skill in that person's own language, which is Thai for all three
 * today. So English switches the app's own words, the headings, the prompts, the markers and
 * the buttons, and the lines under them stay in the language they were published in. A
 * cleaner who reads only English would need her document published in English, which is a
 * change in the skill and not in this repository.
 *
 * The house names are the other thing a switch cannot touch, in either direction: they are
 * the names on the doors and in LINE, so they read the same in both languages and are Latin
 * in both.
 *
 * `[EN ...]` marks an unwritten slot here for the same reason `[TH ...]` does there, and
 * there is deliberately no fallback to the other table: a fallback is how one language
 * quietly ships inside the other, which is the bug R8 describes on the public site.
 */
export const TEAM_STRINGS_EN: Record<TeamStringKey, string> = {
  builtAt: "Last updated {when}",
  changedSinceSeen: "Job details changed",
  pinPrompt: "Enter the PIN Paul sent you on LINE",
  pinWrong: "That is not the right code",
  pinLocked: "Too many tries. Wait a moment and try again, or contact Paul on LINE",
  pinMissing: "No code has been set for you yet. Contact Paul on LINE",
  askPaul: "This phone cannot open the schedule yet. Ask Paul for a new link on LINE",
  enrolOpen: "Open my schedule",
  noSchedule: "There is no schedule to show yet. Ask Paul on LINE",
  offline: "You are offline. Showing the last saved copy",
  jobAddressHeading: "Address",
  jobPeopleHeading: "Working with",
  enrolHelp: "This link works once. Open it on the phone you will use for your schedule",
  pastJobs: "Past jobs",
  jobDetailsHeading: "About this job",
  jobTurnover: "Clean after the guest checks out, ready for the new guest",
  jobMidstay: "Clean during the stay",
  jobRequestsHeading: "Special requests",
  commentsHeading: "Messages",
  commentPlaceholder: "Write a message",
  commentSend: "Send",
  commentFailed: "Not sent. Try again",
};

/**
 * Her screens' words, in the language this phone is set to.
 *
 * Every screen takes its table from here and no screen imports one directly, so a screen
 * cannot be the one that stayed in Thai. The two tables were one export until 18/11/2026
 * and renaming it was the point: a switch whose new language is missing from one screen
 * should fail to compile rather than ship a half-translated phone.
 */
export function teamStrings(lang: TeamLang): Record<TeamStringKey, string> {
  return lang === "en" ? TEAM_STRINGS_EN : TEAM_STRINGS_TH;
}

/** Paul's wording with `{when}` filled in, or nothing while the wording is unwritten. The
 * value is digits and punctuation, never a month name or a day name: those belong to the
 * skill, which is why this one line reads the same in both languages but for its first
 * word. */
export function builtAtLine(lang: TeamLang, when: string): string {
  const line = written(teamStrings(lang).builtAt);
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
export const CALENDAR_WEEKDAYS_TH: readonly string[] = [
  "อา.",
  "จ.",
  "อ.",
  "พ.",
  "พฤ.",
  "ศ.",
  "ส.",
];

/**
 * The same seven columns in English, in the same positions.
 *
 * **Sunday stays first in English too**, which is not a statement about English calendars.
 * The grid is built by `monthWeeks` in src/lib/cleaning/document.ts, which puts the first of
 * the month in a column by its weekday number, Sunday being zero. The order here is that
 * arithmetic's, not the language's, and a Monday-first English row would label every cell in
 * the grid wrongly by one day.
 */
export const CALENDAR_WEEKDAYS_EN: readonly string[] = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

/** The seven column headings in the language this phone is set to. */
export function calendarWeekdays(lang: TeamLang): readonly string[] {
  return lang === "en" ? CALENDAR_WEEKDAYS_EN : CALENDAR_WEEKDAYS_TH;
}

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
  return PENDING_MARKS.some((mark) => value.includes(mark)) ? "" : value;
}

/** The column headings, or none, so a grid with unwritten ones drops the row rather than
 * printing seven empty cells. */
export function weekdaysWritten(lang: TeamLang): boolean {
  return calendarWeekdays(lang).every((day) => written(day) !== "");
}
