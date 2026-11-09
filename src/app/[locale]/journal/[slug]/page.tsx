import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/article-page";
import { isLocale, LOCALES, type Locale } from "@/i18n/config";
import {
  articleBody,
  articleBySlug,
  articlePath,
  articlesForOutlet,
} from "@/lib/editorial";
import { pageMeta } from "@/lib/site";

/**
 * One piece in Journal of Chiang Mai.
 *
 * Prerendered for every article, because these pages exist to be landed on from a search
 * result or quoted by an answer engine, and both want served HTML rather than something
 * reached by running JavaScript.
 *
 * A slug that is not in ARTICLES 404s rather than rendering an empty shell, which is what
 * keeps a mistyped or retired URL from becoming an indexable blank page.
 */

const OUTLET = "journal" as const;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    articlesForOutlet(OUTLET).map((article) => ({ locale, slug: article.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/journal/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const article = articleBySlug(OUTLET, slug);
  if (!article) notFound();

  const copy = articleBody(article, locale);
  return pageMeta({
    title: copy.metaTitle,
    description: copy.metaDesc,
    path: articlePath(article),
    locale,
    publishedIn: article.publishedIn,
  });
}

export default async function ArticleRoute({
  params,
}: PageProps<"/[locale]/journal/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const article = articleBySlug(OUTLET, slug);
  if (!article) notFound();

  return <ArticlePage article={article} locale={locale as Locale} />;
}
