"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_LABEL, localePath, stripLocale, type Locale } from "@/i18n/config";

/**
 * The EN / ไทย / 中文 segmented control from the design's header.
 *
 * It swaps the locale on the *current* page rather than sending everyone to the homepage,
 * which is the whole point of having real per-language URLs. Client-side only because it
 * needs the current pathname; the labels themselves come from the caller.
 */
export function LanguageSwitcher({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const pathname = usePathname();
  // usePathname reports the rewritten path (/en/...) as the browser sees it, which for
  // English is already the bare route. stripLocale handles both shapes.
  const route = stripLocale(pathname ?? "/");

  return (
    <div
      aria-label={label}
      className="flex items-center overflow-hidden rounded-full border border-hairline"
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <Link
            key={code}
            href={localePath(code, route)}
            hrefLang={code}
            aria-current={active ? "true" : undefined}
            className={`px-2.5 py-[7px] text-xs font-semibold ${
              active ? "bg-ink text-white" : "text-muted hover:text-text"
            }`}
          >
            {LOCALE_LABEL[code]}
          </Link>
        );
      })}
    </div>
  );
}
