import Link from "next/link";
import { CleaningMove, CleaningUndoMove, type Candidate } from "@/components/admin/cleaning-move";
import { englishLine } from "@/lib/cleaning/english";
import { CleaningPerson, type DeviceRow } from "@/components/admin/cleaning-person";
import { requireSession } from "@/lib/admin/guard";
import { acceptState } from "@/lib/cleaning/accept";
import { readAssignments } from "@/lib/cleaning/assign";
import {
  accessFor,
  parseDocument,
  propertyOf,
  todayInBangkok,
  visitSlug,
  type TeamDocument,
  type Visit,
} from "@/lib/cleaning/document";
import { ADMIN_CLEANING, adminCleaningPersonPath } from "@/lib/cleaning/routes";
import { knownPeople, listDevices, pinSetAt } from "@/lib/cleaning/devices";
import { readNote, storeDescription, storeProblem } from "@/lib/cleaning/store";

/**
 * Paul's one screen for the cleaning app: three people, their enrolled phones with a name
 * and a delete on each, a PIN each and a fresh enrolment link.
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
  // **This screen reads the published documents and not the merged schedules**, because it is
  // the one place that has to show what the skill said before anybody moved anything.
  const documents = new Map<string, TeamDocument | null>();
  const declined = new Map<string, Map<string, string>>();
  const today = todayInBangkok();
  for (const person of people) {
    // readNote rather than a bare key read, because the local fixture keeps the documents
    // in the file CLEANING_LOCAL_PATH names and not in the state beside it.
    const document = parseDocument(await readNote(person).catch(() => null));
    documents.set(person, document);
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
    declined.set(person, declinedAt);
  }

  const moves = await readAssignments().catch(() => new Map());
  /** Who could take this clean: anybody else with a schedule of her own to merge it into,
   * and whether her own document carries the codes for that house. */
  // **The person who turned it down is in the list.** Paul, 19/11/2026: it does not have to go
  // to somebody else, and picking her own name asks her again rather than moving anything.
  const candidatesFor = (owner: string, visit: Visit): Candidate[] =>
    people
      .filter((one) => documents.get(one))
      .map((one) => ({
        person: one,
        role: (documents.get(one) as TeamDocument).role,
        // Her own code for that house, not merely a block: a cleaner with no slot on the
        // lock still carries the property's gate, and those two read the same from here.
        hasCodes: accessFor(documents.get(one) as TeamDocument, visit.property)?.ownCode === true,
        self: one === owner,
      }))
      .sort((a, b) => Number(b.self) - Number(a.self));

  // Every clean somebody has turned down and nobody has picked up, in the order they happen.
  // Past ones are left out: a clean last week that was declined is a fact about last week and
  // there is nothing left to reassign.
  const turnedDown: Array<{
    person: string;
    slug: string;
    line: string;
    date: string;
    house: string | null;
    at: string;
    candidates: Candidate[];
  }> = [];
  // And every clean he has already moved, so that a move can be read back and undone.
  const moved: Array<{
    from: string;
    to: string;
    slug: string;
    line: string;
    date: string;
    house: string | null;
    at: string;
  }> = [];
  for (const person of people) {
    const document = documents.get(person);
    if (!document) continue;
    const declinedAt = declined.get(person) ?? new Map<string, string>();
    for (const visit of document.visits) {
      if (visit.date < today) continue;
      const slug = visitSlug(visit);
      const house = propertyOf(document, visit)?.name ?? null;
      const move = moves.get(slug);
      // A move whose clean has changed since has lapsed, and the clean is back with the
      // person it was published to. The same rule as the accept record.
      if (move && move.line === visit.line) {
        moved.push({ from: person, to: move.to, slug, line: englishLine(visit), date: visit.date, house, at: move.at });
        continue;
      }
      const at = declinedAt.get(slug);
      if (!at) continue;
      turnedDown.push({
        person,
        slug,
        // **His screen, so the English line.** A published line is finished Thai with her name
        // inside it, and a clean he has moved to another day has no published line left worth
        // printing: it reads as the hour alone, which is what sent him here. This composes the
        // day and the hour from the ISO date, which is true of every clean whatever has
        // happened to it.
        line: englishLine(visit),
        date: visit.date,
        house,
        at,
        candidates: candidatesFor(person, visit),
      });
    }
  }
  turnedDown.sort((a, b) => a.date.localeCompare(b.date));
  moved.sort((a, b) => a.date.localeCompare(b.date));

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
            She has said she cannot do these and they are off her screens. Give one to another
            cleaner here and it is on her schedule at once, waiting for her to accept it. The
            cleaning-schedule skill still publishes it under the old name, so the LINE Note
            from the last run disagrees until you move it there too.
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
                <CleaningMove slug={one.slug} from={one.person} candidates={one.candidates} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {moved.length > 0 ? (
        <section className="mt-4 rounded-box border border-hairline bg-surface p-4">
          <h2 className="text-sm font-semibold text-text">Moved to somebody else</h2>
          <p className="mt-1 max-w-[60ch] text-xs text-muted">
            The cleaner named second has these now and the first one does not. The skill still
            publishes them under the old name, so this holds until you change the run; giving
            one back puts it where the skill says it belongs.
          </p>
          <ul className="mt-3 space-y-2">
            {moved.map((one) => (
              <li key={one.slug} className="rounded-box bg-bg p-3 text-sm">
                <p className="font-semibold text-text">{one.line}</p>
                <p className="mt-1 text-xs text-muted">
                  {one.date}
                  {one.house ? ` · ${one.house}` : ""} · {one.from} to{" "}
                  <Link href={adminCleaningPersonPath(one.to)} className="underline">
                    {one.to}
                  </Link>{" "}
                  on {one.at.slice(0, 16).replace("T", " ")}
                </p>
                <CleaningUndoMove slug={one.slug} to={one.to} />
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
        One row per person, from {storeDescription()}. An enrolment link is opened with her
        PIN, so set that first, and it then enrols every browser she opens it in for thirty
        days. A phone that opens the app in LINE and in its own browser is two rows, because
        the two keep separate cookies and only her own browser can hold the offline codes.
        Name them, or nothing on the row says which is which. Revoking one stops it opening
        the app and touches no lock.
      </p>
    </>
  );
}
