import { requireSession } from "@/lib/admin/guard";
import { Problem } from "@/components/admin/problem";
import { RecordList } from "@/components/admin/record-list";
import { adminPropertyPath } from "@/lib/admin/routes";
import { PROPERTY } from "@/lib/admin/records";
import { readProperties, storeProblem } from "@/lib/admin/store";
import type { PoolProperty } from "@/lib/admin/types";

/**
 * The property pool: every row of property-pool.csv.
 *
 * These are properties AgentSiam does not manage, found while sourcing for renter leads and
 * kept after a lead closes, so the next renter starts from what is already known.
 */

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  await requireSession();

  const problem = storeProblem();
  if (problem) return <Problem>{problem}</Problem>;

  let properties: PoolProperty[];
  try {
    properties = await readProperties();
  } catch (error) {
    return (
      <Problem>
        {error instanceof Error ? error.message : `Could not read ${PROPERTY.file}.`}
      </Problem>
    );
  }

  return (
    <RecordList
      spec={PROPERTY}
      rows={properties as unknown as Record<string, string>[]}
      pathFor={adminPropertyPath}
      blurb="Kept after a lead closes, so the next renter lead starts from what we already know."
    />
  );
}
