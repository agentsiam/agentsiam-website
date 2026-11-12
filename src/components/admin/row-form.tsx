"use client";

import { useState } from "react";
import { INPUT, Label } from "@/components/admin/fields";
import type { FieldSpec, RecordSpec } from "@/lib/admin/records";

/**
 * One form for every CRM row the admin edits: a renter lead, an owner lead, a pool
 * property.
 *
 * Driven by the record's field spec rather than written out three times, so a column added
 * to `records.ts` appears here and is accepted by the route in the same change. The spec is
 * plain data and crosses from the server component as such.
 *
 * Every rule is enforced in /api/admin/rows. This form shows what the row holds and what
 * the choices are; it does not decide what is allowed, so the two cannot drift.
 */

type Values = Record<string, string>;

function Field({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: string;
  onChange: (next: string) => void;
}) {
  const id = `field-${field.key}`;
  const common = { id, className: INPUT, value, required: field.required };

  return (
    <div className={field.wide ? "sm:col-span-2" : undefined}>
      <Label htmlFor={id} label={field.label} hint={field.hint} />
      {field.readOnly ? (
        <p className="mt-1 text-sm text-text">{value || "assigned on save"}</p>
      ) : field.kind === "textarea" ? (
        <textarea {...common} rows={4} onChange={(event) => onChange(event.target.value)} />
      ) : field.kind === "select" ? (
        <select {...common} onChange={(event) => onChange(event.target.value)}>
          <option value="">not set</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...common}
          type={field.kind === "date" ? "date" : "text"}
          inputMode={field.kind === "number" ? "numeric" : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}

export function RowForm({
  spec,
  values,
  body,
  isNew,
  backTo,
  newRowBase,
}: {
  spec: RecordSpec;
  values: Values;
  isNew: boolean;
  /** Where Cancel goes, and where a saved existing row returns to. */
  backTo: string;
  /** The prose below a client's frontmatter. Undefined for the records that have none. */
  body?: string;
  /** The path a newly added row lives under, so the save can land on it once the store has
   * given it an id. A string rather than a function because this is a client component and
   * a function prop cannot cross that boundary; passing one renders a 500 rather than a
   * type error, which is how this was found. */
  newRowBase: string;
}) {
  const [form, setForm] = useState<Values>(values);
  const [historyEntry, setHistoryEntry] = useState("");
  const [prose, setProse] = useState(body ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const hasHistory = spec.kind === "owner";
  const hasBody = spec.kind === "client" && body !== undefined;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: spec.kind,
          id: isNew ? undefined : form[spec.idColumn],
          changes: form,
          historyEntry: hasHistory ? historyEntry : undefined,
          body: hasBody && !isNew ? prose : undefined,
        }),
      });
      if (response.ok) {
        const body = (await response.json().catch(() => ({}))) as { id?: string };
        const id = body.id ?? form[spec.idColumn];
        window.location.assign(isNew ? `${newRowBase}/${id}` : backTo);
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "The save did not land.");
    } catch {
      setError("The save could not be sent. Check the connection and try again.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="mt-6 space-y-6">
      {error ? (
        <p className="rounded-panel border border-hairline bg-wash-red p-4 text-sm text-deep-red">
          {error}
        </p>
      ) : null}

      <section className="rounded-panel border border-hairline bg-bg p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {spec.fields.map((field) => (
            <Field
              key={field.key}
              field={field}
              value={form[field.key] ?? ""}
              onChange={(next) => setForm((current) => ({ ...current, [field.key]: next }))}
            />
          ))}
        </div>
      </section>

      {hasHistory && !isNew ? (
        <section className="rounded-panel border border-hairline bg-bg p-5">
          <Label
            htmlFor="history-entry"
            label="Add to history"
            hint="Dated and attributed on save, appended to the end. What they actually said, not a paraphrase."
          />
          <textarea
            id="history-entry"
            className={INPUT}
            rows={3}
            value={historyEntry}
            onChange={(event) => setHistoryEntry(event.target.value)}
          />
        </section>
      ) : null}

      {hasBody && !isNew ? (
        <section className="rounded-panel border border-hairline bg-bg p-5">
          <Label
            htmlFor="client-body"
            label="The record itself"
            hint="Contract terms, contact preferences, their goals, owner use, history. Markdown, as it is written in the file."
          />
          <textarea
            id="client-body"
            className={`${INPUT} font-mono`}
            rows={22}
            value={prose}
            onChange={(event) => setProse(event.target.value)}
          />
        </section>
      ) : null}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="rounded-box bg-ink px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50"
        >
          {busy ? "Saving" : isNew ? `Add ${spec.one}` : "Save"}
        </button>
        <a href={backTo} className="text-sm text-primary hover:underline">
          Cancel
        </a>
      </div>
    </form>
  );
}
