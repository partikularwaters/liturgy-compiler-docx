# User Story Protocol

A project-agnostic format for writing User Stories that an AI coding agent can
implement with minimal back-and-forth. Two parts: (1) a column schema for
writing the stories, (2) a protocol telling the agent exactly what to do with
each one. Copy this file into any project; nothing below is specific to any
one codebase.

---

## Part 1 — The User Story Table

Write stories as rows in a table (spreadsheet, CSV, or a markdown table).
Each column below is a field on that row.

| Column | Required? | Purpose |
|---|---|---|
| **Story ID** | Yes | Short stable identifier (`US-014`). Never reused, even if a story is cut. |
| **Feature / Epic** | Yes | The larger feature this story belongs to. Groups related stories. |
| **User Role** | Yes | Who is acting — a specific role, not "the user" generically. If the project has only one role, still name it. |
| **Trigger / Context** | Yes | What situation puts this role in front of this need. Where they are, what just happened, what state they're in. |
| **Goal / Intent** | Yes | What they want and why, in plain language. One or two sentences, not implementation detail. |
| **Acceptance Criteria** | Yes | A bullet list of specific, testable conditions. Each bullet should be checkable as true/false against the running result — not vague ("works well") but concrete ("shows an error message when the field is empty"). |
| **Out of Scope** | Recommended | Things a reasonable implementer might assume are included but aren't. The more adjacent to the story, the more important this is to state explicitly. |
| **Data Touched** | Recommended | Entities, fields, or records this story reads or writes. Flags anything that needs schema changes. |
| **UI Surface** | If applicable | Screen(s) or component(s) affected. Blank if this is a backend-only story. |
| **Dependencies** | Recommended | Other Story IDs or features that must exist first. |
| **Priority / Phase** | Recommended | Where this sits in the build order. Doesn't need to be numeric — "Phase 2" or "Must-have v1" is fine. |
| **Status** | Yes | `Not started` / `In progress` / `Blocked` / `Done`. The agent updates this, not just the author. |
| **Notes / Open Questions** | Optional | Anything unresolved. If this column is non-empty, the story is not ready to implement — see Protocol §2. |

### Example row (generic — adapt the specifics to your domain)

| Field | Value |
|---|---|
| Story ID | US-014 |
| Feature / Epic | Notifications |
| User Role | Registered member |
| Trigger / Context | A member is viewing their own profile page and wants to stop receiving weekly digest emails without unsubscribing from everything. |
| Goal / Intent | Turn off just the weekly digest, keep transactional emails (password resets, receipts) on. |
| Acceptance Criteria | • A toggle labeled "Weekly digest" appears in Notification Settings, default ON.<br>• Turning it off stops the next scheduled digest from being queued for this member.<br>• Transactional emails are unaffected by this toggle.<br>• The setting persists across sessions/devices. |
| Out of Scope | No new email types are added. No admin-facing bulk toggle. No change to transactional email content. |
| Data Touched | `members.notification_prefs` (new `weekly_digest: boolean` field, default `true`) |
| UI Surface | `/settings/notifications` |
| Dependencies | None |
| Priority / Phase | Phase 2 |
| Status | Not started |
| Notes / Open Questions | (empty — ready to implement) |

---

## Part 2 — What the Agent Does With a Story

Follow these steps in order for every story pulled from the table.

### 1. Orient before touching anything

Locate and read this project's source-of-truth documentation (architecture
notes, conventions, prior decisions — whatever the project uses to record
"how things are actually built here," commonly named things like
`architecture.md`, `CONTRIBUTING.md`, or a `/context`, `/docs` folder). Do
this even if the story looks simple. A story that looks self-contained can
still contradict an existing convention, invariant, or naming decision.

### 2. Check readiness before implementing

A story is **not ready** if any of the following is true:

- **Notes / Open Questions** is non-empty.
- **Acceptance Criteria** contains vague, non-testable language.
- The story implies a decision the table doesn't state (a new data field
  with no specified type/default, a UI element with no specified location,
  an edge case with no specified behavior).

When a story isn't ready, **stop and ask** — do not guess and do not
silently pick the "most likely" interpretation. State specifically what's
missing and what the options are. This is cheaper than building the wrong
thing and more honest than quietly narrowing scope to avoid the question.

### 3. Cross-check against what already exists

Before writing any code, compare the story against the current state of the
project:

- Does an existing pattern already solve part of this? Reuse it — don't
  build a parallel mechanism.
- Does this story contradict or change something already decided/built
  elsewhere? Flag the contradiction explicitly and explain it in plain
  language. Do not silently reconcile it by favoring one side.
- Does **Dependencies** actually exist yet? If a listed dependency isn't
  built, stop — don't build around the gap with a workaround that will need
  to be undone later.

### 4. Implement to the Acceptance Criteria — nothing more, nothing less

- Every bullet in Acceptance Criteria must be satisfied.
- Nothing in **Out of Scope** should be built, even if it would be "easy
  while I'm in here." If you notice genuinely necessary adjacent work while
  implementing, surface it as a new candidate story rather than folding it
  in silently.
- If achieving an Acceptance Criteria bullet requires a decision the story
  doesn't specify (which library, what exact copy, what happens on an edge
  case not listed), make the smallest reasonable choice and **say what you
  chose and why** — don't let an invented decision pass as if it were
  specified.

### 5. Verify against the criteria, one by one

After implementing, go back through **Acceptance Criteria** line by line and
confirm each one is actually true of the running result — not "the code
looks like it should do this," but observed/tested behavior. If a bullet
can't be verified in the current environment (e.g., no way to test a
production-only integration), say so explicitly rather than marking it done
on faith.

### 6. Close the loop

- Update **Status** to `Done` only once every Acceptance Criteria bullet is
  verified. Otherwise leave it `In progress` or `Blocked` with a note on why.
- Update any living project documentation this story affects (the same
  source-of-truth docs read in step 1) so the next story — or the next
  person, human or AI — inherits an accurate picture, not a stale one.
- If step 3 or step 4 surfaced new candidate stories, add them to the table
  rather than losing the observation.

---

## Core principle

A story in this format is a contract, not a suggestion. Ambiguity in the
table is the author's responsibility to resolve, not the implementer's to
paper over. When something is unclear, the right move is always to surface
it and ask — never to assume, and never to quietly expand or shrink scope to
make an unclear story "work."
