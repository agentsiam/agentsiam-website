import Link from "next/link";
import { redirect } from "next/navigation";
import { Message, RenderedBlock } from "@/components/cleaning/blocks";
import { ChevronLeft } from "@/components/cleaning/glyphs";
import { OfflineNotice } from "@/components/cleaning/offline-notice";
import { parseDocument } from "@/lib/cleaning/document";
import { pinGiven, requireHolder } from "@/lib/cleaning/guard";
import { CLEANING_SCHEDULE } from "@/lib/cleaning/routes";
import { readNote } from "@/lib/cleaning/store";
import { TEAM_STRINGS } from "@/lib/cleaning/strings";

/**
 * Her gate and door codes, large, and nothing else on the screen.
 *
 * **No PIN prompt here any more.** Since 17/11/2026 the PIN is the front door of the app,
 * so by the time this page renders it has already been given: a phone that has not given it
 * is sent back to the schedule, where the gate is. This page therefore has exactly one job,
 * which is to be readable at a gate in daylight by someone holding a bag.
 *
 * **Every house, always, whichever link opened it.** `?house=` only decides which one is at
 * the top. The worker matches a saved copy of this page ignoring the query string, so one
 * saved copy answers every one of those links, and it has to hold all of them or a phone
 * with no signal would open the wrong house's codes. Put another way: the parameter is
 * ordering, never filtering.
 *
 * **The service worker keeps this page**, which it used to refuse outright. The page still
 * answers `no-store` and is still dynamic, so the browser's own cache and anything in
 * between may not hold it; the worker's copy exists only because `src/proxy.ts` put a
 * deadline on that response, and it dies on that deadline or on the next navigation after
 * Paul revokes the phone.
 *
 * Every string is the published document's. The lines read `ประตูรั้ว: 1234` as one piece of
 * text, label and value together, exactly as her LINE Note prints them, which is why the
 * label is not styled apart from the number: splitting that line would mean this app
 * deciding where a Thai sentence ends.
 */

export const dynamic = "force-dynamic";

export default async function CodesPage({
  searchParams,
}: {
  searchParams: Promise<{ house?: string }>;
}) {
  const holder = await requireHolder();

  // The front door is on the schedule screen. A phone that has not been through it does not
  // get asked again here, because two places asking for one PIN is two places to get wrong.
  if (!(await pinGiven(holder))) redirect(CLEANING_SCHEDULE);

  const { house: first } = await searchParams;

  let document = null;
  try {
    document = parseDocument(await readNote(holder.person));
  } catch {
    document = null;
  }

  // Ordering, never filtering. See the note above about one saved copy answering every link.
  const blocks = [...(document?.access ?? [])].sort((a, b) => {
    if (a.property === b.property) return 0;
    if (a.property === first) return -1;
    if (b.property === first) return 1;
    return 0;
  });

  return (
    <main lang={document?.lang ?? "th"}>
      {/* The way back carries the schedule's own title as its label, so the control has a
          name in her language without this app owning a word for "back". */}
      <Link
        href={CLEANING_SCHEDULE}
        className="mt-1 flex items-center gap-2 py-2 text-[15px] font-semibold text-muted"
      >
        <ChevronLeft />
        <span className="min-w-0 truncate">{document ? document.title : ""}</span>
      </Link>
      <OfflineNotice />

      {blocks.length > 0 ? (
        blocks.map((block, index) => {
          const house = document?.properties.find((p) => p.id === block.property) ?? null;
          return (
            <section key={block.property ?? index} className="mt-4 rounded-panel bg-ink p-5">
              {house ? (
                <p className="text-[17px] font-semibold text-bg">{house.name}</p>
              ) : null}
              <h1
                className={`text-[14px] font-semibold tracking-wide text-gold-on-ink ${
                  house ? "mt-1" : ""
                }`}
              >
                {block.heading}
              </h1>
              <ul className="mt-4 space-y-4">
                {block.lines.map((line, i) => (
                  <li
                    key={i}
                    className="text-[27px] font-semibold leading-10 tracking-wide text-bg"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      ) : (
        <Message text={TEAM_STRINGS.noSchedule} className="mt-6" />
      )}

      {document?.contact ? <RenderedBlock block={document.contact} tone="panel" /> : null}
    </main>
  );
}
