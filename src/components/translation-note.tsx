import { getDictionary } from "@/i18n";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

/**
 * Names what is still in English on a Thai or Chinese page.
 *
 * The handoff translates chrome, headings, CTAs and place names, and deliberately leaves
 * property descriptions, FAQ answers and long-form legal copy for a human translator --
 * those carry the honesty argument and the register differs per language. The rule it sets
 * is that the site says what is pending rather than silently serving English, so any page
 * that shows untranslated body copy renders this.
 *
 * Renders nothing in English.
 */
export function TranslationNote({ locale }: { locale: Locale }) {
  if (locale === DEFAULT_LOCALE) return null;
  const t = getDictionary(locale);

  return (
    <div className="border-b border-hairline bg-wash-gold px-5">
      <p className="mx-auto max-w-(--container-chrome) py-2.5 text-[12.5px] leading-relaxed text-body">
        {t.pendingNote}
      </p>
    </div>
  );
}
