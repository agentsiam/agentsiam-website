import { CleaningPerson, type DeviceRow } from "@/components/admin/cleaning-person";
import { requireSession } from "@/lib/admin/guard";
import { ADMIN_CLEANING } from "@/lib/cleaning/routes";
import { knownPeople, listDevices, pinSetAt } from "@/lib/cleaning/devices";
import { readNote, storeDescription, storeProblem } from "@/lib/cleaning/store";

/**
 * Paul's one screen for the cleaning app: three people, their enrolled phones, a delete
 * each, a PIN each and a fresh enrolment link.
 *
 * Revoking a phone deletes its device record, which stops that cookie resolving on the next
 * request. **No door is reprogrammed**, which is what the brief asks for: per-person door
 * codes exist so that losing a phone costs one lock slot, and an app session is a second
 * thing that can be lost, so it needs its own way to be killed.
 *
 * Who exists comes from the store, not from a roster in this repository. The app holds no
 * roster at all: a person appears here because the schedule run published a document for
 * her, or because she has a phone enrolled. A second property or a fourth colleague
 * therefore needs nothing changed here.
 *
 * There is no door code and no schedule on this screen, deliberately. Both live in a
 * published document that only the phone it belongs to can open.
 */

export const dynamic = "force-dynamic";

export default async function AdminCleaningPage() {
  await requireSession(ADMIN_CLEANING);

  const problem = storeProblem();
  if (problem) {
    return (
      <div>
        <Heading />
        <p className="mt-4 rounded-box border border-hairline bg-wash-red p-4 text-sm text-deep-red">
          {problem}
        </p>
      </div>
    );
  }

  let people: string[] = [];
  let failure: string | null = null;
  try {
    people = await knownPeople();
  } catch (error) {
    failure = error instanceof Error ? error.message : "The store could not be read.";
  }

  const rows: Array<{
    person: string;
    devices: DeviceRow[];
    pinSetAt: string | null;
    hasDocument: boolean;
  }> = [];
  for (const person of people) {
    rows.push({
      person,
      devices: await listDevices(person),
      pinSetAt: await pinSetAt(person),
      // readNote rather than a bare key read, because the local fixture keeps the documents
      // in the file CLEANING_LOCAL_PATH names and not in the state beside it.
      hasDocument: Boolean(await readNote(person).catch(() => null)),
    });
  }

  return (
    <div>
      <Heading />
      {failure ? (
        <p className="mt-4 rounded-box border border-hairline bg-wash-red p-4 text-sm text-deep-red">
          {failure}
        </p>
      ) : null}
      {!failure && rows.length === 0 ? (
        <p className="mt-4 rounded-box border border-hairline bg-surface p-4 text-sm text-muted">
          Nothing is published yet, so there is nobody to enrol. The cleaning-schedule skill
          publishes a document per person on every run; until it has, this screen has no rows.
        </p>
      ) : null}
      {rows.map((row) => (
        <CleaningPerson
          key={row.person}
          person={row.person}
          devices={row.devices}
          pinSetAt={row.pinSetAt}
          hasDocument={row.hasDocument}
        />
      ))}
    </div>
  );
}

function Heading() {
  return (
    <>
      <h1
        className="text-xl font-semibold text-text"
        style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
      >
        Cleaning team phones
      </h1>
      <p className="mt-2 max-w-[60ch] text-sm text-muted">
        One row per person, from {storeDescription()}. An enrolment link works once, on the
        first phone that opens it. Revoking a phone stops it opening the app and touches no
        lock. There is no recovery flow: a lost phone is re-enrolled with a new link.
      </p>
    </>
  );
}
