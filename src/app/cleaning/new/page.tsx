import { redirect } from "next/navigation";
import { AcceptChoice } from "@/components/cleaning/accept-choice";
import { HouseMark, Occupied } from "@/components/cleaning/glyphs";
import { OfflineNotice } from "@/components/cleaning/offline-notice";
import { acceptState } from "@/lib/cleaning/accept";
import { scheduleFor } from "@/lib/cleaning/assign";
import { propertyOf, todayInBangkok, visitSlug } from "@/lib/cleaning/document";
import { visitLine } from "@/lib/cleaning/english";
import { pinGiven, requireHolder } from "@/lib/cleaning/guard";
import { houseMarks, markOf } from "@/lib/cleaning/houses";
import { teamLang } from "@/lib/cleaning/lang";
import { CLEANING_SCHEDULE } from "@/lib/cleaning/routes";
import { teamStrings, written } from "@/lib/cleaning/strings";

/**
 * The new work, and the one screen in this app she cannot walk past.
 *
 * Paul, 18/11/2026: the accept screen has to be a different screen from the calendar and the
 * list, so that she answers everything new before she goes into her schedule. The card that
 * used to sit at the top of her schedule did not do that: it could be scrolled past, and a
 * prompt that can be scrolled past on a phone is a prompt that is scrolled past.
 *
 * So the schedule, the day screen and the month grid all send her here while anything from
 * today onwards is unanswered, and this screen sends her straight back to her schedule the
 * moment nothing is. It cannot be reached when it has nothing to ask and it has no way out
 * except answering, which is the whole of what Paul asked for.
 *
 * **Only cleans from today onwards hold her here.** A clean last Tuesday that was never
 * answered is a fact about last week, and gating on it would shut her out of her own schedule
 * for good. The same cut-off is in the schedule screen, so the two cannot disagree about
 * whether she is held.
 *
 * **It is blue, and that is deliberate.** Paul: use a colour from the AgentSiam brand rather
 * than black, so it is more colourful. The rest of the app is ink panels on white, which is
 * the design system's ground; this screen is the one moment that is not a schedule, and the
 * brand blue is what says so before she has read a word. The pair of buttons is white on that
 * blue: src/components/cleaning/accept-choice.tsx draws them and says why they are a pair.
 *
 * **Each clean is answered on its own.** One pair of buttons under three cleans would be an
 * agreement to whatever happened to be in the list, and two houses can want her on the same
 * day at different hours.
 *
 * Nothing here composes a Thai word. The line is the document's own on a Thai phone and
 * composed from its structure on an English one, which src/lib/cleaning/english.ts owns, and
 * anything true of one clean is the skill's text in the language it was published in.
 */

export const dynamic = "force-dynamic";

export default async function NewWorkPage() {
  const holder = await requireHolder();
  const lang = await teamLang();
  const t = teamStrings(lang);

  // The PIN is the front door of the app, so a phone that has not given it goes to the
  // schedule URL, which is where that gate is drawn.
  if (!(await pinGiven(holder))) redirect(CLEANING_SCHEDULE);

  let document = null;
  try {
    document = await scheduleFor(holder.person);
  } catch {
    document = null;
  }
  // Nothing published, or nothing readable. The schedule screen is where that is said, in the
  // one sentence she can act on, and saying it twice in two places is how they drift apart.
  if (!document) redirect(CLEANING_SCHEDULE);

  const today = todayInBangkok();
  // A store that cannot be read answers with nothing waiting, which sends her to her
  // schedule. That is the right way for this to fail: a gate that cannot tell whether she has
  // answered must not be the thing standing between her and the address of today's house.
  const { waiting } = await acceptState(holder.person, document.visits).catch(() => ({
    waiting: new Set<string>(),
  }));
  const toAnswer = document.visits.filter(
    (visit) => visit.date >= today && waiting.has(visitSlug(visit)),
  );
  if (toAnswer.length === 0) redirect(CLEANING_SCHEDULE);

  const marks = houseMarks(document);

  return (
    // The app's own language, because almost every word on this screen is the app's. The one
    // exception is marked where it sits.
    <main lang={lang}>
      <OfflineNotice lang={lang} />

      <header className="mt-3">
        {written(t.acceptHeading) ? (
          <h1 className="text-[26px] font-semibold leading-9 text-text">
            {written(t.acceptHeading)}
          </h1>
        ) : null}
        {written(t.acceptIntro) ? (
          <p className="mt-2 text-[17px] leading-7 text-body">{written(t.acceptIntro)}</p>
        ) : null}
      </header>

      <ul className="mt-5 space-y-4">
        {toAnswer.map((visit) => {
          const house = propertyOf(document, visit);
          const mark = markOf(marks, visit.property);
          return (
            <li key={visitSlug(visit)} className="rounded-panel bg-primary p-5">
              <p className="text-[21px] font-semibold leading-8 text-bg">
                {visitLine(visit, lang)}
              </p>
              {house || visit.type === "midstay" ? (
                <span className="mt-2.5 flex flex-wrap items-center gap-2">
                  {house ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-bg/50 px-2.5 py-0.5 text-[14px] font-semibold text-bg">
                      {mark === null ? null : <HouseMark index={mark} size={12} />}
                      {house.name}
                    </span>
                  ) : null}
                  {visit.type === "midstay" ? (
                    <span className="text-bg">
                      <Occupied size={18} />
                    </span>
                  ) : null}
                </span>
              ) : null}
              {/* Anything true of this one clean, in the language it was published in, because
                  it is the skill's sentence and not ours. It is on this screen rather than one
                  tap away for one reason: a cot is part of what she is agreeing to. */}
              {visit.note ? (
                <p lang={document.lang} className="mt-2.5 text-[16px] leading-7 text-bg">
                  {visit.note}
                </p>
              ) : null}
              <AcceptChoice slug={visitSlug(visit)} lang={lang} />
            </li>
          );
        })}
      </ul>
    </main>
  );
}
