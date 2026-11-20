// Tells IndexNow (Bing, Yandex, Seznam, Naver and the other engines that share it) which URLs
// exist, so they fetch them instead of waiting to crawl. Run after a production deploy has
// gone live, never before: the engines fetch the key file below to check ownership, and a
// URL submitted before it is live is fetched as it was.
//
// The key is public by design. Its proof is that public/<key>.txt serves it.
//
// Reads the live sitemap rather than src/lib/site.ts so it submits exactly what production
// advertises. Pass URLs as arguments to submit only those.
const KEY = "b36e8892de419386bc35fc0674dce46f";
const SITE = "https://www.agentsiam.com";

async function sitemapUrls() {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim())
    .filter((u) => u.startsWith(SITE) && !/\.(jpe?g|png|webp|avif)$/i.test(u));
}

const keyRes = await fetch(`${SITE}/${KEY}.txt`);
if (!keyRes.ok || (await keyRes.text()).trim() !== KEY) {
  console.error(`The key file is not live at ${SITE}/${KEY}.txt. Deploy first.`);
  process.exit(1);
}

const urlList = process.argv.length > 2 ? process.argv.slice(2) : await sitemapUrls();
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(SITE).host,
    key: KEY,
    keyLocation: `${SITE}/${KEY}.txt`,
    urlList,
  }),
});
console.log(`IndexNow: ${res.status} ${res.statusText} for ${urlList.length} URLs`);
if (res.status >= 400) process.exit(1);
