"use client";

import Link from "next/link";
import { localePath } from "@/i18n/config";
import { useNotFoundStrings } from "@/components/not-found-strings";
import { LOTUS_HOUSE } from "@/lib/property";
import { SITE_NAME } from "@/lib/site";

/**
 * The 404 page, in the reader's language, inside the normal layout.
 *
 * Still a client component, and still for the same reason: a boundary is not a page and
 * receives no params. What changed on 06/09/2026 is where its copy comes from. It used to
 * call `getDictionary`, which made all three dictionaries a client import and put 189KB
 * raw, 55KB gzipped, into the shared chunk every route on this site downloads. The six
 * strings now arrive through a context the layout fills, which is one source of truth,
 * six strings on the wire, and no dictionary in any client bundle.
 *
 * `metadata` cannot be exported from a not-found boundary; the response already carries a
 * 404 status and Next's own noindex handling covers the rest.
 */
export default function NotFound() {
  const t = useNotFoundStrings();
  const href = (path: string) => localePath(t.locale, path);

  const suggestions = [
    { href: href("/"), label: SITE_NAME },
    { href: href(`/${LOTUS_HOUSE.slug}`), label: LOTUS_HOUSE.title },
    { href: href("/how-it-works"), label: t.howItWorks },
    { href: href("/contact"), label: t.contact },
  ];

  return (
    <div className="mx-auto w-full max-w-(--container-prose) px-5 pb-24 pt-20">
      <p className="eyebrow">{t.eyebrow}</p>
      <h1 className="mt-4 font-headline text-[clamp(26px,4.5vw,36px)] font-extrabold leading-[1.12] tracking-[-0.03em]">
        {t.title}
      </h1>
      <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-body">{t.body}</p>

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
        {t.cta}
      </Link>
    </div>
  );
}
