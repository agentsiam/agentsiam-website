import Link from "next/link";
import { RemarksBlock, RenderedBlock } from "@/components/cleaning/blocks";
import { OfflineNotice } from "@/components/cleaning/offline-notice";
import { SeenRecorder } from "@/components/cleaning/seen-recorder";
import { VisitList } from "@/components/cleaning/visits";
import {
  builtAtDigits,
  nextVisitIndex,
  parseDocument,
  todayInBangkok,
} from "@/lib/cleaning/document";
import { requireHolder } from "@/lib/cleaning/guard";
import { CLEANING_CODES } from "@/lib/cleaning/routes";
import { sinceLastSeen, visitsDigest } from "@/lib/cleaning/seen";
import { readNote } from "@/lib/cleaning/store";
import { TEAM_STRINGS, builtAtLine } from "@/lib/cleaning/strings";

/**
 * Her schedule. The device cookie alone opens it.
 *
 * No PIN here, on purpose: she opens this at a gate in the rain with her hands full, a
 * second factor would be paid every single time, and the schedule is not the secret. The
 * codes are, and they are one tap away behind her PIN.
 *
 * Everything on this screen is text the published document carries, rendered by the same
 * script that renders the LINE Note Paul pastes. This page sorts by an ISO date, works out
 * which visit is next, marks what has changed since she last looked, and puts text on a
 * phone. It composes nothing.
 */

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const holder = await requireHolder();

  let document = null;
  try {
    document = parseDocument(await readNote(holder.person));
  } catch {
    // The store is unreachable, or what is under her key is not readable. She cannot act on
    // either, so she gets the one message she can act on.
    document = null;
  }

  if (!document) {
    return (
      <main>
        <p className="mt-8 rounded-panel border border-hairline bg-surface p-5 text-[17px] leading-7 text-body">
          {TEAM_STRINGS.noSchedule}
        </p>
      </main>
    );
  }

  const today = todayInBangkok();
  const nextIndex = nextVisitIndex(document.visits, today);
  const { changed } = await sinceLastSeen(holder.person, document.visits);
  const digest = await visitsDigest(document.visits);
  const when = document.built_at ? builtAtDigits(document.built_at) : null;

  return (
    <main lang={document.lang}>
      <h1 className="text-[22px] font-semibold leading-8 text-text">{document.title}</h1>
      {when ? <p className="mt-1 text-[15px] text-muted">{builtAtLine(when)}</p> : null}
      <OfflineNotice />

      <VisitList
        visits={document.visits}
        nextIndex={nextIndex}
        today={today}
        changed={changed}
      />

      {document.access ? (
        <Link
          href={CLEANING_CODES}
          className="mt-7 flex items-center justify-between rounded-panel border border-ink bg-bg px-4 py-4 text-[18px] font-semibold text-text"
        >
          <span>{document.access.heading}</span>
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
            <rect x="4" y="10.5" width="16" height="10" rx="2" />
            <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
          </svg>
        </Link>
      ) : null}

      {document.contact ? <RenderedBlock block={document.contact} /> : null}
      {document.remarks ? <RemarksBlock block={document.remarks} /> : null}

      <SeenRecorder stamp={digest} />
    </main>
  );
}
