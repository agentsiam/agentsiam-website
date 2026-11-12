import { AddOutletForm } from "@/components/admin/add-outlet-form";
import { requireSession } from "@/lib/admin/guard";
import { BLOCKED_FILE, readBlocked, storeProblem } from "@/lib/admin/store";

/**
 * The blocked operators.
 *
 * AgentSiam goes to owners directly and never sources through another management company's
 * channels. This page shows the list the shortlist check enforces and lets an outlet be
 * added to it. Nothing here removes one: taking an operator off the list is a decision
 * about who AgentSiam deals with, and it is made in the document store with a commit
 * message saying why.
 */

export const dynamic = "force-dynamic";

export default async function BlockedPage() {
  await requireSession();

  const problem = storeProblem();
  if (problem) {
    return (
      <div className="rounded-panel border border-hairline bg-wash-red p-5 text-sm text-deep-red">
        {problem}
      </div>
    );
  }

  let list;
  try {
    list = await readBlocked();
  } catch (error) {
    return (
      <div className="rounded-panel border border-hairline bg-wash-red p-5 text-sm text-deep-red">
        {error instanceof Error ? error.message : `Could not read ${BLOCKED_FILE}.`}
      </div>
    );
  }

  return (
    <>
      <h1
        className="text-xl font-semibold text-text"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        Blocked operators
      </h1>
      <p className="mt-2 text-sm text-muted">
        {BLOCKED_FILE} in the document store. A candidate whose link or contact matches
        anything here is refused when it is saved.
      </p>

      <div className="mt-6 space-y-4">
        {list.operators.map((operator) => (
          <section
            key={operator.operator}
            className="rounded-panel border border-hairline bg-bg p-5"
          >
            <h2 className="text-sm font-semibold text-text">{operator.operator}</h2>
            <p className="text-xs text-muted">Blocked since {operator.blocked_since}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {operator.outlets.map((outlet) => (
                <li key={`${outlet.kind}-${outlet.value}`} className="flex flex-wrap gap-x-2">
                  <span className="font-mono text-xs text-muted">{outlet.kind}</span>
                  <span className="text-text">{outlet.value}</span>
                  {outlet.known_as ? (
                    <span className="text-muted">({outlet.known_as})</span>
                  ) : null}
                  {outlet.channel ? <span className="text-muted">{outlet.channel}</span> : null}
                  {outlet.confirmed === false ? (
                    <span className="rounded-box bg-wash-gold px-2 text-xs font-semibold text-deep-gold">
                      identification not established
                    </span>
                  ) : null}
                  {outlet.matchable === false ? (
                    <span className="rounded-box bg-surface-2 px-2 text-xs font-semibold text-muted">
                      no check can catch this
                    </span>
                  ) : null}
                  {outlet.note ? (
                    <span className="w-full text-xs text-muted">{outlet.note}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <h2
        className="mt-10 text-lg font-semibold text-text"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        Add an outlet
      </h2>
      <p className="mt-2 text-sm text-muted">
        Type the name of an operator exactly as it appears above to add to that row, or a new
        name to start a row.
      </p>
      <AddOutletForm operators={list.operators.map((operator) => operator.operator)} />
    </>
  );
}
