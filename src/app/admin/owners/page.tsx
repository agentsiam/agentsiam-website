import { requireSession } from "@/lib/admin/guard";
import { Problem } from "@/components/admin/problem";
import { RecordList } from "@/components/admin/record-list";
import { adminOwnerPath } from "@/lib/admin/routes";
import { OWNER } from "@/lib/admin/records";
import { readOwnerLeads, storeProblem } from "@/lib/admin/store";
import type { OwnerLead } from "@/lib/admin/types";

/**
 * The owner pipeline: every row of leads.csv.
 *
 * Dynamic on every request, like the renter list. A cached pipeline would show a stage
 * somebody has already moved on from, and this page exists to be read before the day's
 * calls.
 */

export const dynamic = "force-dynamic";

export default async function OwnersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSession();
  const params = await searchParams;
  const active: Record<string, string> = {};
  for (const { key } of OWNER.filters ?? []) {
    const value = params[key];
    if (typeof value === "string" && value) active[key] = value;
  }

  const problem = storeProblem();
  if (problem) return <Problem>{problem}</Problem>;

  let leads: OwnerLead[];
  try {
    leads = await readOwnerLeads();
  } catch (error) {
    return (
      <Problem>{error instanceof Error ? error.message : `Could not read ${OWNER.file}.`}</Problem>
    );
  }

  return (
    <RecordList
      spec={OWNER}
      rows={leads as unknown as Record<string, string>[]}
      pathFor={adminOwnerPath}
      active={active}
      blurb="Work next_action_date daily. A lead with no next action and no date is a lead you have dropped."
    />
  );
}
