import Link from "next/link";
import { redirect } from "next/navigation";
import { RenderedBlock } from "@/components/cleaning/blocks";
import { ChevronLeft } from "@/components/cleaning/glyphs";
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
 * Still never cached, by three mechanisms: `src/proxy.ts` sets `no-store` on this path, the
 * service worker refuses it outright, and the page is dynamic. The codes are the one thing
 * in this app worth stealing and they are never written to a disk on the phone.
 *
 * Every string is the published document's. The lines read `ประตูรั้ว: 1234` as one piece of
 * text, label and value together, exactly as her LINE Note prints them, which is why the
 * label is not styled apart from the number: splitting that line would mean this app
 * deciding where a Thai sentence ends.
 */

export const dynamic = "force-dynamic";

export default async function CodesPage() {
  const holder = await requireHolder();

  // The front door is on the schedule screen. A phone that has not been through it does not
  // get asked again here, because two places asking for one PIN is two places to get wrong.
  if (!(await pinGiven(holder))) redirect(CLEANING_SCHEDULE);

  let document = null;
  try {
    document = parseDocument(await readNote(holder.person));
  } catch {
    document = null;
  }

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

      {document?.access ? (
        <section className="mt-4 rounded-panel bg-ink p-5">
          <h1 className="text-[14px] font-semibold tracking-wide text-gold-on-ink">
            {document.access.heading}
          </h1>
          <ul className="mt-4 space-y-4">
            {document.access.lines.map((line, index) => (
              <li
                key={index}
                className="text-[27px] font-semibold leading-10 tracking-wide text-bg"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-6 rounded-panel border border-hairline bg-surface p-5 text-[17px] leading-7 text-body">
          {TEAM_STRINGS.noSchedule}
        </p>
      )}

      {document?.contact ? <RenderedBlock block={document.contact} tone="panel" /> : null}
    </main>
  );
}
