"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDictionary } from "@/i18n";
import { DEFAULT_LOCALE, isLocale, localePath, type Locale } from "@/i18n/config";
import { LOTUS_HOUSE } from "@/lib/property";

/**
 * A not-found boundary is not a page, so it gets no `params` and cannot be told which
 * locale it is rendering in. It reads the locale off the pathname instead, which is why
 * this one file is a client component -- the alternative is a Thai page whose 404 is
 * suddenly in English.
 *
 * `metadata` cannot be exported from a client component either; the 404 response already
 * carries a 404 status, and Next's own noindex handling covers the rest.
 */
export default function NotFound() {
  const pathname = usePathname() ?? "/";
  const first = pathname.split("/")[1] ?? "";
  const locale: Locale = isLocale(first) ? first : DEFAULT_LOCALE;
  const t = getDictionary(locale);
  const href = (path: string) => localePath(locale, path);

  const suggestions = [
    { href: href("/"), label: "AgentSiam" },
    { href: href(`/${LOTUS_HOUSE.slug}`), label: LOTUS_HOUSE.title },
    { href: href("/how-it-works"), label: t.footHow },
    { href: href("/contact"), label: t.navContact },
  ];

  return (
    <div className="mx-auto w-full max-w-(--container-prose) px-5 pb-24 pt-20">
      <p className="eyebrow">{t.notFoundEyebrow}</p>
      <h1 className="mt-4 font-headline text-[clamp(26px,4.5vw,36px)] font-extrabold leading-[1.12] tracking-[-0.03em]">
        {t.notFoundTitle}
      </h1>
      <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-body">
        {t.notFoundBody}
      </p>

      <ul className="mt-8 flex flex-wrap gap-3">
        {suggestions.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="pill-outline">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <Link href={href("/contact")} className="pill-primary mt-10">
        {t.notFoundCta}
      </Link>
    </div>
  );
}
