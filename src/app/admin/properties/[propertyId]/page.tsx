import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/guard";
import { Problem } from "@/components/admin/problem";
import { RowForm } from "@/components/admin/row-form";
import { ADMIN_PROPERTIES, adminLeadPath, NEW_RECORD } from "@/lib/admin/routes";
import { PROPERTY } from "@/lib/admin/records";
import { PROPERTY_ID, readProperty, storeProblem } from "@/lib/admin/store";
import { emptyPoolProperty, offeredTo } from "@/lib/admin/types";

/** One pool property. `offered_to` is shown and not edited: it is written when the property
 * is put to a renter lead, on the shortlist rather than here. */

export const dynamic = "force-dynamic";

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  await requireSession();
  const { propertyId } = await params;

  const isNew = propertyId === NEW_RECORD;
  if (!isNew && !PROPERTY_ID.test(propertyId)) notFound();

  const problem = storeProblem();
  if (problem) return <Problem>{problem}</Problem>;

  let values = emptyPoolProperty();
  if (!isNew) {
    const property = await readProperty(propertyId);
    if (!property) notFound();
    values = property;
  }

  const offered = offeredTo(values.offered_to);

  return (
    <>
      <h1
        className="text-xl font-semibold text-text"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        {isNew ? "New property" : `${values.property_id} ${values.name}`}
      </h1>

      {offered.length > 0 ? (
        <p className="mt-2 text-sm text-muted">
          Offered to{" "}
          {offered.map((leadId, index) => (
            <span key={leadId}>
              {index > 0 ? ", " : ""}
              <Link href={adminLeadPath(leadId)} className="text-primary hover:underline">
                {leadId}
              </Link>
            </span>
          ))}
          . That column is written when a property is put to a lead, on the shortlist.
        </p>
      ) : null}

      <RowForm
        spec={PROPERTY}
        values={values as unknown as Record<string, string>}
        isNew={isNew}
        backTo={ADMIN_PROPERTIES}
        newRowBase={ADMIN_PROPERTIES}
      />
    </>
  );
}
