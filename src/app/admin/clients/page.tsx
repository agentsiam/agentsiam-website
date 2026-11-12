import { requireSession } from "@/lib/admin/guard";
import { Problem } from "@/components/admin/problem";
import { RecordList } from "@/components/admin/record-list";
import { adminClientPath } from "@/lib/admin/routes";
import { CLIENT } from "@/lib/admin/records";
import { readClients, storeProblem, type ClientRecord } from "@/lib/admin/store";

/**
 * The client registry: every signed owner.
 *
 * One markdown file each rather than a row in a table, because what matters about a client
 * is mostly prose: what was negotiated away from the standard, how they take bad news, what
 * happened and when. The frontmatter is the part that fits in a list.
 */

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  await requireSession();

  const problem = storeProblem();
  if (problem) return <Problem>{problem}</Problem>;

  let clients: ClientRecord[];
  try {
    clients = await readClients();
  } catch (error) {
    return (
      <Problem>{error instanceof Error ? error.message : `Could not read ${CLIENT.file}.`}</Problem>
    );
  }

  return (
    <RecordList
      spec={CLIENT}
      rows={clients.map((client) => ({ ...client.values, client_id: client.client_id }))}
      pathFor={adminClientPath}
      blurb="A record is created only when a lead converts. Properties live in as-operations; this lists their Beds24 IDs."
    />
  );
}
