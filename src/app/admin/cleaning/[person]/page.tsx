import Link from "next/link";
import { notFound } from "next/navigation";
import { JobComment } from "@/components/admin/job-comment";
import { requireSession } from "@/lib/admin/guard";
import { photoStillKept } from "@/lib/cleaning/comment-shape";
import { listComments } from "@/lib/cleaning/comments";
import {
  builtAtDigits,
  parseDocument,
  propertyOf,
  todayInBangkok,
  visitSlug,
} from "@/lib/cleaning/document";
import { ADMIN_CLEANING, adminCleaningPersonPath } from "@/lib/cleaning/routes";
import { PERSON_KEY } from "@/lib/cleaning/session";
import { readNote, storeProblem } from "@/lib/cleaning/store";

/**
 * One person's cleans, and the conversation about each.
 *
 * Paul's instruction, 17/11/2026: a comment section where an AgentSiam colleague and the
 * cleaning lady can talk. Her phone is one end of it and this is the other.
 *
 * **It is its own screen on purpose.** The phones screen says in its own words that it
 * carries no door code and no schedule, and that is worth keeping: it is device bookkeeping
 * and nothing else. Answering a message about a clean cannot work that way, because a
 * thread with no job attached is a thread nobody can act on, so the job lines are here and
 * this page says so rather than quietly widening the other one.
 *
 * **Still no door code.** The access block is not read here and not rendered here. The only
 * thing this page adds to what Paul already knows is which of her jobs a message is about,
 * and he wrote the schedule those jobs came from.
 */

export const dynamic = "force-dynamic";

export default async function AdminCleaningPersonPage({
  params,
}: {
  params: Promise<{ person: string }>;
}) {
  const { person } = await params;
  await requireSession(adminCleaningPersonPath(person));
  if (!PERSON_KEY.test(person)) notFound();

  const problem = storeProblem();
  const document = problem ? null : parseDocument(await readNote(person).catch(() => null));

  const today = todayInBangkok();
  const visits = document ? [...document.visits].reverse() : [];
  const threads = await Promise.all(
    visits.map(async (visit) => ({
      visit,
      slug: visitSlug(visit),
      comments: await listComments(visitSlug(visit)).catch(() => []),
    })),
  );

  return (
    <div>
      <Link href={ADMIN_CLEANING} className="text-sm font-semibold text-muted">
        Cleaning team phones
      </Link>
      <h1
        className="mt-2 text-xl font-semibold text-text"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        Messages with {person}
      </h1>
      <p className="mt-2 max-w-[60ch] text-sm text-muted">
        Her jobs, newest first, each with the conversation about it. She sees the same thread
        on the job screen in her app, and anything sent here is signed AgentSiam. No door code
        is on this page.
      </p>

      {problem ? (
        <p className="mt-4 rounded-box border border-hairline bg-wash-red p-4 text-sm text-deep-red">
          {problem}
        </p>
      ) : null}

      {!problem && !document ? (
        <p className="mt-4 rounded-box border border-hairline bg-surface p-4 text-sm text-muted">
          Nothing is published for {person}, so there are no jobs to talk about. The
          cleaning-schedule skill publishes a document per person on every run.
        </p>
      ) : null}

      <div className="mt-4 space-y-4">
        {threads.map(({ visit, slug, comments }) => {
          const house = document ? propertyOf(document, visit) : null;
          return (
            <section
              key={slug}
              className={`rounded-box border border-hairline p-4 ${
                visit.date < today ? "opacity-60" : ""
              }`}
            >
              <p className="text-sm font-semibold text-text">{visit.line}</p>
              <p className="mt-1 text-xs text-muted">
                {visit.date}
                {house ? ` · ${house.name}` : ""}
                {visit.type ? ` · ${visit.type}` : ""}
                {comments.length > 0 ? ` · ${comments.length} message${comments.length === 1 ? "" : "s"}` : ""}
              </p>

              {comments.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {comments.map((comment) => (
                    <li
                      key={comment.id}
                      className={`rounded-box p-3 text-sm ${
                        comment.by === "agentsiam" ? "bg-wash-gold" : "bg-surface"
                      }`}
                    >
                      <p className="text-xs font-semibold text-muted">
                        {comment.name}
                        {builtAtDigits(comment.at) ? ` · ${builtAtDigits(comment.at)}` : ""}
                      </p>
                      {comment.body ? (
                        <p className="mt-1 whitespace-pre-wrap text-text">{comment.body}</p>
                      ) : null}
                      {/* Only while the month it is kept for lasts, the same as her screen:
                          after that the sweep has taken it and a broken image is worse than
                          none. */}
                      {comment.image && photoStillKept(comment.at) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={comment.image}
                          alt=""
                          loading="lazy"
                          className="mt-2 max-h-[280px] rounded-box object-contain"
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              <JobComment person={person} slug={slug} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
