"use client";

import { useState } from "react";
import { adminLeadPath } from "@/lib/admin/routes";
import {
  CANDIDATE_STATUSES,
  CONTACT_CHANNELS,
  LICENCES,
  POOL_KINDS,
  WALKABLE,
  YES_NO_UNKNOWN,
  missingForReady,
  type Candidate,
} from "@/lib/admin/types";

/**
 * The candidate form.
 *
 * Every rule that matters is enforced on the server, in /api/admin/candidates: the blocked
 * operators, the fixed-choice values, and whether a candidate is complete enough to carry
 * a status that says it can go to a guest. This form's job is to show the answer in the
 * place where it was typed. It deliberately does not pre-empt the blocked check, because a
 * refusal that comes from the one place that owns the list cannot drift from it.
 *
 * Photo links are a textarea, one per line. A repeating field set would be tidier and
 * slower to use, and these arrive as a block pasted out of a chat.
 */

type Field = { label: string; hint?: string };

function Label({ htmlFor, label, hint }: { htmlFor: string } & Field) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="block text-xs font-semibold text-muted">{label}</span>
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

const INPUT =
  "mt-1 w-full rounded-box border border-border bg-bg px-3 py-2 text-sm text-text";

export function CandidateForm({
  leadId,
  candidate,
  isNew,
}: {
  leadId: string;
  candidate: Candidate;
  isNew: boolean;
}) {
  const [form, setForm] = useState<Candidate>(candidate);
  const [photos, setPhotos] = useState(candidate.photo_links.join("\n"));
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof Candidate>(key: K, value: Candidate[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const photoLinks = photos
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const missing = missingForReady({ ...form, photo_links: photoLinks });

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setBlocked(false);

    try {
      const response = await fetch("/api/admin/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          candidate: { ...form, photo_links: photoLinks },
        }),
      });
      if (response.ok) {
        window.location.assign(adminLeadPath(leadId));
        return;
      }
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        blocked?: boolean;
      };
      setError(body.error ?? "The save did not land.");
      setBlocked(Boolean(body.blocked));
    } catch {
      setError("The save could not be sent. Check the connection and try again.");
    }
    setBusy(false);
  }

  async function remove() {
    if (!window.confirm(`Remove ${form.property_name || form.id} from this shortlist?`)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/candidates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, id: form.id }),
      });
      if (response.ok) {
        window.location.assign(adminLeadPath(leadId));
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "The removal did not land.");
    } catch {
      setError("The removal could not be sent.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="mt-6 space-y-6">
      {error ? (
        <p
          className={`rounded-panel border border-hairline p-4 text-sm ${
            blocked ? "bg-wash-red font-semibold text-deep-red" : "bg-wash-red text-deep-red"
          }`}
        >
          {error}
        </p>
      ) : null}

      <section className="rounded-panel border border-hairline bg-bg p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="property_name" label="Property name" />
            <input
              id="property_name"
              className={INPUT}
              value={form.property_name}
              onChange={(event) => set("property_name", event.target.value)}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="source_link" label="Source link" hint="Where we found it" />
            <input
              id="source_link"
              className={INPUT}
              value={form.source_link}
              onChange={(event) => set("source_link", event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="contact_channel" label="Owner or manager channel" />
            <select
              id="contact_channel"
              className={INPUT}
              value={form.contact_channel}
              onChange={(event) => set("contact_channel", event.target.value)}
            >
              <option value="">not recorded</option>
              {CONTACT_CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="contact_handle" label="Handle on that channel" />
            <input
              id="contact_handle"
              className={INPUT}
              value={form.contact_handle}
              onChange={(event) => set("contact_handle", event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="area" label="Area" />
            <input
              id="area"
              className={INPUT}
              value={form.area}
              onChange={(event) => set("area", event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="map_link" label="Map link" />
            <input
              id="map_link"
              className={INPUT}
              value={form.map_link}
              onChange={(event) => set("map_link", event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="bedrooms" label="Bedrooms" />
            <input
              id="bedrooms"
              className={INPUT}
              value={form.bedrooms}
              onChange={(event) => set("bedrooms", event.target.value)}
            />
          </div>

          <div>
            <Label
              htmlFor="bed_set_up"
              label="Bed set-up"
              hint="Plainly: two singles, king, twin beds"
            />
            <input
              id="bed_set_up"
              className={INPUT}
              value={form.bed_set_up}
              onChange={(event) => set("bed_set_up", event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="pool" label="Pool" />
            <select
              id="pool"
              className={INPUT}
              value={form.pool}
              onChange={(event) => set("pool", event.target.value)}
            >
              <option value="">not recorded</option>
              {POOL_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="walkable" label="Walkable to shops and cafés" />
            <select
              id="walkable"
              className={INPUT}
              value={form.walkable}
              onChange={(event) => set("walkable", event.target.value)}
            >
              <option value="">not recorded</option>
              {WALKABLE.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          {form.walkable === "no" ? (
            <div className="sm:col-span-2">
              <Label
                htmlFor="transport_if_not_walkable"
                label="Transport offered instead"
                hint="A free shuttle, or what it costs both ways"
              />
              <input
                id="transport_if_not_walkable"
                className={INPUT}
                value={form.transport_if_not_walkable}
                onChange={(event) => set("transport_if_not_walkable", event.target.value)}
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-panel border border-hairline bg-bg p-5">
        <h2 className="text-sm font-semibold text-text">
          The four answers a candidate needs before it can be sent
        </h2>
        <p className="mt-1 text-xs text-muted">
          {missing.length === 0
            ? "All four are in. This one is complete enough to send."
            : `Still missing: ${missing.join(", ")}.`}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="available" label="Available for the exact dates" />
            <select
              id="available"
              className={INPUT}
              value={form.available}
              onChange={(event) => set("available", event.target.value)}
            >
              {YES_NO_UNKNOWN.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label
              htmlFor="availability_confirmed_on"
              label="Date the owner confirmed that"
            />
            <input
              id="availability_confirmed_on"
              type="date"
              className={INPUT}
              value={form.availability_confirmed_on}
              onChange={(event) => set("availability_confirmed_on", event.target.value)}
            />
          </div>

          <div>
            <Label
              htmlFor="total_price_thb"
              label="Total price for the exact dates, in baht"
            />
            <input
              id="total_price_thb"
              type="number"
              min={0}
              step={1}
              className={INPUT}
              value={form.total_price_thb === null ? "" : String(form.total_price_thb)}
              onChange={(event) =>
                set(
                  "total_price_thb",
                  event.target.value === "" ? null : Number(event.target.value),
                )
              }
            />
          </div>

          <div>
            <Label
              htmlFor="price_includes_everything"
              label="Does that include every charge"
            />
            <select
              id="price_includes_everything"
              className={INPUT}
              value={form.price_includes_everything}
              onChange={(event) => set("price_includes_everything", event.target.value)}
            >
              {YES_NO_UNKNOWN.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="licence" label="Short-stay licence" />
            <select
              id="licence"
              className={INPUT}
              value={form.licence}
              onChange={(event) => set("licence", event.target.value)}
            >
              {LICENCES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="photo_links" label="Photos" hint="One link a line" />
            <textarea
              id="photo_links"
              rows={4}
              className={INPUT}
              value={photos}
              onChange={(event) => setPhotos(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-panel border border-hairline bg-bg p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="status" label="Status" />
            <select
              id="status"
              className={INPUT}
              value={form.status}
              onChange={(event) => set("status", event.target.value as Candidate["status"])}
            >
              {CANDIDATE_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          {form.status === "rejected" ? (
            <div>
              <Label htmlFor="rejected_reason" label="Why it was rejected" />
              <input
                id="rejected_reason"
                className={INPUT}
                value={form.rejected_reason}
                onChange={(event) => set("rejected_reason", event.target.value)}
                required
              />
            </div>
          ) : null}

          <div className="sm:col-span-2">
            <Label htmlFor="notes" label="Notes" />
            <textarea
              id="notes"
              rows={5}
              className={INPUT}
              value={form.notes}
              onChange={(event) => set("notes", event.target.value)}
            />
          </div>
        </div>

        {!isNew ? (
          <p className="mt-4 text-xs text-muted">
            Added by {form.added_by || "nobody recorded"} on {form.added_on || "no date"}. Last
            changed by {form.updated_by || "nobody recorded"} on {form.updated_on || "no date"}.
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="rounded-box bg-ink px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50"
        >
          {busy ? "Saving" : "Save"}
        </button>
        <a href={adminLeadPath(leadId)} className="text-sm text-primary hover:underline">
          Back to the shortlist
        </a>
        {!isNew ? (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="ml-auto text-sm text-deep-red hover:underline disabled:opacity-50"
          >
            Remove from the shortlist
          </button>
        ) : null}
      </div>
    </form>
  );
}
