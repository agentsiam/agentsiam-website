import Image from "next/image";
import Link from "next/link";
import { IconChip } from "@/components/icon";
import { JsonLd } from "@/components/json-ld";
import { SubscribeForm } from "@/components/subscribe-form";
import { TranslationNote } from "@/components/translation-note";
import { getDictionary, type Dictionary } from "@/i18n";
import { localePath, resolvePublishedLocale, type Locale } from "@/i18n/config";
import {
  articleBody,
  articlePath,
  articlesForOutlet,
  outletCopy,
  OUTLETS,
  readingMinutes,
  type Article,
  type OutletSlug,
} from "@/lib/editorial";
import { pickPhoto } from "@/lib/photos";
import { localeDate } from "@/lib/site";
import { breadcrumbSchema, type Crumb } from "@/lib/structured-data";

/**
 * The index for one outlet: the masthead, the lead piece, the email capture, everything
 * else published, and a way out.
 *
 * The hub exists for two reasons beyond being a list. It gives every article an internal
 * link from a page that is itself linked from the footer, so nothing in here is an orphan;
 * and it is the page that can rank for the category rather than the question, which an
 * individual article cannot do. From 15/11/2026 it has a third: it is where a reader hands
 * over an email address, which is the only thing on either outlet that compounds.
 *
 * **It is built for a library and currently holds one piece per outlet, and that shaped
 * every decision here.** A hub whose design only works at twenty articles is a hub that
 * looks broken until it has them. So: the lead piece is a feature card rather than the
 * first row of a list; the column beside the capture shows the other pieces when there are
 * any and the lead piece's own questions when there are not, which is real content either
 * way; and the rail gathers the pages elsewhere on this site that a reader of an outlet
 * would want next, which is both useful and the honest way to fill a grid. Nothing here
 * renders a category filter, a search box or a "load more", because two articles do not
 * need any of the three and an empty control is worse than no control.
 *
 * The rail also closes half of a gap the README records: nothing routed a reader between
 * the outlets and the pages they belong beside. This is the outward half. The inward half,
 * links from `/short-term-rental-licence-chiang-mai` and the neighbourhood pages back into
 * the outlets, is still open.
 *
 * It carries the link to the *other* outlet, which is the one piece of cross-audience
 * navigation on the site that is actively useful. A property owner who arrives at the guest
 * journal through a search for Chiang Mai air quality is exactly the reader the owner
 * outlet wants, and the reverse holds too.
 *
 * No CollectionPage or Blog markup. The organisation and the site are already declared once
 * per page from the root layout, the breadcrumb is rendered and published, and a third
 * block asserting that a list of two articles is a publication would be describing an
 * ambition rather than the page.
 */

const OTHER: Record<OutletSlug, OutletSlug> = {
  journal: "host-newsletter",
  "host-newsletter": "journal",
};

/**
 * The masthead photograph per outlet. A lane inside the moat for the guest journal, a
 * villa behind its hedge for the owner newsletter: the first is a place to come to, the
 * second is a thing to own, which is the difference between the two readerships in one
 * frame. Both are decorative here -- the h1 under them says what the page is -- so both
 * render with an empty alt.
 */
const MASTHEAD_PHOTO: Record<OutletSlug, string> = {
  journal: "old-city.",
  "host-newsletter": "hang-dong.",
};

/**
 * "Also worth reading": the pages already on this site that belong beside each outlet.
 *
 * Labels and lines come from the dictionaries rather than from editorial.ts, because this
 * is navigation and navigation is always translated. The split is the one editorial.ts
 * sets out: chrome in the dictionaries, the words of a piece in the module.
 */
type RailItem = { path: string; icon: string; label: keyof Dictionary; body: keyof Dictionary };

const RAIL: Record<OutletSlug, RailItem[]> = {
  journal: [
    { path: "/destinations", icon: "pin", label: "hubRailAreasLabel", body: "hubRailAreasBody" },
    {
      path: "/lotushouse/local-guide",
      icon: "walk",
      label: "hubRailGuideLabel",
      body: "hubRailGuideBody",
    },
    {
      path: "/house-for-rent-chiang-mai",
      icon: "house",
      label: "hubRailHousesLabel",
      body: "hubRailHousesBody",
    },
  ],
  "host-newsletter": [
    {
      path: "/short-term-rental-licence-chiang-mai",
      icon: "document",
      label: "hubRailLicenceLabel",
      body: "hubRailLicenceBody",
    },
    { path: "/how-it-works", icon: "key", label: "hubRailHowLabel", body: "hubRailHowBody" },
    {
      path: "/management/phuket",
      icon: "globe",
      label: "hubRailCitiesLabel",
      body: "hubRailCitiesBody",
    },
  ],
};

/** The three lines under "How this is written". Same on both outlets: it is one practice. */
const HOW: { icon: string; title: keyof Dictionary; body: keyof Dictionary }[] = [
  { icon: "seal", title: "hubHow1Title", body: "hubHow1Body" },
  { icon: "pin", title: "hubHow2Title", body: "hubHow2Body" },
  { icon: "shield", title: "hubHow3Title", body: "hubHow3Body" },
];

export function OutletIndex({
  outlet: slug,
  locale,
}: {
  outlet: OutletSlug;
  locale: Locale;
}) {
  const t = getDictionary(locale);
  const outlet = OUTLETS[slug];
  const masthead = outletCopy(outlet, locale);
  const written = resolvePublishedLocale(locale, outlet.publishedIn);
  const articles = articlesForOutlet(slug);
  const otherSlug = OTHER[slug];
  const otherMasthead = outletCopy(OUTLETS[otherSlug], locale);
  const otherWritten = resolvePublishedLocale(locale, OUTLETS[otherSlug].publishedIn);
  const otherProse = otherWritten === locale ? undefined : otherWritten;
  const href = (path: string) => localePath(locale, path);
  const crumbs: Crumb[] = [{ name: masthead.name }];

  const [lead, ...rest] = articles;
  const mastheadPhoto = pickPhoto("areas", MASTHEAD_PHOTO[slug]);
  // A rail item that is also the outlet's own call to action would put the same link on the
  // page twice, once as reading and once as the conversion. Drop the reading copy.
  const rail = RAIL[slug].filter((item) => item.path !== outlet.ctaPath);
  // The prose is in `written`, so the reading time is counted in that language whatever
  // the chrome is set in.
  const prose = written === locale ? undefined : written;

  return (
    <div>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />

      {written === locale ? null : (
        <TranslationNote locale={locale} note="editorialEnglishNote" />
      )}

      {/* -- Masthead ----------------------------------------------------------
          The ink panel the homepage hero uses, at two thirds its height. An outlet index
          opened with a line of grey eyebrow type above a headline on white, which read as
          the top of an article rather than as the front of a publication. */}
      <section className="px-5">
        <div className="relative mx-auto mt-4 max-w-(--container-chrome) overflow-hidden rounded-panel bg-ink px-6 py-11 sm:px-12 sm:py-14">
          {mastheadPhoto ? (
            <>
              <Image
                src={mastheadPhoto.src}
                alt=""
                aria-hidden="true"
                placeholder="blur"
                fill
                priority
                sizes="(min-width: 1440px) 1400px, 100vw"
                className="object-cover object-[50%_55%]"
              />
              {/* Vertical below 900 and horizontal above it, for the reason the homepage
                  gives: the text column is the left half on a wide screen and the whole
                  width on a phone, so the scrim has to run the way the layout does. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,8,20,0.92)_0%,rgba(10,8,20,0.86)_55%,rgba(10,8,20,0.58)_100%)] min-[900px]:bg-[linear-gradient(90deg,rgba(10,8,20,0.93)_0%,rgba(10,8,20,0.82)_38%,rgba(10,8,20,0.42)_70%,rgba(10,8,20,0.18)_100%)]"
              />
            </>
          ) : (
            <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-[32%] bg-primary min-[900px]:block" />
          )}

          <div className="relative min-[900px]:max-w-[min(680px,calc(62%-24px))]">
            <span className="eyebrow inline-block rounded-full bg-white/92 px-4 py-1.5 text-ink">
              {t.articleOutletEyebrow}
            </span>
            <h1
              className="mt-4 font-headline text-[clamp(30px,5.4vw,46px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-white"
              lang={prose}
            >
              {masthead.name}
            </h1>
            <p className="mt-4 max-w-[58ch] text-[16.5px] leading-relaxed text-white/80" lang={prose}>
              {masthead.standfirst}
            </p>

            {/* What the publication is, in two facts and one offer. The offer is a jump
                rather than a second form: one capture per page, and the anchor costs
                nothing to a reader who scrolls past it. */}
            {/* No separator between the two facts. A dot earns its place on one line and
                dangles at the end of the first when the row wraps, which it does in all
                three languages at 375. The gap says the same thing and cannot wrap. */}
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2.5">
              <span className="text-[13px] text-white/65">{t.hubMetaLanguages}</span>
              <span className="text-[13px] text-white/65">{t.hubMetaSourced}</span>
              <a
                href="#subscribe"
                className="rounded-full bg-white/12 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white hover:text-ink"
              >
                {t.hubSubscribeJump} →
              </a>
            </div>
          </div>
        </div>
      </section>

      {lead ? (
        <LeadCard article={lead} locale={locale} t={t} href={href} prose={prose} />
      ) : null}

      {/* -- The rest of the shelf, and the capture beside it --------------------
          Two columns at 1000 and up, the capture second on a phone so the reading comes
          first. The left column is the archive once there is one, and until then it is the
          lead piece's own four questions, which is what that piece answers rather than a
          placeholder standing where a list will go. */}
      <section className="mx-auto mt-12 grid max-w-(--container-chrome) gap-6 px-5 min-[1000px]:grid-cols-[1fr_minmax(330px,420px)] min-[1000px]:gap-8">
        <div>
          <h2 className="font-display text-[21px] font-bold tracking-[-0.02em]">
            {rest.length > 0 ? t.hubArchiveTitle : t.hubInsideTitle}
          </h2>

          {rest.length > 0 ? (
            <ul className="mt-5 divide-y divide-hairline border-y border-hairline">
              {rest.map((article) => (
                <ArticleRow
                  key={article.slug}
                  article={article}
                  locale={locale}
                  t={t}
                  href={href}
                  prose={prose}
                />
              ))}
            </ul>
          ) : lead ? (
            <ol className="mt-5 divide-y divide-hairline border-y border-hairline" lang={prose}>
              {articleBody(lead, locale).answers.map((answer, index) => (
                <li key={answer.q}>
                  <Link
                    href={href(articlePath(lead))}
                    className="group flex gap-4 py-4.5 hover:text-primary"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 font-mono text-[12px] text-muted"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">
                      <span className="block text-[15.5px] font-semibold leading-snug">
                        {answer.q}
                      </span>
                      <span className="mt-1 block text-[14px] leading-relaxed text-body group-hover:text-body">
                        {answer.a}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : null}
        </div>

        {/* The capture. Ink, because it is the one panel on the page that has to be found
            from anywhere on it, and because the masthead's jump link lands here. */}
        <aside
          id="subscribe"
          className="scroll-anchor h-fit rounded-panel bg-ink p-7 sm:p-8 min-[1000px]:sticky min-[1000px]:top-[calc(var(--nav-h)+16px)]"
        >
          <SubscribeForm
            t={t}
            locale={locale}
            outlet={slug}
            tone="ink"
            body={slug === "journal" ? t.subBodyJournal : t.subBodyHost}
            privacyHref={href("/privacy-policy")}
          />
        </aside>
      </section>

      {/* -- Also worth reading ------------------------------------------------- */}
      {rail.length > 0 ? (
        <section className="mt-16 bg-surface py-14">
          <div className="mx-auto max-w-(--container-chrome) px-5">
            <h2 className="font-display text-[21px] font-bold tracking-[-0.02em]">
              {t.hubAlsoTitle}
            </h2>
            <ul className="mt-6 grid gap-5 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
              {rail.map((item) => (
                <li key={item.path}>
                  <Link
                    href={href(item.path)}
                    className="flex h-full flex-col rounded-panel border border-hairline bg-bg p-6 hover:border-ink"
                  >
                    <IconChip name={item.icon} />
                    <span className="mt-4 font-display text-[17px] font-bold tracking-[-0.015em]">
                      {t[item.label]}
                    </span>
                    <span className="mt-2 flex-1 text-[14px] leading-relaxed text-body">
                      {t[item.body]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* -- How this is written ------------------------------------------------
          The three things that separate these pieces from the posts they compete with,
          and all three are checkable on the articles themselves: a checked-on date, a
          named publisher in Chiang Mai, and a limits section with sources under it. */}
      <section className="mx-auto max-w-(--container-chrome) px-5 py-14">
        <h2 className="font-display text-[21px] font-bold tracking-[-0.02em]">{t.hubHowTitle}</h2>
        <ul className="mt-6 grid gap-7 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
          {HOW.map((item) => (
            <li key={item.title}>
              <IconChip name={item.icon} tone="sand" />
              <h3 className="mt-3.5 font-display text-[16px] font-bold tracking-[-0.015em]">
                {t[item.title]}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-body">{t[item.body]}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* -- Out: the other outlet, and the service ------------------------------ */}
      <section className="mx-auto max-w-(--container-chrome) px-5 pb-18">
        <div className="grid gap-5 sm:grid-cols-2">
          <Link
            href={href(`/${otherSlug}`)}
            className="group flex flex-col rounded-panel border border-hairline p-7 hover:border-ink"
          >
            <span className="eyebrow">
              {otherSlug === "host-newsletter" ? t.articleOtherHost : t.articleOtherJournal}
            </span>
            <span
              className="mt-3 font-display text-[19px] font-bold tracking-[-0.015em] group-hover:text-primary"
              lang={otherProse}
            >
              {otherMasthead.name}
            </span>
            <span className="mt-2 flex-1 text-[14px] leading-relaxed text-body" lang={otherProse}>
              {otherMasthead.standfirst}
            </span>
            <span className="mt-4 text-[14px] font-semibold underline underline-offset-4">
              {t.articleReadOutlet.replace("{outlet}", otherMasthead.name)} →
            </span>
          </Link>

          {/* The conversion. One per page and the only ink pill on it, which is what the
              design system reserves the fill for. */}
          <div className="flex flex-col justify-between rounded-panel bg-surface-2 p-7">
            <p className="max-w-[26ch] font-display text-[19px] font-bold leading-snug tracking-[-0.015em]">
              {slug === "journal" ? t.hubCtaJournal : t.hubCtaHost}
            </p>
            <div className="mt-5">
              <Link href={href(outlet.ctaPath)} className="pill-primary" lang={prose}>
                {masthead.ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * The lead piece, as a feature rather than as the first row of a list.
 *
 * Text and frame swap order at 900: the photograph is above the headline on a phone, where
 * it is the thing that stops a scroll, and beside it on a wide screen, where a headline at
 * the top of the column is what a reader looks for.
 */
function LeadCard({
  article,
  locale,
  t,
  href,
  prose,
}: {
  article: Article;
  locale: Locale;
  t: Dictionary;
  href: (path: string) => string;
  prose?: Locale;
}) {
  const copy = articleBody(article, locale);
  const path = articlePath(article);
  const photo = article.image ? pickPhoto(article.image.set, article.image.file) : undefined;
  const written = resolvePublishedLocale(locale, article.publishedIn);

  return (
    <section className="mx-auto mt-12 max-w-(--container-chrome) px-5">
      <span className="eyebrow">{t.hubLatest}</span>
      <article className="mt-4 grid overflow-hidden rounded-panel border border-hairline min-[900px]:grid-cols-[1.08fr_1fr]">
        <div className="order-2 flex flex-col p-7 sm:p-9 min-[900px]:order-1 min-[900px]:p-10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-muted">
            <span className="rounded-full bg-surface px-3 py-1 font-semibold text-ink" lang={prose}>
              {copy.topic}
            </span>
            <time dateTime={article.datePublished}>
              {localeDate(locale, article.datePublished)}
            </time>
            <span>{t.hubMinRead.replace("{n}", String(readingMinutes(copy, written)))}</span>
          </div>

          <h2
            className="mt-4 font-headline text-[clamp(23px,3.2vw,32px)] font-extrabold leading-[1.14] tracking-[-0.025em]"
            lang={prose}
          >
            <Link href={href(path)} className="hover:text-primary">
              {copy.title}
            </Link>
          </h2>
          <p className="mt-3.5 max-w-[56ch] flex-1 text-[15.5px] leading-relaxed text-body" lang={prose}>
            {copy.standfirst}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href={href(path)} className="pill-primary">
              {t.hubReadFull}
            </Link>
            <span className="text-[13px] text-muted">{t.hubByline}</span>
          </div>
        </div>

        {/* The frame. Fixed ratio on a phone so the card keeps its shape, and stretched to
            the text column's height above 900 so the two halves meet. */}
        {photo ? (
          <div className="relative order-1 aspect-16/10 min-[900px]:order-2 min-[900px]:aspect-auto min-[900px]:min-h-[340px]">
            <Image
              src={photo.src}
              alt={photo.alt}
              lang="en"
              placeholder="blur"
              fill
              sizes="(min-width: 900px) 46vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div aria-hidden="true" className="order-1 grad-sand min-h-[120px] min-[900px]:order-2" />
        )}
      </article>
    </section>
  );
}

/** One piece in the archive, under the lead. */
function ArticleRow({
  article,
  locale,
  t,
  href,
  prose,
}: {
  article: Article;
  locale: Locale;
  t: Dictionary;
  href: (path: string) => string;
  prose?: Locale;
}) {
  const copy = articleBody(article, locale);
  const written = resolvePublishedLocale(locale, article.publishedIn);
  const photo = article.image ? pickPhoto(article.image.set, article.image.file) : undefined;

  return (
    <li>
      <Link href={href(articlePath(article))} className="group flex gap-5 py-5">
        {photo ? (
          <span className="relative hidden h-[84px] w-[112px] shrink-0 overflow-hidden rounded-box sm:block">
            <Image
              src={photo.src}
              alt=""
              aria-hidden="true"
              placeholder="blur"
              fill
              sizes="112px"
              className="object-cover"
            />
          </span>
        ) : null}
        <span className="flex-1">
          <span className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-muted">
            <span className="font-semibold text-ink" lang={prose}>
              {copy.topic}
            </span>
            <time dateTime={article.datePublished}>
              {localeDate(locale, article.datePublished)}
            </time>
            <span>{t.hubMinRead.replace("{n}", String(readingMinutes(copy, written)))}</span>
          </span>
          <span
            className="mt-1.5 block font-display text-[17.5px] font-bold leading-snug tracking-[-0.015em] group-hover:text-primary"
            lang={prose}
          >
            {copy.title}
          </span>
          <span className="mt-1.5 block max-w-[62ch] text-[14px] leading-relaxed text-body" lang={prose}>
            {copy.standfirst}
          </span>
        </span>
      </Link>
    </li>
  );
}
