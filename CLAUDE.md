# CLAUDE.md: agentsiam-website

agentsiam.com. The Next.js application, its copy in three languages, and the scripts that build
them. Not the document store: strategy, playbooks, property records and prices live in
`/Users/paulb/code/agentsiam/agentsiam-consulting`, and Beds24 is the system of record for
availability, rates and bookings.

`README.md` is orientation. This file is what to do.

Rule IDs R1 upward are stable and are cited from elsewhere in this repo. A retired rule keeps its
number and is marked RETIRED. Numbers are never reused. Core rules C1 to C48 live in the core block
at the foot of this file and are identical in every repo.

No rule is marked LAW here. No rule carries the date it was added; provenance lives in the commit
message and the incident behind a rule lives in section 7. Live state never lives in this file
(C35): `README.md` section "Known gaps" is the live record, and section 1 points at it.

`AGENTS.md` is the import, and this is the authored file. The direction is that way round because a
Next.js scaffold run owns `AGENTS.md` and will overwrite it; see section 7.

This file is rules. `README.md` and the two runbooks are navigation and procedure for humans. Do not
duplicate one into the other.

---

## 1. Read before answering

| File | Holds | Convention |
|---|---|---|
| `README.md`, "Known gaps" | What is unbuilt, unreviewed or deliberately held back right now | The live record. A struck item is resolved and dated; an unstruck one is open |
| `src/i18n/dictionaries/en.ts` | All 296 keys and the `Dictionary` type the other two locales are checked against | Add a key here first, or `th.ts` and `zh.ts` stop compiling |
| `node_modules/next/dist/docs/` | This Next version's real APIs, conventions and file structure | Vendored with the install, so it moves when the dependency does |

**Never answer from memory, from this file, or from `README.md`'s prose. Open the file.**

## 2. Map and ownership

| Folder | Holds | Test | Write access |
|---|---|---|---|
| `src/` | The application, its copy and its photos | Does it ship to a browser? | Free |
| `scripts/` | Build steps and one-off node scripts | Does it run at build time or by hand from an npm script? | Free |
| `public/` | Static assets served unchanged | Is it fetched by URL exactly as it sits on disk? | Free |
| `design_handoff_agentsiam_portal/` | The original design handoff as it arrived, and what the build is measured against | Did it come from the designer rather than from us? | Owner-approved only (C32) |
| `_to_delete/` | Superseded material on its way out, and lock files a sandbox cannot delete | Is it going, rather than staying? | Gitignored. Paul empties it |

| Question | Owner |
|---|---|
| How the three languages work, and which URL each locale gets | `README.md`, "How the three languages work" |
| What the booking flow does, and in what order | `README.md`, "Booking" and "The ordering is the design" |
| How photography is selected, ordered and re-encoded | `README.md`, "Photography" |
| Which DNS and mail records exist, and which must never be touched | `DNS-EMAIL-RUNBOOK.md` |
| What runs on a schedule in production | `vercel.json` |
| What is unbuilt or unreviewed right now | `README.md`, "Known gaps" |

Two files are **GENERATED** and are never hand-edited (R5): `src/lib/photos.generated.ts` from
`src/photos/` via `npm run photos`, and `src/lib/guide.generated.ts` from the guide sheet via
`npm run guide`. Edit the source and rerun the script.

`src/photos/` and `public/` are binary-heavy. Do not glob them.

## 3. Sources of truth

Every value below is written in exactly one place. This is what C20 points at.

| Value | Lives in | Notes |
|---|---|---|
| Every translatable string, three languages | `src/i18n/dictionaries/en.ts`, `th.ts`, `zh.ts` | `en.ts` is the source and exports the type |
| Locales, paths and hreflang | `src/i18n/config.ts` | en is the bare path, th is `/th`, zh is `/zh` Simplified |
| The site's own URL | `src/lib/site.ts` | See the trap in section 7 |
| The photo manifest | `src/lib/photos.generated.ts` | GENERATED from `src/photos/` |
| The guide library | `src/lib/guide.generated.ts` | GENERATED from the guide sheet |
| Scheduled jobs in production | `vercel.json` | |
| DNS and mail records | The live zone, read on the day | Never this repo. `DNS-EMAIL-RUNBOOK.md` says why |
| Availability, rates, bookings, guest messages | Beds24 | Never a file here |
| Brand voice, design system, guest-facing copy rules | `/Users/paulb/code/agentsiam/agentsiam-consulting/as-context/06-design-system/`, and `guest-copy-standard.md` inside it | Another repo. If it is not mounted, say so and stop rather than guessing (C47) |
| Service prices and the offering | `/Users/paulb/code/agentsiam/agentsiam-consulting/as-context/00-company/price-book.md` and `service-model.md` | Another repo, same rule |

## 4. Where a new file goes

**Ask what the file is for at runtime.** Shipped to a browser goes under `src/`; run at build time or
by hand goes in `scripts/`; served byte-for-byte at a URL goes in `public/`. Nothing new goes at the
repo root except a config file a tool requires there by name.

Naming follows the surrounding directory: kebab-case for routes and assets, camelCase for dictionary
keys, and a dictionary key is semantic (`heroTitleA`) rather than the English text. Dates in
filenames are ISO so they sort (C28).

`_to_delete/` is at the repo root and **gitignored**, so content there is gone once Paul empties it.
Anything worth recovering is a commit, not a parked file: git history is this repo's archive.

**Working notes do not belong in this repository.** Session summaries, state-of-play documents,
reviews and scratch analysis: extract what matters into the file that owns it and keep the working
file outside. A copy review is generated into `as-work/` in the consulting repo, not here.

## 5. Repo-specific hard constraints

**R1.** Read the relevant guide in `node_modules/next/dist/docs/` before writing code. This Next
version's APIs, conventions and file structure may all differ from what you remember.

**R2.** Heed deprecation notices in that documentation rather than working around them.

**R3.** Hold the nights, then charge. Never the other way round. A guest whose browser dies between
paying and the redirect must still get their stay.

**R4.** Beds24 is never named in the front end, and no Beds24 payment gateway is involved.

**R5.** Never hand-edit a GENERATED file. Edit its source and rerun its script, per section 2.

**R6.** MX records are never proxied, and the DKIM record is DNS only.

**R7.** Never report a build as passing or failing from a sandbox run. `next build` fails in the
Cowork Linux VM on the missing linux/arm64 SWC binary, which reads like a code failure and is not.
`npx tsc --noEmit` and `npx eslint` are pure JS and their results there are real.

**R8.** Never leave a dictionary string blank to mean "not translated yet". `src/i18n/index.ts`
falls back per key to English, so a blank silently ships English rather than failing. A missing key
does fail, because `en.ts` exports the type the other two are checked against.

**R9.** A copy pass across the three languages is one scripted patch, never string by string.
Generate the side-by-side review, validate every `current` against the live dictionaries, patch all
three in one pass, then `npm run typecheck`.

**R10.** Published product and marketing copy in English, Thai and Chinese is exempt from the core
dash ban (C29). Everywhere else in this repo, and in anything written to Paul, the ban holds. This
is the same exemption as R21 in `/Users/paulb/code/agentsiam/agentsiam-consulting`, stated here
because C29 requires each repo to state its own.

## 6. Tooling and commands

- `npm run dev`, which runs `npm run photos` first via `predev`.
- `npm run build`, which runs `scripts/check-cron.mjs` and `npm run photos` first via `prebuild`.
  On Paul's Mac only, see R7.
- `npm run typecheck` and `npm run lint`. Both valid from a sandbox.
- `npm run photos` and `npm run guide`.
- Absolute path for any Terminal block (C8): `/Users/paulb/code/agentsiam/agentsiam-website`.

## 7. Traps

- `AGENTS.md` was a single generated block fenced by `BEGIN:nextjs-agent-rules` and
  `END:nextjs-agent-rules`, so anything written inside it was one scaffold run from being destroyed.
  It is now the import and this file is authored. **If the fence reappears, re-reduce `AGENTS.md` to
  the import and re-absorb whatever the generator added into this file. Never hand-edit inside the
  fence.**
- `next build` in the Cowork VM fails with "Failed to load SWC binary for linux/arm64", because
  `node_modules` was installed on macOS and the VM has no network to fetch the Linux binary. It
  looks like a code failure in the log. Do not start debugging the change that was just made.
- A blank dictionary string ships English and nobody notices, because the per-key fallback is
  working exactly as designed.
- `src/lib/site.ts` uses `??` for `NEXT_PUBLIC_SITE_URL`, so an **empty** value in `.env` kills the
  build with `ERR_INVALID_URL` while an unset one is fine.
- The local guide's neighbourhood filter chips render `AREAS[].name` from `src/lib/areas.ts`, which
  is English only, so they stay English on every locale. Its category and tag labels are localised
  correctly, so only half that page's chips are affected. Not a copy bug, and still open.
- `not-found.tsx` renders **client-side only in production**. `next dev` server-renders it,
  `next start` does not: `/nope` returns a 404 with the full page under JavaScript and an
  empty `<body>` without it. Every real page server-renders correctly, so a blank 404 is not
  evidence that SSR is broken site-wide. `export const dynamic` on the catch-all does not
  change it; it was tried and reverted. See `README.md`, "Known gaps".
- `min-h-[66px]` on the header is a **minimum**, not the height. Below 560px the header wraps
  and stands at 93px, and the sticky filter bar on `/properties` was pinned at `top-[66px]`,
  so the header sliced the bar's own controls in half on every phone. The height is now
  published as `--nav-h` in `globals.css` and read by the bar. If the header gains a row,
  that variable is what changes, not a number in a component.
- `next build` cannot run without reaching Google Fonts. `next/font/google` fetches at build
  time, so an offline or firewalled machine fails with "Failed to fetch `Poppins`" and a
  module-not-found trace that looks like a code error. `NEXT_FONT_GOOGLE_MOCKED_RESPONSES`
  exists but is not honoured by Turbopack's font pipeline. The way to build offline is to
  swap the six `next/font/google` calls in `layout.tsx` for `next/font/local` against real
  `.woff2` files, build, and swap back; `localFont` needs literal object arguments, so a
  helper function that builds the `src` array fails to compile.
- A blank dictionary string ships English and nobody notices, because the per-key fallback is
  working exactly as designed. `scripts/add-dictionary-keys.mjs` will happily write one if a
  spec file carries `""`; `en.ts` is where that does the most damage, since it is the
  fallback everything else falls through to.
- `t[key]` on data outside the dictionaries is the recurring i18n bug on this site, not
  missing keys. Three separate rounds of it have been found: property facts, house rules and
  the tagline in `property.ts`; the whole of `/how-it-works` in module-scope arrays; team
  roles in `team.ts`. Anything a page prints that a reader can read belongs in the
  dictionaries, including strings that live in a `lib/` array because they felt like data.
- Editing the dictionaries string by string during a review is how the register split gets broken:
  owner strings take ท่าน, guest strings take คุณ, and swapping them costs more credibility than a
  clumsy sentence.

## 8. Cadence

Answer the question in front of you and touch only the files it needs. Run `npm run typecheck`
before handing back anything that touched the dictionaries or a type. The one moment a full pass
runs is a copy review across all three languages, per R9.

---
<!-- CLAUDE-CORE:BEGIN. Synced from /Users/paulb/Documents/LTD OS/_standards/CLAUDE-core.md; the Version line inside the block says which core this is. Do not edit here. -->

# CLAUDE core rules

Version 3.9. This line is bumped on every edit to this file, no exceptions, and it travels inside
every pasted block, so any repo's copy says which core it came from. Byte-identity against the
canonical file is verified by diffing the pasted block against
`/Users/paulb/Documents/LTD OS/_standards/CLAUDE-core.md` directly; no hash is needed.

Identical in every one of Paul's repositories. Do not edit this block inside a repo. Edit the
canonical copy and re-sync, so the same rule cannot say two things in two places.

Rule IDs are stable, currently C1 to C48. A new rule takes the next free number and sits in the
section it belongs to, so numbers are unique but not strictly ordered within a section. A retired
rule keeps its number and is marked RETIRED. Numbers are never reused. Repo-specific rules are
numbered R1 upward in the repo's own file and never collide with these.

Every rule below reads as current and final. No rule carries the date it was added. Provenance
lives in the commit message; the incident that caused a rule lives in the repo's Traps section.

## Working with Paul

**C1. Lead with the answer.** A direct question gets its answer in the first line: yes, no, a name,
a number. Reasoning, corrections and next steps come after, and only if they change what he does.
A correct answer buried under context reads as no answer.

**C2. Keep the reply short, put the detail in a file.** Long replies he cannot follow are a failure,
not thoroughness. Write the reasoning to the repo's work area and give him the finding plus the
absolute path.

**C3. One decision at a time by default; batch only what is genuinely open together.** Ask him one
thing, wait, then the next. This applies to reviews and verification steps too. The exception: when
several decisions are genuinely open at once, list them all in one block at the end rather than
dripping them out, and say which ones block the others, because a decision he cannot see is a
decision he cannot make. Each item in the block still stands alone under C4. Never use the
exception to stack questions that are merely ready rather than open, and never reopen a topic he
has already steered. A downstream question that is genuinely unanswerable until an upstream one
settles is held back, not batched; one that is merely affected joins the block with its dependency
marked.

**C4. A question is a closed choice with a recommendation.** Never an open prompt, never "say the
word", never "let me know". Working out the option set is the job. The recommended option comes
first and is marked. Every question carries:

1. What is true now, in plain words, with no shorthand and no file path standing in for an
   explanation. Define any term he may not hold in his head.
2. Why it is a decision at all: what is in conflict, or what is unknown.
3. What each option changes in the world, not in the repo.
4. What it costs, including the cost of the recommended one.

Three more constraints on the options themselves. Only options worth choosing: every one listed
must be one you would be willing to carry out, no straw men, no padding an option to make the
recommendation look better. Ordered best first, always: 1a is the recommendation, 1b the runner-up,
and the order carries the argument. Recommending nothing is not neutrality, it is pushing the work
back up; if the evidence genuinely does not favour one, say so and say what would settle it. And if
the honest answer is that it is a lookup rather than a decision, look it up instead of dressing it
up as a choice. Three options is the normal shape, not a quota: where only two are defensible, give
two and say a third would be padding. A single question is still numbered Q1, and a marker is never
reused within one message.

The test is whether he could answer correctly having read nothing else and remembering nothing from
the last message. Six lines is fine if two will not do. Number the question Q1 and its options 1a,
1b, so he can reply "1a" or "skip". Put it at the END of the message. And where the answer becomes
record, the question says which document the answer lands in. A question about a document carries
that document's full absolute path and the section inside it, in the question block itself: he
usually answers from a phone or away from the repo, and cannot answer about a doc he cannot open. Where the repo keeps a standing
question queue, the split is routing, not preference: a decision that is his and can wait goes to
the queue; the in-reply block is for what blocks the work now.

**C44. Ask when his own wording carries two readings.** Where the difference is factual, ask rather
than picking the likelier reading and writing it as record. An invented fact is the one line a
recipient can catch as wrong.

**C5. Not every message needs a question.** Reserve C4 for things only he can decide. Small copy and
implementation calls he has already steered get made, stated in one line, and moved past. Repeated
numbered blocks on the same topic read as being challenged rather than helped.

**C6. Never send him back up the conversation, and never cite by number or code.** No "as above",
"see my earlier message", "scroll up". No "4c is done", no bare "action 76", no bare "v2". Name the
thing every time, in plain words, on every mention. He answers from a phone and does not scroll
back. Numbering restarts every message: it addresses the reply he is about to type and nothing more.
This covers documents as well as messages: a bare version number in a doc, "v2", "v5.0", names
nothing once the file travels, so name the thing first and the number after it, per the repo's own
version vocabulary where one exists.

**C7. Every file and folder named in chat carries its full absolute path**, starting `/Users/paulb/`.
Never `~`, never a repo-relative fragment, never a bare filename. Every mention, not only the first,
folders included. Inside repository files the existing repo-relative convention stays, so the record
survives being moved.

**C8. Terminal instructions are one fenced bash block, every line in order, starting with `cd` to the
absolute path in double quotes.** No `#` comments inside the block: zsh treats one as an argument and
an apostrophe hangs the shell. Explanation goes in the prose above the block, never inside it. Around
the block, three things: one line before it saying what it does and what it changes if it writes
anything; what success looks like, concretely enough to recognise; and what to do on failure, which
is normally "paste me the error". Anything past roughly thirty seconds gets a time estimate, so a
long silence is not mistaken for a hang. And say why it needs him at all: if it could have run in the
sandbox it should have, and if it could not, name the reason in a few words.

**C34. Blocked is not a status to sit in.** While a decision is open, do every part of the work that
does not depend on it, and say what was done. Never gate work on a decision that does not actually
gate it: an internal structure question rarely blocks a live defect from being fixed.

**C9. Do not explain his house rules back to him.** He wrote them. Apply them silently. A rule is
worth surfacing only when it conflicts with what he asked for.

**C10. Stay inside the project he is working in.** Do not pull his other ventures into the session or
offer to widen scope.

**C43. A `PB:` line in any file is a note from Paul to whoever reads the file next.** It can appear
anywhere in any file, including inside a generated one, and it is not a correction, a heading or
content. Read it, act on it, and do not treat its absence as approval or its presence as an edit to
apply verbatim. Tooling that regenerates a file must never silently destroy one.

## Drafting a message he will send

**C39. Answer the question that was asked, and stop.** A true finding that answers a different
question belongs in the repository, not in the reply. Adjacent material reads as padding and widens
the thread.

**C40. Never assert another party's scope.** What sits inside a partner's, a workstream's or a
colleague's remit is theirs to state. Put it back as a question instead: should this be out of
scope for them?

**C41. Where the answer is unknown, say so and stop.** The useful reply is the admission, the
single question that has to be answered, and who could answer it. Evidence for why it is unknown is
not an answer; stacking it opens questions rather than closing them.

## Not overwriting his work

Paul edits these files while a session is editing them. Work has been destroyed this way in more
than one repo.

**C38. One owner at a time, and say which.** Before editing a file he has worked on, say you are
taking it, and say when you hand it back. Two editors between saves is how work disappears.

**C11. Re-read the file from disk immediately before every write**, even one produced an hour ago.
Your own earlier draft is never the truth. Verify the byte count before and after.

**C12. If the file changed and you did not change it, STOP.** A blank that was empty now holding a
value, a table row now holding data, content that moved: re-read, diff against what you last saw,
and ask before writing anything. A whole-file write raises no conflict and no error, so nothing
warns you. Never explain an unexpected change away as another session's doing.

**C13. Targeted string replacement only.** No whole-file rewrite of a file that already exists, no
force overwrite, no regenerate-from-scratch. Edit in place, using the blank rows and spacers a
document already has rather than inserting rows. Generated files a repo names as such are the one
exception: they are never hand-edited, so edit the source and rerun the generator, which may
rewrite its output wholesale. A generated file nobody listed is treated as authored.

**C14. A deletion is a decision.** What he removed stays removed. When a document and its covering
note then disagree, change the note. Raise a recommendation twice at most; silence is acceptance.

**C15. Sections he fills are his.** Results, measurements, answers he types in. Ask before writing
into one, every time, even to fill an obviously missing number.

**C16. Never write to a file he has open.** A `~$` file beside it means Word or Excel holds a lock.
Say so and wait.

**C17. Preserve what you did not write.** Comments, tracked changes, images, formatting. `openpyxl`
flattens Excel threaded comments and strips authors; `docx` libraries drop what they do not model.
Inspect the file's parts before saving and graft back what the library dropped.

**C18. Verify before handing it back.** Render it and look at it. Diff every sheet or section you did
not intend to touch. Confirm images and comments survived, then run the house-rule checks over the
text.

## Truth and sources

**C19. One live file per deliverable, at exactly one path, edited in place.** No parallel versions in
a folder, no rendered copy beside the source, no export into another tool "for convenience". If an
output must be reachable from somewhere else, link to the path. A superseded file whose record
matters moves to the repo's named archive folder; one that should not be kept moves to
`_to_delete/`, which Paul empties himself. Each repo declares which kind of folder that is: tracked,
so parking is a committed move and the content stays recoverable from git history, or gitignored, so
the content is gone once the folder is emptied. Anything confidential is deleted, never parked in a
tracked folder.

**C20. Never restate a source-of-truth value in a second document. Link to it.** Dates, prices,
dimensions, thresholds. Every repo's own file names its sources of truth; that registry is the only
place a value is written.

**C21. Never present an assumption as a fact, and never fabricate.** Figures, pricing, supplier or
third-party terms, market data: ask rather than infer. Anything marked TO CONFIRM or described as a
working assumption is said to be unverified every time it is used, not once at the end.

**C22. Never invent an owner, a constraint, a gate, a rule or a rationale nobody stated.** If it is
not in the repo and neither Paul nor the team said it, it does not go in a doc as a rule. A blank
owner reads as unassigned and is said to be unassigned. Reasoning that justifies a rule they already
hold is padding, not rigour.

**C23. Never invent jargon or abbreviations.** Use only names that already exist in the repo, in the
client's own materials, or in the industry. Do not coin a short form because you have used a phrase
twice.

**C24. Say a standing rule once, or not at all.** Restating a known constraint in every table row and
every callout reads as padding.

**C25. Docs state what is true now, not how they got there.** No "was X, changed DD/MM/YYYY", no
"moved from Monday", no "Paul confirmed DD/MM/YYYY" in the body of a doc. A date belongs in a body
only when it is operational: when a run happens, when a decision was closed in a date-closed column,
the provenance of a photo or a quote. Everything else goes in the commit message, or in the doc's own
changelog section, which records decisions and their reasons rather than diffs. Record files a repo
names as such, a facts file or a tracking table, are exempt: they exist to show supersession and
waiting time on the page, and keeping the contradicted or dated entry is the point.

**C26. Source material is extracted, not just filed, and the extraction is what counts.** Anything
arriving from someone else stays raw until its content reaches the repo's live record and the
structured file that owns the subject. Once extracted, the record is what is read back: a raw
capture, an arrived source or a filled-in prep note, is never cited as a fact.

**C36. Documents for an audience follow the repo's named voice and design standards, read before
the first line.** Every repo names its standards in its own file. "For an audience" means any file
opened by someone other than the person who asked for it, in any format: spreadsheets, workbooks,
boards, HTML, slides and diagrams, not only reports and memos. A working tool that will be
attached, shared, screen-shared or presented is a document, and internal is not an exemption, only
a different audience for the same system. Read the standards before writing the first line, because
palette, type and layout are decided at the start and retrofitting them means rebuilding.

**C37. Delivered files are frozen.** Once a file has gone to its audience, its body is not
restructured or edited, appendix included. Later material is appended as a labelled addendum or
shipped as a new document, and questions about delivered content are answered in conversation. The
one permitted edit is fixing a cross-reference the addition itself broke, at the moment of adding.

**C42. An inbox is receive-only.** It holds what arrived from other people or awaits triage.
Nothing you produce goes there, ever, and it is never a fallback when no folder fits: ask which
folder instead.

**C27. Git history is the decision log. One commit per decision, not batched.**

**C45. Read the document that owns a fact before reasoning about it.** Not the map, not a summary,
not memory of an earlier read.

**C46. Say what is verified, what is inferred and what is opinion.** Every substantive claim carries
which of the three it is, and the boundaries are not blurred to make an answer read more confident.

**C48. Flag contradictions and risks rather than smoothing them.** Two sources that disagree, a
listing that markets what the rules forbid, a policy the practice breaches: surface it, do not
write around it to keep an answer tidy.

**C47. Anything reading across a boundary announces a missing source.** A script, a check or a
lookup that reaches into another repo, file or system and finds its source absent says so and
stops, rather than quietly passing with partial data.

**C32. A repo's read-mostly area takes per-change approval.** Every repo names its source-of-truth
area (context, strategy) in its own file. A write there is proposed as a diff, saying what it
supersedes, and then waits. Approval is for the write, not for the task: "Paul asked me to research
X" is not approval to write X into the record. Approval is per change and expires with it. There is
no size threshold: a typo fix and a re-sync of a derived file are changes. Where the repo keeps a
decisions log, the change lands with a dated line naming who approved it.

**C33. A session ends clean.** A piece of work ships as the deliverable plus a README saying what it
consumed, so the derivation is visible later. Intermediates that nothing needs any more are deleted,
and the deletion is reported: an input fully folded into the deliverable, a round-trip file whose
corrections were applied, an export a command can regenerate, a scratch analysis whose conclusion is
written down. Anything that regenerates the output, or that the output was derived from and cannot
be cheaply re-collected, moves to `src/` inside the work folder. A file
that is a copy of a live source says so and is temporary: deleted once used, replaced by the command
that regenerates it. Nothing references a file that might be deleted. Work that was acted on is
kept, and superseded deliverables are archived rather than binned: the target is intermediates, not
history.

**C35. Live state never lives in the rules file.** Open decisions, known deviations, current status
and struck-through resolved items belong in the repo's live record, which the rules file points at.
A rules file that carries status goes stale the day it is written, and a stale rule cannot be told
from a current one.

## House rules

**C28. Dates in prose are DD/MM/YYYY**, in messages to Paul and in documents alike. Dates in code,
filenames and data formats are ISO `YYYY-MM-DD`, so they sort and parse; a prose-format date never
goes into a filename.

**C29. No em dashes, en dashes or arrow characters in anything a person outside the repo reads, or in
anything written to Paul.** Commas or shorter sentences. Each repo states in its own file whether its
product and marketing copy is exempt.

**C30. Minimal, precise output.** No unsolicited explanation, no padding caveats, no
self-congratulation.

**C31. Priority order when rules pull against each other:** Accuracy > Trust > Practical usefulness >
Clarity > Speed > Volume.

<!-- CLAUDE-CORE:END -->

<!-- The pre-revamp AGENTS.md carried no numbered rules, so no mapping is needed. Its two instructions are R1 and R2. AGENTS.md is now the import and this file is authored, because a Next.js scaffold run owns AGENTS.md; see section 7. -->
