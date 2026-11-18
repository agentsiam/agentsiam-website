import { CLEANING_API_LANG } from "@/lib/cleaning/routes";
import { TEAM_LANGS, TEAM_LANG_NAMES, type TeamLang } from "@/lib/cleaning/strings";

/**
 * Thai or English, on every screen in this app.
 *
 * Paul, 18/11/2026: the cleaner should be able to switch between English and Thai. It sits in
 * the root layout rather than on the schedule screen, which puts it on the enrolment link, on
 * the PIN gate and on every screen behind it, because the one person who needs it is the one
 * who cannot read the screen she is looking at and she may be looking at any of them.
 *
 * **Each language is named in its own language**, which is why the word English appears on a
 * Thai screen. It is the only Latin in this app's own words and it is deliberate: a label
 * reading the name of a language in the language you cannot read is a label you cannot use.
 * The house names, the brand and Ting's name are Latin too and are nobody's to translate.
 *
 * Two submit buttons in one form, no client component and no JavaScript: the language is the
 * value of the button that was pressed, the post goes to a route the service worker never
 * keeps, and what comes back is a redirect to the page she was already on. The option she is
 * already in stays tappable rather than being disabled, because a disabled control on a
 * doorstep in daylight reads as a broken one.
 */
export function LangSwitch({ lang }: { lang: TeamLang }) {
  return (
    <form method="POST" action={CLEANING_API_LANG} className="flex justify-end">
      <div className="inline-flex items-center gap-0.5 rounded-full border border-hairline p-0.5">
        {TEAM_LANGS.map((one) => {
          const on = one === lang;
          return (
            <button
              key={one}
              type="submit"
              name="lang"
              value={one}
              lang={one}
              aria-current={on ? "true" : undefined}
              className={`rounded-full px-3 py-1 text-[13px] font-semibold ${
                on ? "bg-ink text-bg" : "text-muted"
              }`}
            >
              {TEAM_LANG_NAMES[one]}
            </button>
          );
        })}
      </div>
    </form>
  );
}
