import Link from "next/link";
import { CleaningPerson, type DeviceRow } from "@/components/admin/cleaning-person";
import { requireSession } from "@/lib/admin/guard";
import { acceptState } from "@/lib/cleaning/accept";
import { parseDocument, propertyOf, todayInBangkok, visitSlug } from "@/lib/cleaning/document";
import { ADMIN_CLEANING, adminCleaningPersonPath } from "@/lib/cleaning/routes";
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
 *
 * **The one exception is a clean somebody turned down.** Paul, 18/11/2026: a clean she has
 * rejected should not be on her schedule, and it should come back here for him to give to
 * somebody else. It is off her screens entirely from that moment, so this is the only place
 * it exists, and a block nobody notices would be a clean nobody does. It stands above the
 * people for that reason, in red, and it clears itself when the next run of the
 * `cleaning-schedule` skill gives that clean to another person or moves it.
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
  // Every clean somebody has turned down and nobody has picked up, in the order they happen.
  // Past ones are left out: a clean last week that was declined is a fact about last week and
  // there is nothing left to reassign.
  const turnedDown: Array<{
    person: string;
    line: string;
    date: string;
    house: string | null;
    at: string;
  }> = [];
  const today = todayInBangkok();
  for (const person of people) {
    // readNote rather than a bare key read, because the local fixture keeps the documents
    // in the file CLEANING_LOCAL_PATH names and not in the state beside it.
    const document = parseDocument(await readNote(person).catch(() => null));
    rows.push({
      person,
      devices: await listDevices(person),
      pinSetAt: await pinSetAt(person),
      hasDocument: Boolean(document),
    });
    if (!document) continue;
    const { declinedAt } = await acceptState(person, document.visits).catch(() => ({
      declinedAt: new Map<string, string>(),
    }));
    for (const visit of document.visits) {
      const at = declinedAt.get(visitSlug(visit));
      if (!at || visit.date < today) continue;
      turnedDown.push({
        person,
        line: visit.line,
        date: visit.date,
        house: propertyOf(document, visit)?.name ?? null,
        at,
      });
    }
  }
  turnedDown.sort((a, b) => a.date.localeCompare(b.date));

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
      {turnedDown.length > 0 ? (
        <section className="mt-4 rounded-box border border-deep-red/30 bg-wash-red p-4">
          <h2 className="text-sm font-semibold text-deep-red">
            Turned down, waiting for you to reassign
          </h2>
          <p className="mt-1 max-w-[60ch] text-xs text-deep-red">
            She has said she cannot do these and they are off her screens. Nothing here moves
            work: give the clean to somebody else in the cleaning-schedule skill and re-run it,
            and this clears on the next publish.
          </p>
          <ul className="mt-3 space-y-2">
            {turnedDown.map((one) => (
              <li
                key={`${one.person}-${one.date}-${one.line}`}
                className="rounded-box bg-bg p-3 text-sm"
              >
                <p className="font-semibold text-text">{one.line}</p>
                <p className="mt-1 text-xs text-muted">
                  {one.date}
                  {one.house ? ` · ${one.house}` : ""} · declined by{" "}
                  <Link href={adminCleaningPersonPath(one.person)} className="underline">
                    {one.person}
                  </Link>{" "}
                  on {one.at.slice(0, 16).replace("T", " ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
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
