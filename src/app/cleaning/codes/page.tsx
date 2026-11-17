import Link from "next/link";
import { RenderedBlock } from "@/components/cleaning/blocks";
import { PinForm } from "@/components/cleaning/pin-form";
import { parseDocument } from "@/lib/cleaning/document";
import { pinGiven, requireHolder } from "@/lib/cleaning/guard";
import { pinSetAt } from "@/lib/cleaning/devices";
import { CLEANING_SCHEDULE } from "@/lib/cleaning/routes";
import { readNote } from "@/lib/cleaning/store";
import { TEAM_STRINGS } from "@/lib/cleaning/strings";

/**
 * Her codes: the device cookie plus her PIN.
 *
 * The one screen in this app with a second factor on it, because a stolen unlocked phone
 * should not open a door. The gate code is shared by the whole team and cannot be revoked
 * for one person; the digital lock holds one code per person. That asymmetry is the
 * property's, not ours, and this screen keeps it: she sees her own access block and never a
 * counterpart's.
 *
 * Never cached, by two mechanisms that do not depend on each other: a no-store header in
 * next.config.ts, and the service worker refusing this path outright.
 */

export const dynamic = "force-dynamic";

export default async function CodesPage() {
  const holder = await requireHolder();

  if (!(await pinGiven(holder))) {
    const set = await pinSetAt(holder.person).catch(() => null);
    return (
      <main>
        <BackLink />
        {set ? (
          <PinForm />
        ) : (
          <p className="mt-6 rounded-panel border border-hairline bg-surface p-5 text-[17px] leading-7 text-body">
            {TEAM_STRINGS.pinMissing}
          </p>
        )}
      </main>
    );
  }

  let document = null;
  try {
    document = parseDocument(await readNote(holder.person));
  } catch {
    document = null;
  }

  return (
    <main lang={document?.lang ?? "th"}>
      <BackLink />
      {document?.access ? (
        <section className="mt-6 rounded-panel border border-ink bg-ink p-5">
          <h1 className="text-[15px] font-semibold text-gold-on-ink">
            {document.access.heading}
          </h1>
          <ul className="mt-3 space-y-3">
            {document.access.lines.map((line, index) => (
              <li
                key={index}
                className="text-[26px] font-semibold leading-9 tracking-wide text-bg"
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
      {document?.contact ? <RenderedBlock block={document.contact} /> : null}
    </main>
  );
}

/** An arrow drawn rather than written: there is no word here that Paul has not approved,
 * and the core rules keep arrow characters out of anything a person reads. */
function BackLink() {
  return (
    <Link
      href={CLEANING_SCHEDULE}
      className="inline-flex h-11 w-11 items-center justify-center rounded-box border border-hairline text-text"
      aria-label="Back"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </Link>
  );
}
