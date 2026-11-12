import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/guard";
import { Problem } from "@/components/admin/problem";
import { RowForm } from "@/components/admin/row-form";
import { ADMIN_CLIENTS, NEW_RECORD } from "@/lib/admin/routes";
import { CLIENT } from "@/lib/admin/records";
import { CLIENT_ID, readClient, storeProblem } from "@/lib/admin/store";

/**
 * One client: the frontmatter as a form, the record itself as the markdown it is.
 *
 * The prose is edited as prose rather than broken into fields. Its headings are the
 * template's and a person will add to them in ways no form could anticipate, which is the
 * point of keeping a client as a document.
 *
 * A new client is started from `_template.md`, as the registry's README says to do it, so
 * the headings and the guidance arrive with it. The index table in that README is not
 * updated here: it is a judgement about what belongs in a summary, and it stays a person's.
 */

export const dynamic = "force-dynamic";

export default async function ClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  await requireSession();
  const { clientId } = await params;

  const isNew = clientId === NEW_RECORD;
  if (!isNew && !CLIENT_ID.test(clientId)) notFound();

  const problem = storeProblem();
  if (problem) return <Problem>{problem}</Problem>;

  let values: Record<string, string> = { client_id: "" };
  let body = "";
  if (!isNew) {
    const client = await readClient(clientId);
    if (!client) notFound();
    values = { ...client.values, client_id: client.client_id };
    body = client.body;
  }

  return (
    <>
      <h1
        className="text-xl font-semibold text-text"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        {isNew ? "New client" : `${values.client_id} ${values.name ?? ""}`}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isNew
          ? "Started from _template.md, so the headings and the guidance come with it. Add the client to the index table in the registry README by hand."
          : `${CLIENT.file}. Properties live in as-operations; the list below is their Beds24 IDs.`}
      </p>

      <RowForm
        spec={CLIENT}
        values={values}
        body={isNew ? undefined : body}
        isNew={isNew}
        backTo={ADMIN_CLIENTS}
        newRowBase={ADMIN_CLIENTS}
      />
    </>
  );
}
