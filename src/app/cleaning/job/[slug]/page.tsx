import Link from "next/link";
import { redirect } from "next/navigation";
import { Message, RenderedBlock } from "@/components/cleaning/blocks";
import { ChevronLeft, JobType, Padlock, Pin } from "@/components/cleaning/glyphs";
import { OfflineNotice } from "@/components/cleaning/offline-notice";
import { accessFor, findVisit, parseDocument, propertyOf } from "@/lib/cleaning/document";
import { pinGiven, requireHolder } from "@/lib/cleaning/guard";
import { CLEANING_SCHEDULE, cleaningCodesPath } from "@/lib/cleaning/routes";
import { readNote } from "@/lib/cleaning/store";
import { TEAM_STRINGS } from "@/lib/cleaning/strings";

/**
 * One job: which house, when, where it is, and the way to its codes.
 *
 * The screen every comparable product has and this app did not, because with one property
 * every question except "when" was answered by there being only one property. With two,
 * "which one and where" is the question, and a schedule that cannot answer it is one she
 * cannot work from.
 *
 * **The address is the new thing, and it is the point.** It is the house's own, written
 * once, carried finished like every other string, and it opens whatever map app her phone
 * has. ZenMaid's cleaner app puts the address on the job card with a link to directions,
 * and that is exactly the shape of the gap here.
 *
 * **The codes are not on this screen.** There is a way to them, one tap, pointed at this
 * house. They stay on their own path because that path is the one the proxy marks, the
 * worker keeps on a deadline and the browser is told not to store: spreading door codes
 * over a second URL would mean spreading all of that over it too.
 */

export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const holder = await requireHolder();

  // The front door is on the schedule screen, which is also where a phone that has not been
  // through it is sent from anywhere else under /cleaning.
  if (!(await pinGiven(holder))) redirect(CLEANING_SCHEDULE);

  let document = null;
  try {
    document = parseDocument(await readNote(holder.person));
  } catch {
    document = null;
  }

  const visit = document ? findVisit(document.visits, slug) : null;
  if (!document || !visit) {
    return (
      <main>
        <Message text={TEAM_STRINGS.noSchedule} />
      </main>
    );
  }

  const house = propertyOf(document, visit);
  const access = accessFor(document, visit.property);

  return (
    <main lang={document.lang}>
      <Link
        href={CLEANING_SCHEDULE}
        className="mt-1 flex items-center gap-2 py-2 text-[15px] font-semibold text-muted"
      >
        <ChevronLeft />
        <span className="min-w-0 truncate">{document.title}</span>
      </Link>
      <OfflineNotice />

      <section className="mt-4 rounded-panel bg-ink p-5">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-on-ink text-ink"
        >
          <JobType role={document.role} />
        </span>
        <p className="mt-4 text-[22px] font-semibold leading-9 text-bg">{visit.line}</p>
        {house ? (
          <p className="mt-2 text-[17px] font-semibold text-gold-on-ink">{house.name}</p>
        ) : null}
      </section>

      {house?.address ? (
        house.map ? (
          <a
            href={house.map}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-start gap-3 rounded-panel border border-border bg-bg p-4 text-[16px] leading-7 text-body"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted"
            >
              <Pin />
            </span>
            <span className="min-w-0">{house.address}</span>
          </a>
        ) : (
          <p className="mt-4 flex items-start gap-3 rounded-panel border border-border bg-bg p-4 text-[16px] leading-7 text-body">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted"
            >
              <Pin />
            </span>
            <span className="min-w-0">{house.address}</span>
          </p>
        )
      ) : null}

      {access ? (
        <Link
          href={cleaningCodesPath(visit.property)}
          className="mt-4 flex items-center justify-between gap-3 rounded-panel bg-sand px-5 py-4 text-[18px] font-semibold text-ink transition-colors duration-150 active:bg-gold-on-ink"
        >
          <span className="min-w-0">{access.heading}</span>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-gold-on-ink"
          >
            <Padlock />
          </span>
        </Link>
      ) : null}

      {document.contact ? <RenderedBlock block={document.contact} tone="panel" /> : null}
    </main>
  );
}
