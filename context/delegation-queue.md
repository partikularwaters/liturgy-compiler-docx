# Delegation Queue

Generated from: n8n Liturgy Automation — Implementation Plan (confirmed via `charter` 2026-08-27)

Source charter: `docs/N8N-LITURGY-AUTOMATION-CHARTER-DRAFT.md`
Full confirmed Implementation Plan: see `context/progress-tracker.md`'s Session Notes for 2026-08-27, or the conversation that produced this queue.

**Scope note carried over from chartering:** this feature is not named in `IDEA-SCOPE.md` — it is a genuine, acknowledged expansion of the project's original boundary (a Bible-reader/liturgy-compiler/docx-export app for one church), not something already scoped. Madrid confirmed this is fine; flagging again here so a future session doesn't mistake this queue for in-original-scope work.

## Execution rules (read before starting any ticket)

- **Serial execution in one checkout is the default.** Finish and Survey one ticket before another session edits the same working directory. Parallel execution requires a separately assigned Git worktree and branch per session — do not assume you have one unless explicitly told.
- A ticket only covers what its own spec states. Do not read ahead into another ticket's spec, and do not expand scope beyond what "Done when" requires.
- If something in your assigned ticket is ambiguous, genuinely unresolved, or the working tree doesn't match what the ticket assumes (unexpected dirty files, a file already in a different shape than described) — **stop and report**, don't guess.
- After a ticket reports completion, a senior-capability coordinator session runs the `survey` skill against it before the next ticket touches the same checkout.

## Ready for fresh-session execution (Junior-safe)

- [x] Ticket 1: Publication ledger migration — add `liturgies.status`/`ready_by`/`ready_at`, create `liturgy_publications`. **Built and survey-verified 2026-08-27, but not actually applied to Production until 2026-08-27/28** — a real gap caught mid-session (the migration file existed and was tracked, but had never been run live) and fixed then. See `progress-tracker.md`'s Completed section for both entries.
- [x] Ticket 2: Completion policy and progress computation (`lib/liturgy/readiness.ts`). **Built and survey-verified 2026-08-27** — see Completed section (a real predicate bug for Morning's Confession of Sin was found and fixed later, 2026-08-27).
- [x] Ticket 3: Weekly Sunday-liturgy idempotent ensure (`lib/liturgy/ensureWeek.ts`). **Built and survey-verified 2026-08-27** — see Completed section.
- [x] Ticket 4: Compile View progress bar and Mark Ready control. **Done and committed 2026-08-27** (`b62a2a7`) — see Completed section.
- [x] Ticket 5: Manual-fallback documentation note in `context/architecture.md`. **Built and survey-verified 2026-08-27** — see Completed section.

## Kept with the current session (Senior-required)

- [x] Ticket 6: `markReady()`/`markDraft()` + wiring into `lib/liturgy/sectionItems.ts`'s three write chokepoints — cross-cutting: this is the single, already-documented "only place that writes to `section_items`" that every one of the six item types and every renderer depends on (`architecture.md`'s `section_items` section and its Invariants). A subtle mistake here breaks Selection/Formula/Prayer/Sermon/Song/Verbal-Cue mutation for the whole app, not just this feature. **Done 2026-08-27** — see Completed section.
- [x] Ticket 7: New automation API surface under `app/api/automation/`, plus the dedicated automation credential it authenticates with — establishes a genuinely new authentication pattern (machine-to-machine, not the existing human Curator/Compiler session model) with no existing pattern in this codebase to copy the shape of. The charter's own Assumptions section left the credential's exact shape unresolved ("a dedicated role vs. a signed-token scheme") — a real judgment call, not something a fresh Junior session should invent alone. **Done 2026-08-27** — see Completed section. Later extended (2026-08-28) with `lordsDayNumber` on the `ensure-week`/`status` responses, a small addition, not a redesign.
- Ticket 8 (not a code ticket): n8n workflow construction (Monday/Wed/Fri/Saturday triggers, Gmail node wiring, branching logic) — requires Madrid's own n8n instance access and Gmail credential setup; no repository code is touched. Whoever builds this needs live access to those external accounts, which this delegation queue cannot grant. **In progress, guided step-by-step 2026-08-27/28** (n8n was new to Madrid): Monday and Wed/Fri workflows fully built, Published, and live on real Schedule Triggers. Saturday's core logic (polling, `/record-publication`, duplicate-prevention, email) is fully proven against real Production data but not yet finalized/Published (date parameter still needs switching from test-hardcoded back to dynamic). A Facebook-posting channel was added to Saturday's scope beyond the original charter (explicitly confirmed with Madrid, not a silent expansion) — built and proven live against a burner Page, but currently disabled pending Meta App Review (a real platform requirement discovered mid-build, not yet started as its own submission). Full narrative in Madrid's personal learning journal outside this repo (`~/Code/learning/n8n-liturgy-automation/JOURNAL.md`), referenced from `progress-tracker.md`'s Decisions Made.
- Ticket 9 (not a code ticket): UptimeRobot second heartbeat monitor + Render capacity confirmation — same as above: external-account configuration (UptimeRobot dashboard, Render workspace), not a code change. Requires Madrid's own account access. **Not started.**

Full specs for Tickets 6 and 7 are below, written for a senior-capability session (they carry real judgment calls to resolve, not a fully pinned-down spec — that's exactly why they're kept back rather than delegated to a fresh Junior session).

## Full ticket specs

### Ticket 1: Publication ledger migration

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Pattern to match:** `supabase/migrations/20260721030000_column_break_before.sql` (simple `alter table ... add column` with a short rationale comment) and `supabase/migrations/20260815010000_explicit_database_contract.sql` (for the `enable row level security` line — new tables already inherit `service_role`-only grants from that migration's `alter default privileges` block, so no grant statements are needed here, only RLS enablement).
**Files to touch:** one new file, `supabase/migrations/20260827100000_liturgy_publication_status.sql`
**Files to NOT touch:** any other migration file; do not modify `20260815010000_explicit_database_contract.sql`.
**Spec:**
Write a single migration file with exactly this shape:

```sql
alter table liturgies
  add column status text not null default 'draft' check (status in ('draft', 'ready')),
  add column ready_by uuid references auth.users(id),
  add column ready_at timestamptz;

create table liturgy_publications (
  id uuid primary key default gen_random_uuid(),
  liturgy_id uuid not null references liturgies(id) on delete cascade,
  ready_at timestamptz not null,
  delivered_at timestamptz not null default now(),
  unique (liturgy_id, ready_at)
);

alter table liturgy_publications enable row level security;
```

Add a short comment above each block explaining why `ready_at` (not just `liturgy_id`) is the uniqueness key on `liturgy_publications`: it's what lets a Liturgy that was edited after publication and re-marked Ready be delivered again as a genuinely new revision, while blocking a true duplicate delivery of the same revision.

**Done when:**
- The migration file exists at the exact path above with the exact schema shown.
- `npm run db:reset` replays cleanly from a fresh local volume (all migrations apply in order, no errors).
- `npm run db:verify-contract` still passes (same 7/7 result as before this change — this migration must not need any change to `scripts/verify-db-contract.mjs` or the explicit contract migration, since new tables already inherit `service_role`-only access from the existing `alter default privileges` block).
- `select column_name from information_schema.columns where table_name = 'liturgies' and column_name in ('status','ready_by','ready_at');` returns all three.
- `select relrowsecurity from pg_class where relname = 'liturgy_publications';` returns `true`.

**Do not:**
- Do not add any `grant`/`revoke` statements — the existing default-privileges migration already covers this.
- Do not touch `sections`, `section_items`, or any other existing table's columns.
- Do not write any application code in this ticket — migration only.

---

### Ticket 2: Completion policy and progress computation

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Pattern to match:** `lib/liturgy/canonicalOrder.ts` — a static per-Section lookup table plus small pure functions operating on it, no DB calls, no side effects, unit-tested directly (see `lib/liturgy/canonicalOrder.test.ts` for the test-file pattern to mirror).
**Files to touch:** `lib/liturgy/readiness.ts` (new), `lib/liturgy/readiness.test.ts` (new)
**Files to NOT touch:** `lib/liturgy/sectionItems.ts`, any Server Action file, any component.
**Spec:**

Define, keyed by exact Section name (these are the real, current Section names — see `lib/liturgy/canonicalOrder.ts`'s `SECTION_ORDER` for the merged reference list, and `context/redesign-plan-v1.1.md` §Y for each Section's real item-type whitelist):

```typescript
export type CompletionClass = "required" | "optional" | "structural";

export interface CompletionRule {
  class: CompletionClass;
  // Which Item['type'] values count as "this Section has real content."
  // A Section with more than one entry means ALL of them must be present
  // (e.g. Assurance of Pardon needs a Selection AND the Absolution Formula).
  requiredItemTypes?: Item["type"][];
}
```

Two exported per-template records, `MORNING_COMPLETION: Record<string, CompletionRule>` and `VESPER_COMPLETION: Record<string, CompletionRule>`, populated exactly as follows (template name is the same string `CompiledLiturgy.templateName` already carries — "Morning Worship" / "Vesper Worship" — use that to pick which record applies):

**Morning Worship:**
| Section name | class | requiredItemTypes |
|---|---|---|
| Call to Worship | required | ["selection"] |
| Prayer of Invocation | required | ["selection"] |
| Psalm of Adoration | required | ["song"] |
| Righteousness of God | required | ["selection"] |
| Call to Confession | required | ["selection"] |
| Confession of Sin | required | ["selection"] |
| Hymn of Propitiation | required | ["song"] |
| Assurance of Pardon | required | ["selection", "formula"] |
| Prayer for Illumination | optional | — |
| Psalm of Proclamation | required | ["song"] |
| Sermon | required | ["sermon"] |
| Hymn of Dedication | required | ["song"] |
| Affirmation of Faith | required | ["formula"] |
| Offertory Call | required | ["selection"] |
| Psalm of Thanksgiving | required | ["song"] |
| Pastoral Prayer | optional | — |
| Charge | optional | — |
| Benediction | required | ["selection"] |
| Doxology | required | ["song"] |

**Vesper Worship:**
| Section name | class | requiredItemTypes |
|---|---|---|
| Call to Worship | required | ["selection"] |
| Prayer of Invocation | required | ["selection"] |
| Psalm of Adoration | required | ["song"] |
| Confession of Sin | required | ["selection"] |
| Prayer for Pardon | optional | — |
| Words of Thanksgiving | required | ["selection"] |
| Psalm of Proclamation | required | ["song"] |
| The Lord's Discourses | required | ["selection"] |
| Words of Institution | required | ["selection"] |
| Prayer before Communion | optional | — |
| Hymn of Communion | required | ["song"] |
| The Lord's Table | structural | — |
| Closing of the Table | required | ["selection"] |
| Affirmation of Faith | required | ["formula"] |
| Offertory & Thanksgiving | required | ["selection", "song"] |
| Prayer Meeting | structural | — |
| The Great Commission | required | ["selection"] |
| Benediction | required | ["selection"] |
| Doxology | required | ["song"] |

Use curly apostrophes exactly as they appear in the live Section names ("The Lord's Discourses", "The Lord's Table" — see `20260826010000_fix_straight_apostrophes_in_section_names.sql`), not straight ones.

Then implement:

```typescript
export interface SectionProgress {
  name: string;
  class: CompletionClass;
  complete: boolean; // always true for "structural"
}

export interface LiturgyProgress {
  completed: number;
  total: number; // count of "required" sections only
  missing: string[]; // names of incomplete required sections, in Section order
  sections: SectionProgress[]; // every section, in order, for diagnostic display
}

export function computeProgress(liturgy: CompiledLiturgy): LiturgyProgress
```

`computeProgress` looks up the right table by `liturgy.templateName`, and for each `CompiledSection` in `liturgy.sections` (already in template order), checks whether every type listed in that Section's `requiredItemTypes` has at least one matching entry in `section.items` (match on `Item["type"]`). A Section not found in the table (shouldn't happen against real data) is treated as `optional` — same defensive default `canonicalOrder.ts`'s `getSectionOrderIndex` already uses for an unrecognized name, never throwing.

**Done when:**
- `lib/liturgy/readiness.ts` exports `MORNING_COMPLETION`, `VESPER_COMPLETION`, `CompletionRule`, `CompletionClass`, `SectionProgress`, `LiturgyProgress`, and `computeProgress`.
- `lib/liturgy/readiness.test.ts` covers: a Section with a single required type present/absent, Assurance of Pardon requiring both types (present-both, only-one-present, neither), an Optional Section counted correctly as never blocking completion, a Structural Section (The Lord's Table) always reporting `complete: true` and excluded from `total`, and a full synthetic Morning liturgy and full synthetic Vesper liturgy each computing the exact expected `completed`/`total`/`missing`.
- `npm test` passes including this new file.
- `tsc --noEmit` and `eslint` clean on the two new files.

**Do not:**
- Do not query Supabase from this file — it operates only on an already-fetched `CompiledLiturgy`.
- Do not modify `types/liturgy.ts` or any existing file.
- Do not build the Compile View UI in this ticket (that's Ticket 4).

---

### Ticket 3: Weekly Sunday-liturgy idempotent ensure

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Pattern to match:** `lib/liturgy/createLiturgyAction.ts` (for calling the `create_liturgy` RPC and the Vesper auto-reading assignment it already triggers) and `lib/liturgy/getLiturgies.ts` (for the query-by-template-and-date-range style already used elsewhere).
**Files to touch:** `lib/liturgy/ensureWeek.ts` (new), `lib/liturgy/ensureWeek.test.ts` (new)
**Files to NOT touch:** `lib/liturgy/createLiturgyAction.ts` itself (call its exported logic/the RPC, don't duplicate or rewrite it), any Server Action, any API route.
**Spec:**

Implement:

```typescript
export interface EnsureWeekResult {
  morningLiturgyId: string;
  vesperLiturgyId: string;
  morningCreated: boolean; // true only if this call actually created it
  vesperCreated: boolean;
}

export async function ensureWeek(upcomingSunday: string /* YYYY-MM-DD, Asia/Manila */): Promise<EnsureWeekResult | null>
```

For each of the two templates ("Morning Worship", "Vesper Worship"): query `liturgies` joined to `templates` for an existing row where `template_id` matches and `service_date = upcomingSunday`. If one exists, reuse its `id` and set the corresponding `*Created` flag to `false` — do not call `create_liturgy` again, do not touch its `status`. If none exists, call the same `create_liturgy` RPC path `createLiturgyAction.ts` already uses (compute `lords_day_number` via the existing `lib/liturgy/lordsDay.ts` helper, same as that action does) and set the flag to `true`.

Return `null` (fail closed, matching this codebase's established read-failure convention in `lib/liturgy/sectionItems.ts`) if any Supabase query/RPC call in this function errors — do not return a partial result.

This function does not send email and does not know about recipients — it only ensures the two Liturgies exist and reports whether each was newly created, for the caller (the automation API, built in a separate Senior-required ticket) to act on.

**Done when:**
- `ensureWeek` is exported with the exact signature above.
- Calling it twice in a row for the same date creates each Liturgy on the first call and reuses both on the second call (both `*Created` flags `false` the second time), verified in the test file against a local Supabase instance (or an appropriately mocked Supabase client, matching how `lib/liturgy/*.test.ts` files elsewhere in this repo already mock/stub Supabase — check `lib/liturgy/canonicalOrder.test.ts` or a nearby `*Action.test.ts` if one exists for the established mocking approach before choosing one yourself).
- A simulated RPC failure causes the function to return `null`, not a partial/thrown result.
- `npm test`, `tsc --noEmit`, `eslint` all clean.

**Do not:**
- Do not touch `status`/`ready_at`/`ready_by` on any Liturgy — this function only ensures existence.
- Do not send any email or call any external service.
- Do not build the `app/api/automation/` route in this ticket — that's Senior-required, kept with the coordinating session.

---

### Ticket 4: Compile View progress bar and Mark Ready control

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Dependency:** Requires Ticket 2 (`lib/liturgy/readiness.ts`) AND the Senior-required `markReady()`/`markDraft()` ticket to both be complete first — this ticket calls both `computeProgress()` and a `markReady()` Server Action that must already exist.
**Pattern to match:** `components/liturgy/SectionCard.tsx` for general Compile View component conventions and role-gating (compare how its Curator-only actions, e.g. Formula delete, check the current user's role before rendering the control); `ui-tokens.md`/`ui-rules.md` for all spacing/color/typography — no hardcoded hex or raw Tailwind color classes.
**Files to touch:** a new `components/liturgy/CompletionProgress.tsx`, plus the minimal edit to `app/liturgy/[id]/page.tsx` (or wherever the Compile View's top-level layout renders `SectionCard`s) needed to mount it once near the top of the page.
**Files to NOT touch:** `SectionCard.tsx` itself, `lib/liturgy/readiness.ts`, any Server Action file.
**Spec:**
`CompletionProgress` takes the already-fetched `CompiledLiturgy` (or the already-computed `LiturgyProgress` — prefer accepting `LiturgyProgress` directly and calling `computeProgress()` once in the parent Server Component, matching this codebase's existing pattern of computing derived values in the Server Component and passing plain data down) plus the current Liturgy's `status`. Renders:
- A compact bar/label reading "`{completed} of {total} required Sections complete`."
- Below it, when `missing.length > 0`, a list of the missing required Section names, each an anchor link that scrolls to that Section's existing `SectionCard` (Section headings already have stable anchors/ids somewhere in the Compile View — locate and reuse whatever id scheme `SectionCard.tsx` already uses per Section; do not invent a new one).
- A "Mark Ready for Publication" button, rendered only when `missing.length === 0` and the current user resolves to Curator or Compiler role (reuse `getCurrentUser()`/existing role-check pattern), and only when `status !== 'ready'`. Clicking it calls the `markReady()` Server Action (built in the Senior-required ticket) and shows its returned error inline if it fails re-validation.
- When `status === 'ready'`, show a plain "Ready for publication" state indicator instead of the button (no un-ready/undo control needed here — per the charter, any further content edit already flips it back to Draft automatically via the wired-in `markDraft()`).

**Done when:**
- Compile View for a Liturgy with 2 of 5 required Sections filled shows "2 of 5 required Sections complete" and lists the 3 missing Section names as working scroll-to links.
- The "Mark Ready" button is absent while any required Section is missing, present (and functional) once all are filled, for a signed-in Compiler/Curator; absent entirely for an anonymous visitor or a role without edit rights.
- After a successful `markReady()` call, the UI reflects the Ready state without a full page reload (either via the Server Action's revalidation or an optimistic update — match whatever revalidation pattern nearby Server Actions in this codebase already use, e.g. `revalidatePath` if that's the established convention in `createLiturgyAction.ts` or similar).
- `tsc --noEmit`, `eslint`, `npm test`, `next build` all clean.
- Manually verified in a real browser against local Supabase: a Liturgy missing one required Section shows the correct count and missing-list; filling it in makes the Mark Ready button appear; clicking it flips status to ready and the button disappears in favor of the Ready indicator.

**Do not:**
- Do not implement `markReady`/`markDraft` themselves in this ticket — only call the already-existing action.
- Do not add an "un-ready" button — not part of the confirmed plan.
- Do not use any hardcoded hex color or raw Tailwind color class — tokens only.

---

### Ticket 5: Manual-fallback documentation note

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Pattern to match:** the existing prose style of `context/architecture.md`'s Data Flows section (see Flow 3 — Sharing a Liturgy, and Flow 4's closing paragraph, for tone/length).
**Files to touch:** `context/architecture.md` only — add a short new subsection at the end of the Data Flows section, titled "Flow 5 — Manual publication fallback."
**Files to NOT touch:** any other file. This ticket has no code dependency on any other ticket — the fallback it documents (sharing the already-existing Web View link and, for Morning, the already-existing Bulletin DOCX) works today, independent of whether any other ticket in this queue has shipped yet.
**Spec:**
Add a short paragraph (3-5 sentences, matching the existing Flow entries' length and tone) stating: if the n8n automation is unavailable for any reason (n8n down, Render free-tier restart, Supabase pause, etc.), an authorized Curator/Compiler can always open the Liturgy's Compile View directly, open `/liturgy/[id]/view` (the existing public Web View), and share that URL manually with the congregation; for Morning Worship, the Congregation Bulletin DOCX remains available the same way via the existing `/api/liturgy/[id]/export` route. No new tooling is required for this fallback — it uses only capabilities that already exist and are exercised by this ticket's own verification step.

**Done when:**
- The new subsection exists in `context/architecture.md`, placed after the existing Flow 4 and before the Database Schema section.
- The described fallback is verified by hand against the running app (open an existing real Liturgy's Compile View, open its `/view` URL, and — if it's a Morning liturgy — its `/export?audience=bulletin` URL — confirm all load correctly) rather than merely asserted.

**Do not:**
- Do not describe or reference any part of this queue's other, not-yet-built tickets (the automation API, the ledger, the progress bar) as part of the fallback — the fallback is deliberately independent of all of that.
- Do not modify any other section of `architecture.md`.

---

### Ticket 6: `markReady()`/`markDraft()` and write-chokepoint wiring

**Tier:** Senior-required
**Required capability:** Senior-required — must run in the user-selected senior-capability mode, not a fresh Junior session.
**Why kept back:** `lib/liturgy/sectionItems.ts` is architecture.md's documented single write chokepoint for `section_items` — "the only place that writes to this table," used by every one of the six item types and every renderer (docx, legacy PDF, Web View, Compile View) downstream. A mistake here doesn't just break this feature; it can break ordinary Selection/Formula/Prayer/Sermon/Song/Verbal-Cue placement across the whole app. This also requires a real judgment call the charter didn't fully pin down (see below).
**Dependency:** Requires Ticket 1 (migration — `status`/`ready_by`/`ready_at` columns) and Ticket 2 (`lib/liturgy/readiness.ts` — `computeProgress()`) to exist first.
**Pattern to match:** `lib/liturgy/removeItemAction.ts` for the `getCurrentUser()`-gated Server Action shape; `lib/liturgy/sectionItems.ts` itself (read it in full before touching it) for the existing chokepoint functions (`insertSectionItem`, `updateSectionItem`, `deleteSectionItem`) you're wiring into.
**Files to touch:** `lib/liturgy/sectionItems.ts` (add the `markDraft` call inside the three write functions), a new `lib/liturgy/liturgyReadinessActions.ts` (or similar name) exporting `markReady()`/`markDraft()`, plus tests.
**Files to NOT touch:** `lib/liturgy/getSectionContext.ts`, `lib/liturgy/getTargetSection.ts`, `lib/liturgy/getLiturgy.ts` (read-path files — this ticket is write-path only), any individual item-type action file (`addFormulaAction.ts`, `addPrayerAction.ts`, etc. — they should need zero changes, since they already funnel through `sectionItems.ts`'s three functions).

**Spec:**

```typescript
// markReady: the only path that transitions a Liturgy to 'ready'.
// Re-validates completion server-side — never trusts client state.
export async function markReady(liturgyId: string): Promise<{ success: boolean; error?: string }>

// markDraft: idempotent — safe to call even if already 'draft'.
// Called (a) directly, if ever exposed as an explicit user action, and
// (b) internally from sectionItems.ts's three write functions below.
export async function markDraft(liturgyId: string): Promise<{ success: boolean; error?: string }>
```

- `markReady()`: checks `getCurrentUser()` resolves to a Curator/Compiler role (same gate `removeItem()` uses) → fetches the full `CompiledLiturgy` via `getLiturgy()` (fail closed if `null`) → runs `computeProgress()` from Ticket 2 → if `missing.length > 0`, return `{ success: false, error: "..." }` listing what's missing → otherwise `update liturgies set status = 'ready', ready_by = <user id>, ready_at = now() where id = $1`.
- `markDraft()`: `update liturgies set status = 'draft', ready_by = null, ready_at = null where id = $1 and status = 'ready'` — the `and status = 'ready'` guard makes it a no-op write when already Draft, avoiding unnecessary churn. Clearing `ready_by`/`ready_at` back to `null` is deliberate: `liturgy_publications` (Ticket 1) is the durable delivery history, not the `liturgies` row itself, so there's no need to preserve a stale "last approved" timestamp on a Liturgy that's no longer approved.
- Wire `markDraft(liturgyId)` into all three of `insertSectionItem`, `updateSectionItem`, `deleteSectionItem` in `sectionItems.ts`, called after a successful write, resolving `liturgyId` from the section's `liturgy_id` (a join through `sections`, or accept `liturgyId` as an added parameter if that's cleaner — your call, but keep the three functions' existing callers working without changes if at all possible, since every add/edit/remove action across all six item types already calls these three functions and shouldn't need to change).

**Judgment calls this ticket must resolve (the charter's plan left these open — pick and document your reasoning, don't silently default):**
1. **Section-level toggles** (`setColumnBreakAction.ts`, `setShowPrayerGuideAction.ts`, `setShowEndNoteAction.ts`) don't go through `section_items` at all — they write directly to `sections`/`liturgies` columns. The charter's plan said auto-draft covers "relevant Section-level toggles" without enumerating which. These three are presentational/export-layout settings, not the actual required-content the completion predicates check — recommend leaving them **out of scope** (they don't flip Ready back to Draft), but this is a real product call, not a mechanical one. State your decision explicitly in the commit/PR description.
2. Whether `markDraft()`'s internal call from the three chokepoint functions should be fire-and-forget (log-and-continue on failure, since the primary write already succeeded and a failed status flip shouldn't roll back a legitimate content save) or must itself succeed for the whole operation to report success. Recommend: log-and-continue — matches this codebase's general bias toward not letting a secondary side effect block a primary user-facing action, but confirm this doesn't contradict any test in Ticket 4.

**Done when:**
- `markReady()`/`markDraft()` exist with the behavior above, fully unit-tested (missing-Sections rejection, successful transition, role-gating, idempotent Draft no-op).
- Every one of the six item types (Selection, Formula, Verbal Cue, Prayer, Sermon, Song) — add, edit, and remove — is proven by test to flip a Ready Liturgy back to Draft.
- No existing test in the suite regresses; `npm test`, `tsc --noEmit`, `eslint`, `next build` all clean.
- Live-verified against local Supabase: mark a real Liturgy Ready, edit one placed item of each type, confirm each edit independently flips it back to Draft.

**Do not:**
- Do not change the public signature of `insertSectionItem`/`updateSectionItem`/`deleteSectionItem` in a way that breaks any existing caller — check every call site before changing the signature.
- Do not add a client-facing "un-ready" button in this ticket (that's a UI concern, not touched here).
- Do not silently decide the Section-level-toggles question without stating your reasoning — see Judgment call 1 above.

---

### Ticket 7: Automation API and credential

**Tier:** Senior-required
**Required capability:** Senior-required — must run in the user-selected senior-capability mode, not a fresh Junior session.
**Why kept back:** this establishes the first machine-to-machine authentication pattern in a codebase whose only existing auth model is human Curator/Compiler Supabase Auth sessions. The charter's own Assumptions section explicitly left the credential's shape unresolved — a real design decision, not a mechanical implementation of an already-settled choice.
**Dependency:** Requires Ticket 3 (`lib/liturgy/ensureWeek.ts`) and Ticket 6 (`markReady`/`markDraft`, for reading current `status`) to exist first.
**Pattern to match:** `app/api/liturgy/[id]/export/route.ts` for the general shape of an API route handler in this codebase (try/catch wrapping the whole handler, fail-closed on any read failure) — there is no existing machine-auth pattern to copy, since none exists yet; that gap is exactly why this is Senior-required.
**Files to touch:** new files under `app/api/automation/` (suggested: `ensure-week/route.ts`, `status/route.ts`, `record-publication/route.ts`), a small shared `lib/auth/automationAuth.ts` (or similar) for the credential check, and whichever env var(s) it reads.
**Files to NOT touch:** `lib/auth/getCurrentUser.ts` (the human-session resolver — do not conflate the two auth models), `middleware.ts` (session refresh for human auth — this new API is a separate, simpler check, not routed through the session middleware).

**Spec — propose, then decide, the credential mechanism.** Two real options, pick one and document why:
- **(Recommended) Shared bearer token**: a single long random secret stored as a server-only Vercel env var (e.g. `AUTOMATION_API_TOKEN`), checked via an `Authorization: Bearer <token>` header on every request to `app/api/automation/*`, compared with a constant-time comparison. Simple, matches this project's "no paid dependency, least infrastructure needed" posture (per `IDEA-SCOPE.md`'s constraints), and appropriate for a single trusted internal caller (n8n) over HTTPS. Rotation = update the env var and the n8n credential together; no in-app rotation UI needed.
- **(Alternative, heavier)** A dedicated Supabase Auth service-account user with a new `automation` role in `user_roles`, requiring n8n to hold and refresh a real session token. More moving parts (n8n's HTTP node would need to manage token refresh) for a single trusted caller — likely not worth the complexity here, but your call if you have a reason to prefer defense-in-depth over simplicity.

Whichever you choose, every route must authorize the credential **before any Supabase read or write** (same invariant every other privileged mutation in this codebase already follows), and every read must fail closed (5xx on a genuine query failure, matching `getFormulas`/`getPrayers`/`getSongs`'s established `null`-on-failure convention) rather than returning a plausible-looking partial response.

**Proposed endpoints** (adjust the exact shape if you find a better one — this is a starting point, not a locked contract):
- `POST /api/automation/ensure-week` — body `{ upcomingSunday: string }`, calls `ensureWeek()` (Ticket 3), returns both Liturgy IDs, whether each was freshly created, and their Compile View URLs (for the creation email's links).
- `GET /api/automation/status?date=YYYY-MM-DD` — returns, per Liturgy (Morning + Vesper): `id`, `status`, `computeProgress()`'s result (Ticket 2), Compile View URL, public Web View URL. Used by the Wed/Fri progress-capture emails and Saturday's polling.
- `POST /api/automation/record-publication` — body `{ liturgyId, readyAt }`. **Must re-read the Liturgy's current `status`/`ready_at` from the database at request time** (never trust a value n8n cached from an earlier poll — the charter's own integration boundary explicitly requires this, since a later edit can return a Liturgy to Draft between polls) and confirm they still match `status === 'ready'` and the given `readyAt` before inserting into `liturgy_publications`. The insert's `unique(liturgy_id, ready_at)` constraint (Ticket 1) is the actual duplicate-delivery guard; this route should treat a unique-violation on insert as "already delivered, tell n8n not to send" rather than an error.

**Done when:**
- All three routes exist, each authorizing the chosen credential before any data access.
- A request with a missing/wrong credential is rejected (401/403) before touching Supabase, proven by test.
- `record-publication` proven by test to: succeed and return "deliver" on a fresh `ready_at`; return "already delivered, skip" (not an error) on a retry of the same `ready_at`; reject if the Liturgy has since returned to Draft.
- A simulated Supabase read failure in any route returns a 5xx, not a 200 with partial/absent data.
- `tsc --noEmit`, `eslint`, `npm test`, `next build` all clean.
- Live-verified: a valid credential succeeds end-to-end against a real local Liturgy; an invalid/missing credential is rejected; a duplicate `record-publication` call for the same `ready_at` is correctly treated as already-delivered.

**Do not:**
- Do not route this new API through the existing human-session `middleware.ts`/`getCurrentUser()` path — it needs its own, separate, simpler check.
- Do not expose the chosen credential value anywhere client-reachable (no `NEXT_PUBLIC_` prefix, never returned in any response).
- Do not build rate limiting, IP allowlisting, or credential rotation tooling beyond a plain env var unless you judge it's actually warranted here — a single trusted internal caller over HTTPS with a rotatable shared secret is proportionate to this system's actual threat model; over-building this is its own kind of scope creep. State your reasoning either way.

---

# Track B

Generated from: Track B — Implementation Plan (confirmed via `charter` 2026-08-31)

Full confirmed Implementation Plan: see the conversation that produced this queue (2026-08-30/31 session), and `context/progress-tracker.md`'s next Session Notes entry once saved via `remember`.

Ticket numbering continues from the n8n queue above — Ticket 10 onward. Read the shared "Execution rules" section at the top of this file before starting any ticket below; it applies to every ticket in this file, not just the n8n batch.

## Ready for fresh-session execution (Junior-safe)

- [x] Ticket 10: Nav pill scroll-fold threshold fix — `TopNavLinks.tsx`'s hide-on-scroll never triggers during a slow, continuous scroll. **Built and survey-verified 2026-08-31** (implementation + live-browser confirmation of slow-scroll fold, mid-scroll reversal reveal, and near-top override, all passing with no console errors).
- [x] Ticket 11: Formula preview renders marks — `AddFormulaPanel.tsx`'s default-text preview ignores the library Formula's own `marks`. **Built and survey-verified 2026-08-31.** Caught and fixed a real bug during implementation: `MarkedText` renders its own `<p>`, so the ticket's literal "keep the surrounding `<p>`" instruction would have produced invalid nested `<p>` tags — used `MarkedText`'s own default styling instead (matching every other call site in the codebase, e.g. `SectionCard.tsx`), not a wrapped `<p>`. Live-verified against a real Formula with a Congregation mark: the preview now shows the `Congr:` label and indent it previously dropped.
- [x] Ticket 12: Library delete flows adopt the liturgy-delete dialog pattern — replace `window.confirm()` in Formula/Prayer/Song list rows and the Scripture Selection delete path. **Built and survey-verified 2026-08-31.** Scope correction found during implementation: the "See more" modal (`LibraryTextPreview.tsx`) has no delete affordance at all — it's a read-only text-preview modal — so there was nothing to convert there; the fix applies to the four list rows' own delete triggers only. New shared `components/library/ConfirmDeleteLibraryItemDialog.tsx` used by all four. Live-verified end-to-end on a real Scripture Selection row (dialog opens with correct copy, Cancel closes without deleting); Formula/Prayer/Song rows share the identical component and wiring, confirmed via clean `tsc`/`eslint` but not independently live-clicked (no seeded data locally for those three types).
- [x] Ticket 13: Section-Translation/content contrast pass. **Built and survey-verified 2026-08-31.** Located in the four Library list rows (Formula/Prayer/Song/Scripture Selection) — their Section/language label was rendering at default font weight (400), not the weight 500 `ui-tokens.md`'s own declared Label spec calls for at 13px/`text-secondary`. Fixed to `font-medium` (matching the documented token, not a new value) plus `mb-1` for spacing. Live-verified: label now reads clearly distinct from the content below it.
- [x] Ticket 14: Notification badges on the nav account icon and Curator Inbox entry. **Built and survey-verified 2026-08-31.** New `lib/auth/getPendingCuratorCount.ts` (Account Requests + Library Submissions only, matching the confirmed scope — Active Accounts/Bin/Deletion Log excluded), fetched once in `TopNav.tsx` only when the current user is a Curator, threaded through `TopNavLinks` → `AccountMenu`. Live-verified with real seeded data: badge shows "1" on both the account icon and the Curator Inbox dropdown link, hidden entirely once the count returns to 0.
- [x] Ticket 15: Add "Words of Thanksgiving" to `DIALOGUE_MARK_SECTIONS` (Selection Congregation tool). **Built and survey-verified 2026-08-31.** One-line addition; `npm test` (68/68), `tsc`, `eslint` all clean. Confirmed programmatically: `getSelectionMarks("Words of Thanksgiving")` now returns `["congregation", "small_caps"]`, matching Call to Worship's existing behavior; an unrelated Section's result is unaffected.
- [x] Ticket 16: Wire `TranslationPairFields` into `AddSongPanel`/`AddPrayerPanel`'s inline-create mode. **Built and survey-verified 2026-08-31.** Both panels now collect and pass `translation`/`pairedId` through to `createSong`/`createPrayer` in "Write New" mode only ("pick existing" mode untouched). Live end-to-end verified for Song: created a real Psalm inline from Compile View tagged Filipino, confirmed via direct query the row saved with `translation: "fil"` (would have been `null` before this fix regardless of input). Prayer uses the identical wiring pattern, confirmed via clean `tsc`/`eslint` but not independently live-tested.
- [x] Ticket 17: `MarkEditor.tsx` help text conditional on `availableMarks`. **Built and survey-verified 2026-08-31.** New `hasDialogueMarks` derived from the already-computed `exclusiveMarks`. Live-verified against two real Sections: Call to Worship (Congregation available) still shows the original Leader/label wording; Righteousness of God (Small Caps only) now shows the simplified, label-free wording. `npm test` (101/101), `tsc`, `eslint` clean.
- [x] Ticket 18: Sermon — four new fields (Title, Series, Preacher; reuse `passage`) across the data model, form, and every render surface. **Built and survey-verified 2026-08-31.** Renamed `saveSermonPassage` → `saveSermon` (single fields object, not four params) since its scope genuinely changed; all call sites updated, no dangling references. `resolveItemText.ts`'s sermon case builds a newline-joined multi-line block (Title — Series / Passage / Preacher, skipping absent fields) — confirmed the existing `whitespace-pre-wrap` convention in the Compile View, docx (`textToParagraphSpecs`'s established `\n`-splitting), and Web View all already handle this with zero renderer-specific changes needed. Live end-to-end verified: added a real Sermon with all four fields via Compile View, confirmed correct rendering there, in a real generated docx (extracted and grepped the XML), and in the Web View's payload. Also confirmed the server-side Section-name guard correctly rejects a Sermon save attempted on the wrong Section (caught during testing when a stray duplicate form briefly existed in the DOM from an earlier misclick — not a real bug, a test-harness artifact, but it did prove the guard works).
- [x] Ticket 19: Sermon — liturgy row summary Title→Passage fallback (depends on Ticket 18). **Built and survey-verified 2026-08-31.** Added `LiturgySummary.sermonTitle` (new field, `sermonPassage` untouched) rather than changing what `sermonPassage` resolves to — `formatLiturgyName.ts` (the page `<h1>` naming convention) was deliberately left reading `sermonPassage` only, unchanged. Live-verified against real `/liturgies` data: a Morning liturgy with a Title set shows the Title; a Morning liturgy with no Sermon still shows just the date (unchanged); both Vesper rows (Discourses citation) completely unaffected.
- [x] Ticket 20: Natural-flow per-instance toggle on Righteousness of God / Call to Confession / The Lord's Discourses. **Built and survey-verified 2026-08-31.** New migration `20260831010000_natural_flow_selections.sql` (`sections.merge_selections`, default false), new `lib/liturgy/naturalFlowSections.ts` (shared `NATURAL_FLOW_TOGGLE_SECTIONS` constant, imported by both `SectionCard.tsx` and `prepareSectionRender.ts` so Compile View and docx/PDF/Web View can't drift), new `setNaturalFlowAction.ts` + `NaturalFlowToggle.tsx` (mirrors `SilentConfessionLanguageToggle.tsx`'s exact self-contained shape). Assurance of Pardon's old unconditional merge is completely untouched — confirmed live it still merges with zero toggle UI. Live end-to-end verified on a real created liturgy: toggle appears only on the three named Sections; off by default (two Selections render as separate paragraphs); switching it on merges them into one continuous passage, confirmed in both the Compile View and a real generated docx export (grepped the extracted XML for both the merged and Assurance-of-Pardon-unconditional cases). `npm run db:reset`/`db:verify-contract` (7/7) clean; `npm test` (101/101), `tsc`, `eslint` clean.
- [x] Ticket 21: Set Target unification — `ReaderTargetPicker` always-renders with the non-arrival mode greyed out. **Built and survey-verified 2026-08-31.** New `arrivedVia: "none" | "section" | "library"` prop; `app/reader/page.tsx` now always fetches `liturgies`/`librarySectionNames` (previously skipped when a target was already set); `ReaderClient.tsx` restructured so the picker and the AddSelectionPanel/instruction line coexist instead of being mutually exclusive. Live-verified all three arrival cases: plain `/reader` visit shows both modes fully active; a Compile-View-style deep-link (`?liturgyId&sectionIndex`) shows the picker (not hidden) with Liturgy Section active and Scripture Library disabled; a Library-style deep-link (`?librarySection=`) shows the reverse. `npm test` (101/101), `tsc`, `eslint` clean.
- [x] Ticket 22: `/library` "+ Add from Reader" deep-link; retire `/selections/new` (depends on Ticket 21). **Built and survey-verified 2026-08-31.** New `components/library/AddScriptureFromReaderLink.tsx` (Section-tag select + button, mirroring Compile View's own deep-link pattern) wired into `/library`'s Scripture Selections tab; `app/selections/new/` deleted entirely (route, client component, and the now-empty `app/selections/` directory). Live-verified: the new control generates `/reader?librarySection=<name>`, landing on the Reader with Scripture Library mode correctly pre-set-and-active for that exact Section; `/selections/new` now returns a real 404; no dangling references anywhere in the codebase (`grep` confirmed). `npm test` (101/101), `tsc`, `eslint` clean.

## Senior-required

- [x] Ticket 23: Formula `item_types`/marking-table migration — first tracked migration for `item_types`, touches the "Section only offers whitelisted item types" Absolute Invariant. **Built and survey-verified 2026-08-31, executed directly in the coordinator session (not delegated).** Real scope expansion found during execution, flagged and confirmed with Madrid before proceeding: `item_types` is completely absent from every Section on a fresh local database (Feature 23 only ever set it live in Production, never in a tracked migration) — a targeted 3-cell patch would have left local dev's whitelist gap unfixed. Migration `20260831020000_section_item_types.sql` sets the complete `item_types` array for all 18 Morning + 19 Vesper Sections, reconstructed from `redesign-plan-v1.1.md`'s §Y table (Section names/order cross-checked against live data first, no drift found) with the three confirmed Formula removals baked in. The migration's own comment flags that Madrid should diff it against Production's real live values before applying there, since local had nothing to verify against beyond the Formula-eligibility list he already queried live. `FORMULA_MARK_SECTIONS` now only lists Assurance of Pardon and Words of Thanksgiving; `getFormulaMarks`'s Affirmation of Faith case returns the same marks for both `kind` values; `FORMULA_EXCLUDED_SECTIONS` deleted from `SectionCard.tsx` entirely. Live-verified on both templates (fresh liturgies created via the real UI): Formula button appears only on Assurance of Pardon / Affirmation of Faith (Morning) and Words of Thanksgiving / Affirmation of Faith-Church Covenant (Vesper); Charge/Great Commission/Benediction correctly show no Formula button on either template; The Lord's Table / Prayer Meeting correctly show zero add buttons at all. `npm run db:reset`/`db:verify-contract` (7/7), `npm test` (101/101), `tsc`, `next build` all clean; one pre-existing-class lint warning (unused `kind` parameter, now vestigial since both branches return the same marks) left in place rather than restructuring two call sites for a warning, matching this project's existing tolerance for one stray warning.
- [x] Ticket 24: Song multi-Section tagging — new join-table pattern (none exists in this schema today) plus a same-title duplicate-detection/merge judgment call. **Built and survey-verified 2026-08-31, executed directly in the coordinator session.** New table `song_section_tags` (migration `20260831030000_song_section_tags.sql`), backfilled 1:1 from every existing Song's `section_name` (no data loss). **Duplicate merge deliberately NOT automated** — `attribution`/`notes`/`year_published` could genuinely differ between two same-title+kind rows and `songs` has no `created_at` to establish which is authoritative; blindly deleting one risks real data loss. The migration instead documents a review query for Madrid to run and manually reconcile any actual duplicates, matching the ticket's own pre-approved fallback for exactly this "not safely automatable" case. **Real gap found and fixed during execution, beyond the ticket's original scope:** neither `createSong` nor `updateSong` wrote to the new tags table at all — a newly created Song would have been invisible to every Section's tag-filtered picker until Ticket 26's multi-select UI exists. Fixed both actions to keep one tag in sync with the form's still-single-Section field (replace-on-edit, not additive — a known, deliberate limits until Ticket 26 adds real multi-select and needs to change this to preserve extra tags). Also hardened `getSongs.ts`'s fallback to treat a genuinely empty tag list the same as a missing one (falls back to `[section_name]`), not just a query error. `Song.sectionNames: string[]` added (new source of truth for placement); `Song.sectionName` kept for display/creation. Live end-to-end verified: created a real Hymn via Compile View's "Write New" flow, confirmed the tag row was actually written; manually added a second tag (simulating the multi-select Ticket 26 will build) and confirmed the same physical Song row — no duplication — appeared correctly in both Sections' pickers and remained correctly grouped once in `/library`. `npm run db:reset`/`db:verify-contract` (7/7), `npm test` (101/101), `tsc`, `eslint`, `next build` all clean.
- [x] Ticket 25: Prayer kind moves from the Library to a per-placement Compile View toggle — changes the meaning of an existing field that drives Bulletin-visibility derivation; the per-Section default mechanism is an open judgment call. **Built and survey-verified 2026-08-31, executed directly in the coordinator session.** Real finding during execution: `PrayerItem.leaderOnly` already existed as a per-placement snapshot field (added 2026-08-25) — no new field was needed on the type, only a change to what *drives* its initial value (the new `lib/liturgy/prayerKindPolicy.ts`, mirroring `amenPolicy.ts`'s exact shape — `getDefaultPrayerKind()`, "corporate" for Confession of Sin, "leader" elsewhere) and a real way to *change* it after placement (new checkbox in `SectionCard.tsx`'s `PrayerEditForm`). `Prayer.kind` removed entirely from the type, `PrayerForm.tsx`'s Kind select, and `createPrayer`/`updatePrayer`'s signatures (the DB column itself is untouched — no migration — its own `default 'leader'` covers the omitted insert). Every caller updated (`NewPrayerClient.tsx`, `PrayerListRow.tsx`, `AddPrayerPanel.tsx`, the Personal-Library-fork insert in `addPrayerAction.ts`). `resolveItemText.ts`'s legacy pre-snapshot fallback (ancient placements with no `item.text` at all) also stopped reading `.kind` — now uses the same per-Section default policy, keyed off the library Prayer's own Section, closing the gap completely rather than partially. `is_guide`/`PrayerGuidePanel.tsx` confirmed untouched (grepped, no references). Live end-to-end verified: placed the same Prayer *shape* into Confession of Sin and Prayer for Illumination, confirmed each got its own correct per-Section default (`leaderOnly: false` vs `true`) directly from the database; toggled one independently and confirmed the other's stored value was completely unaffected; confirmed in two real generated docx exports (Bulletin and Guide) that toggling a placement's switch actually changes Bulletin inclusion for that placement only. `npm test` (101/101), `tsc`, `eslint`, `next build`, `db:verify-contract` (7/7) all clean.
- [x] Ticket 26: Library add-modal (Song/Prayer/Formula), retiring the three `/new` pages — new modal-shell UI pattern; depends on Tickets 23, 24, and 25 for its field sets to be final. **Built and survey-verified 2026-08-31, executed directly in the coordinator session.** New `AddLibraryItemModal.tsx` (shared shell, uniform size for all three types by construction) + `AddLibraryItemButton.tsx` (self-contained trigger, one per type on `/library`), hosting the existing `SongForm`/`PrayerForm`/`FormulaForm` unchanged in their field logic, per the ticket's own boundary. Real scope expansion found and completed, beyond the ticket's original field-relabeling ask: Song's Section field was upgraded from single-select to a real multi-select (checkbox list, `songActions.ts`'s `createSong`/`updateSong` now take `sectionNames: string[]`) — this was the actual point of the "Sections, not just one" requirement from the charter, and also closes the "replace-on-edit collapses other tags" limitation flagged as a known gap in Ticket 24's own completion note. A related correctness bug was caught and fixed in the same pass: `AddSongPanel.tsx`'s incidental-edit-while-placing path was about to collapse a Song's existing multi-Section tag set down to just the one Section being placed into — fixed to preserve the picked Song's own full existing tag set instead. Prayer's Title is a derived, live-updating read-only preview (first few words of Prayer Content, matching the confirmed "not a stored field" decision) — no migration, no new column. Formula/Prayer fields relabeled per the confirmed spec (Title/Content, Prayer Content). `app/songs/new/`, `app/prayers/new/`, `app/formulas/new/` deleted entirely, including their now-empty parent directories. Live end-to-end verified: created a real multi-Section Hymn via the modal, confirmed two real tag rows in the database; created a real Prayer and confirmed the Title preview updates live from typed content; created a real Formula; confirmed all three retired routes are gone from a real production build's route list. `npm test` (101/101), `tsc`, `eslint`, `next build`, `db:verify-contract` (7/7) all clean.

## Execution Sequence

| Step | Ticket | Tier | Depends on |
| --- | --- | --- | --- |
| 1 | Ticket 10 — Nav pill scroll-fold fix | Junior-safe | none |
| 2 | Ticket 11 — Formula preview marks | Junior-safe | none |
| 3 | Ticket 12 — Library delete dialog pattern | Junior-safe | none |
| 4 | Ticket 13 — Section-Translation contrast | Junior-safe | none |
| 5 | Ticket 14 — Notification badges | Junior-safe | none |
| 6 | Ticket 15 — Words of Thanksgiving Selection marks | Junior-safe | none |
| 7 | Ticket 16 — Compile-View translation-tagging wiring | Junior-safe | none |
| 8 | Ticket 17 — MarkEditor help text | Junior-safe | none |
| 9 | Ticket 18 — Sermon fields + render | Junior-safe | none |
| 10 | Ticket 19 — Sermon row summary | Junior-safe | Ticket 18 |
| 11 | Ticket 20 — Natural-flow toggle | Junior-safe | none |
| 12 | Ticket 21 — Set Target unification | Junior-safe | none |
| 13 | Ticket 22 — Library Reader deep-link, retire `/selections/new` | Junior-safe | Ticket 21 |
| 14 | Ticket 23 — Formula `item_types` migration | Senior-required | none |
| 15 | Ticket 24 — Song multi-Section tagging | Senior-required | none |
| 16 | Ticket 25 — Prayer kind-to-Compile-View | Senior-required | none |
| 17 | Ticket 26 — Library add-modal | Senior-required | Ticket 23, Ticket 24, Ticket 25 |

Tickets 10-22 have no dependency on 23-26 and can run in any order relative to them (subject to the serial-checkout rule); 23/24/25 have no dependency on each other and can run in any order; 26 must come last among the Senior-required set.

## Full ticket specs (Track B)

### Ticket 10: Nav pill scroll-fold threshold fix

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** the existing hide-on-scroll effect in `components/layout/TopNavLinks.tsx` (lines ~26-44) — fix in place, don't replace the mechanism.
**Files to touch:** `components/layout/TopNavLinks.tsx`
**Files to NOT touch:** any other layout/nav component.
**Spec:**
The current effect resets `lastScrollY.current = currentScrollY` on every single scroll event, then compares only that one event's delta against an 8px threshold. During a slow, continuous scroll, each individual event's delta is well under 8px, so `isHidden` never flips to `true` even though the page has scrolled far enough overall that the pill should have folded — it ends up overlapping page content/buttons near the bottom of a short page. Fix: only update `lastScrollY.current` when the scroll direction actually reverses or a fold/reveal decision is made — i.e. accumulate movement in the current direction until it crosses the 8px threshold, rather than measuring only the most recent event. Keep the existing `currentScrollY < 80` near-top override, the `passive: true` listener, and the same `isHidden` state shape — this is a threshold-accumulation fix, not a rewrite of the hide/reveal mechanism.
**Done when:**
- A simulated slow scroll (many small `scroll` events, each under 8px of movement, summing to well over 8px in one direction) flips `isHidden` correctly, verified either by a new test (if this component has or can reasonably get a lightweight test) or by manual verification in a real browser: open a page long enough to scroll, perform a slow continuous scroll-down (small, steady mouse-wheel increments, not a fast flick), confirm the pill folds before reaching the bottom.
- The existing fast-scroll and near-top behaviors are unchanged (verify by the same manual check: a fast scroll still folds immediately; scrolling back near the top still reveals it).
- `tsc --noEmit`, `eslint`, `next build` clean.
**Do not:**
- Do not change the 8px threshold value itself unless accumulation alone doesn't fix the bug — if you find you need to change it, state why in your completion report.
- Do not touch the `currentScrollY < 80` near-top branch's behavior.

---

### Ticket 11: Formula preview renders marks

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `components/liturgy/MarkEditor.tsx`'s own preview (`<MarkedText text={preview.text} marks={preview.marks} />`) — same `MarkedText` component, same call shape.
**Files to touch:** `components/liturgy/AddFormulaPanel.tsx`
**Files to NOT touch:** `MarkEditor.tsx`, `FormulaEditForm.tsx`, `MarkedText.tsx` itself.
**Spec:**
`AddFormulaPanel.tsx` (around line 93-94) renders the selected Formula's live preview as raw text: `<p ...>{selectedFormula.defaultText}</p>`, completely ignoring `selectedFormula.marks` — so a Formula with Congregation/Minister/Small-Caps/Bold marks already set at the library level shows as plain unmarked prose in this picker, even though placing it actually copies those marks onto the new instance (per `architecture.md`'s `formulas.marks` schema note). Replace the raw `<p>{selectedFormula.defaultText}</p>` with `MarkedText` rendering `selectedFormula.defaultText` with `selectedFormula.marks` (import `MarkedText` from wherever `MarkEditor.tsx` imports it from). Keep the same surrounding `<p>`/wrapper classes for typography — only the text-rendering mechanism changes, not the layout.
**Done when:**
- Selecting a library Formula that has Congregation/Minister/Small-Caps/Bold marks set shows those marks rendered (indent+label, small caps, bold) in the Add-Formula panel's preview, matching how the same Formula's marks render once actually placed in a Section.
- A Formula with no marks still renders identically to before (plain prose, no regression).
- `tsc --noEmit`, `eslint`, `next build` clean; manually verified in a real browser against a real Formula with at least one mark type set.
**Do not:**
- Do not add any new editing capability to this panel — it's a preview only, not an edit surface.
- Do not change `FormulaEditForm.tsx` or `MarkEditor.tsx` — they already render marks correctly.

---

### Ticket 12: Library delete flows adopt the liturgy-delete dialog pattern

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `components/liturgy/ConfirmDeleteLiturgyDialog.tsx` — reuse its shape (a `Modal`-based confirm dialog with a clear consequence statement) minus its typed-name confirmation gate entirely (no `typedName` state, no text input, no "type your name" copy) — just a clear message and a Delete/Cancel button pair.
**Files to touch:** `components/formulas/FormulaListRow.tsx`, `components/prayers/PrayerListRow.tsx`, `components/songs/SongListRow.tsx`, and the Scripture Selection row / "See more" modal's delete affordance (locate the equivalent row/modal component under `components/library/` or wherever Scripture Selections render in `/library` — mirror the same fix there). New shared component: `components/library/ConfirmDeleteLibraryItemDialog.tsx` (one shared dialog, parameterized by item label and delete handler, reused across all four list rows and the "See more" modal — do not write four near-duplicate dialogs).
**Files to NOT touch:** `ConfirmDeleteLiturgyDialog.tsx` itself, `deleteFormula`/`deletePrayer`/`deleteSong`/the Scripture Selection delete action (call them exactly as `window.confirm`'s callback already does today — only the confirmation UI changes, not the delete logic or its existing consequence-message text, e.g. "This does not remove it from liturgies it's already placed in.").
**Spec:**
Each of `FormulaListRow.tsx`, `PrayerListRow.tsx`, `SongListRow.tsx` currently gates its delete action behind a native `window.confirm(...)` call (see each file's `handleDelete`-equivalent, e.g. `FormulaListRow.tsx:64`). Replace each with the new shared `ConfirmDeleteLibraryItemDialog` — same trigger point (the existing delete button/icon), same existing consequence copy per item type, same existing delete action call on confirm — just a designed `Modal`-based dialog instead of the browser-native confirm. Apply the identical fix to the Library "See more" modal's own delete affordance (find it, likely in a component rendering an expanded/detail view of a Scripture Selection or similar).
**Done when:**
- All four item types (Formula, Prayer, Song, Scripture Selection) and the "See more" modal use the new shared dialog component, not `window.confirm`.
- No `window.confirm` calls remain in any of the touched files.
- Each dialog shows the same consequence message the corresponding item type already had; clicking Delete still calls the same existing delete action; clicking Cancel closes the dialog with no delete call.
- `tsc --noEmit`, `eslint`, `next build` clean; manually verified in a real browser: delete flow works end-to-end for at least two of the four item types (confirm cancels correctly, confirm deletes correctly, list updates after deletion).
**Do not:**
- Do not add a typed-name confirmation gate — explicitly excluded from this pattern per the confirmed plan.
- Do not change any delete action's server-side logic or authorization.

---

### Ticket 13: Section-Translation/content contrast pass

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `ui-tokens.md`'s existing text-color token scale (`text-primary`/`text-secondary`/`text-muted`) — this is a token-weight adjustment, not a new color.
**Files to touch:** locate the Section-Translation/language label rendering (likely in `SectionCard.tsx` or a small dedicated label component near where Selection `translation`/language is shown) and its surrounding item-content text.
**Files to NOT touch:** `ui-tokens.md` itself, unless the fix genuinely requires a new token value — if so, add it there following the file's existing structure and state why in your completion report, rather than hardcoding a one-off value in the component.
**Spec:**
The Section-Translation/language label currently reads as too close in visual weight to the item content beneath it, per direct observation. Locate the exact label (search for where a Selection's `translation`/language indicator renders inside `SectionCard.tsx`), and increase the visual separation using existing tokens — e.g. shifting the label to a more muted token (if it's currently too close to `text-primary`) or the content to a firmer one, whichever direction actually produces clearer separation without contradicting `ui-rules.md`'s existing typography rules for that region. Use only tokens already defined in `ui-tokens.md`; do not introduce a hardcoded hex or raw Tailwind color class (`architecture.md`'s Invariants forbid this).
**Done when:**
- A real Section with both a language/translation label and item content shows a visibly clearer distinction between the two, confirmed via a real-browser screenshot comparison (before/after) rather than just a code diff.
- `tsc --noEmit`, `eslint`, `next build` clean.
**Do not:**
- Do not use a hardcoded hex value or raw Tailwind color class.
- Do not change any other Section-rendering visual property (spacing, font) beyond the specific contrast fix.

**Correction, 2026-09-01:** a same-session survey initially flagged this as unresolved, since no Section-Translation label exists in `SectionCard.tsx` (the ticket's own hedge — "likely `SectionCard.tsx`" — turned out wrong) and the fix instead landed in the four Library list rows (`FormulaListRow.tsx`/`PrayerListRow.tsx`/`SongListRow.tsx`/`ScriptureSelectionRow.tsx`), bundled into the same diff as Ticket 12. On closer check against `ui-tokens.md`'s own declared Typography scale (`13px / weight 500 / text-secondary` for "Label"), the shipped `text-[13px] font-medium text-text-secondary` is the exact, correct implementation of that token, not a drift-in-the-wrong-direction as first assessed — the earlier verdict is withdrawn. Genuine, non-blocking cleanup still worth doing later: split this change into its own commit/diff rather than leaving it silently bundled with Ticket 12's dialog work.

---

### Ticket 14: Notification badges on nav account icon and Curator Inbox entry

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `components/layout/AccountMenu.tsx` for where to mount the badge on the account icon; `app/curator-inbox/page.tsx`'s existing tabs (`AccountRequestsTab`, `LibrarySubmissionsTab`, `ActiveAccountsTab`, `BinTab`, `DeletionLogTab`) for what counts as a pending/actionable item worth badging.
**Files to touch:** `components/layout/AccountMenu.tsx`, a small new server-side count helper (e.g. `lib/auth/getPendingCuratorCount.ts` or similar, following the existing `lib/auth/` module shape), and whichever layout component passes `currentUser`/counts down to `AccountMenu`.
**Files to NOT touch:** `app/curator-inbox/page.tsx`'s tab content itself — this ticket only adds a count badge to the nav entry point, not new UI inside the Inbox.
**Spec:**
Add a small numeric badge (following whatever existing badge/pill visual convention this codebase uses — check `ui-tokens.md`/`ui-rules.md` for an existing badge spec before inventing one; if none exists, use a small circular count matching the existing `bg-morning`/`bg-vesper` pill sizing conventions in `LiturgyDateRow.tsx` as the closest precedent) to: (a) the nav's account icon itself, showing a combined count of anything requiring the current user's attention (define this as the sum of pending items across the Curator Inbox tabs that represent an actionable queue — Account Requests + Library Submissions are the clear candidates; Active Accounts/Bin/Deletion Log are informational, not actionable, and should not count), and (b) the "Curator Inbox" link inside the account dropdown specifically, showing the same count. Badge is visible only to a Curator (the only role with `/curator-inbox` access, per the existing `contextHref` logic in `AccountMenu.tsx`) and only rendered when the count is greater than zero (hidden entirely at zero, not a "0" badge).
**Done when:**
- A signed-in Curator with at least one pending Account Request or Library Submission sees a non-zero badge on both the account icon and the Curator Inbox link; a Curator with zero pending items sees no badge in either place.
- A Compiler (non-Curator) or anonymous visitor never sees this badge anywhere, regardless of underlying pending-item counts.
- `tsc --noEmit`, `eslint`, `next build` clean; manually verified in a real browser against real pending data (or seeded local data) for a Curator account.
**Do not:**
- Do not badge Active Accounts, Bin, or Deletion Log counts — those are informational tabs, not actionable queues.
- Do not add badging to any other nav element beyond the two named above.

**Correction, 2026-09-01:** a same-session survey found both badges used custom hand-rolled dimensions (`min-w-[16px] h-4 px-1 text-[10px]` on the account icon, `min-w-[18px] h-[18px] px-1.5 text-[11px]` on the Curator Inbox link — neither matching the other) instead of `ui-tokens.md`'s declared Badge spec (`rounded-full px-2 py-0.5 text-xs font-medium`). Fixed both to the declared token classes exactly, in `components/layout/AccountMenu.tsx`.

---

### Ticket 15: Words of Thanksgiving — add Selection Congregation marking

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** the existing `DIALOGUE_MARK_SECTIONS` array in `lib/liturgy/markableSections.ts:8`.
**Files to touch:** `lib/liturgy/markableSections.ts`
**Files to NOT touch:** `FORMULA_MARK_SECTIONS` or `getFormulaMarks` in the same file — this ticket is Selection-marks only (`getSelectionMarks`/`DIALOGUE_MARK_SECTIONS`), not Formula. (Formula's Words of Thanksgiving change is separately handled in Ticket 23.)
**Spec:**
Add `"Words of Thanksgiving"` to the `DIALOGUE_MARK_SECTIONS` array (currently `["Call to Worship", "Prayer of Invocation"]`). This gives any Selection placed in that Section the Congregation marking tool alongside the Small Caps it already has, via the existing `getSelectionMarks()` function — no other code change needed, since every caller already reads from this array.
**Done when:**
- `getSelectionMarks("Words of Thanksgiving")` returns `["congregation", "small_caps"]`.
- A Selection placed in the real Words of Thanksgiving Section (Vesper) shows the Congregation marking button in its edit-time toolbar, verified in a real browser against a real Vesper liturgy.
- `npm test`, `tsc --noEmit`, `eslint` clean.
**Do not:**
- Do not modify `FORMULA_MARK_SECTIONS`/`getFormulaMarks` in this ticket.

---

### Ticket 16: Wire `TranslationPairFields` into Compile-View inline-create

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `components/songs/SongForm.tsx`'s existing `TranslationPairFields` usage (lines ~155-163) — same component, same `translation`/`pairedId` state shape, same `onTranslationChange`/`onPairedIdChange` wiring, same submit-call shape passing both values through.
**Files to touch:** `components/liturgy/AddSongPanel.tsx`, `components/liturgy/AddPrayerPanel.tsx`
**Files to NOT touch:** `components/songs/SongForm.tsx`, `components/prayers/PrayerForm.tsx`, `lib/songs/songActions.ts`, `lib/prayers/prayerActions.ts` (the `createSong`/`createPrayer` functions already accept `translation`/`pairedId` as optional trailing parameters — no signature change needed, just pass real values instead of omitting them).
**Spec:**
`AddSongPanel.tsx`'s inline "create new" mode calls `createSong(sectionName, kind, title, attribution, yearPublished, notes)` — six arguments, omitting `translation`/`pairedId` entirely, so they silently default to `null`. `AddPrayerPanel.tsx`'s inline "create new" mode calls `createPrayer(sectionName, text)` — same gap. Add `TranslationPairFields` to each panel's "new" mode UI (following `SongForm.tsx`'s exact usage as the template), with local `translation`/`pairedId` state, and pass both through to the `createSong`/`createPrayer` call. For the pairing-candidate list each `TranslationPairFields` needs (the opposite-translation same-Section/kind list), reuse the same filtering logic `SongForm.tsx`/`PrayerForm.tsx` already use (`.filter((s) => s.id !== id && s.sectionName === sectionName && s.translation === opposite)`, adjusted for Song's additional `kind` filter) — the panels already receive the full `songs`/`prayers` list as props, so no new data-fetching is needed.
**Done when:**
- Creating a new Song or Prayer inline from Compile View shows the same translation/pair picker `SongForm.tsx`/`PrayerForm.tsx` already show, and the created row is saved with the chosen `translation`/`pairedId` instead of always `null`.
- Existing "pick an existing item" mode in both panels is unaffected (this ticket touches "create new" mode only).
- `tsc --noEmit`, `eslint`, `next build` clean; manually verified in a real browser: create a new Song inline from Compile View with a translation tag set, confirm it's saved with that tag (check via `/library` or a direct query).
**Do not:**
- Do not change `createSong`/`createPrayer`'s function signatures.
- Do not touch the "pick existing" mode's logic in either panel.

---

### Ticket 17: `MarkEditor` help text conditional on available marks

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `MarkEditor.tsx`'s existing conditional rendering of `allowTrinitarianSeal`'s extra sentence (line 201) — same "append a conditional sentence" shape, applied to the Leader/label sentence instead.
**Files to touch:** `components/liturgy/MarkEditor.tsx`
**Files to NOT touch:** any caller of `MarkEditor` — this is a self-contained internal fix, `availableMarks` is already a prop this component receives.
**Spec:**
The help text at `MarkEditor.tsx:198-201` unconditionally includes "Select a range of text above, then click a label — unmarked text stays Leader (flush left, no label)." This sentence only makes sense when the Leader/Congregation/Minister dialogue system applies — i.e. when `availableMarks` includes `"congregation"` or `"minister"`. When `availableMarks` is only `["small_caps"]`, `["bold"]`, or similar (no dialogue marks offered), replace that sentence with a simpler one describing only what's actually available, e.g. "Select a range of text above, then click a mark to apply it. Marks stick through further edits; use Clear to remove one." Keep the "Marks stick through further edits; use Clear to remove one." sentence in both cases (it's universally true, not label-system-specific) and keep the existing Trinitarian Seal conditional sentence unchanged.
**Done when:**
- Opening the help text on a Section with Congregation/Minister marks available still shows the current, unchanged wording.
- Opening the help text on a Section with only Small Caps and/or Bold available shows the new, label-free wording instead.
- `npm test`, `tsc --noEmit`, `eslint` clean; manually verified in a real browser against one Section of each kind (e.g. Assurance of Pardon for the dialogue case, a plain Selection Section for the non-dialogue case).
**Do not:**
- Do not change the Trinitarian Seal sentence's own condition or wording.
- Do not change any non-text behavior of `MarkEditor`.

---

### Ticket 18: Sermon — four fields, data model through every render surface

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `SongItem`'s snapshot-field shape in `types/liturgy.ts` (optional fields, no migration needed since `section_items.data` is jsonb) for the type extension; `resolveItemText.ts`'s existing `case "sermon":` (currently `return { label: "Sermon", text: item.passage, leaderOnly: false, rubric: false };`) as the one chokepoint every renderer (docx both audiences, legacy PDF, Web View, Compile View) already consumes — per `architecture.md`'s Invariant, changing this one function's Sermon case is what makes the new fields appear everywhere, without touching each renderer individually. `SermonForm.tsx`/`sermonActions.ts`'s existing single-field shape as the direct pattern to extend to four fields.
**Files to touch:** `types/liturgy.ts` (`SermonItem`), `components/liturgy/SermonForm.tsx`, `lib/liturgy/sermonActions.ts` (`saveSermonPassage`), `lib/liturgy/resolveItemText.ts` (the `"sermon"` case).
**Files to NOT touch:** `LiturgyDateRow.tsx` (that's Ticket 19), any docx/PDF/Web-View renderer file directly (they consume `resolveItemText`'s output already — no direct edit needed if the chokepoint is correct; if you find a renderer bypasses `resolveItemText` for Sermon specifically, stop and report rather than guessing why).
**Spec:**
Extend `SermonItem` (`types/liturgy.ts:222-226`) with three new optional fields alongside the existing `passage: string`: `title?: string`, `series?: string`, `preacher?: string`. Do not rename or duplicate `passage` — it remains the one "Sermon Text" field, per the confirmed decision not to invent a second field for the same concept.
Extend `SermonForm.tsx` with four inputs (Title, Series, Passage, Preacher — reordering the existing Passage field alongside the three new ones, all following the same labeled-input pattern the existing Passage field already uses) and extend its `onSubmit` callback signature to pass all four values.
Extend `saveSermonPassage` in `sermonActions.ts` to accept and persist all four fields on the `SermonItem` row (same `section_items.data` jsonb write it already does for `passage`, just with three more keys).
Update `resolveItemText.ts`'s `"sermon"` case to build a combined text block including whichever of Title/Series/Preacher are present, in a sensible reading order (Title as a heading-like lead, Series and Preacher as secondary lines, Passage/Sermon Text as the reference) — since `ResolvedItem.text` is the one string every renderer displays, structure it clearly (e.g. line breaks between Title, Series, Passage, Preacher) rather than concatenating them into one run-on line. All four fields remain public (`leaderOnly: false`, unchanged from today).
**Done when:**
- `SermonItem` has all four fields; old Sermon records with only `passage` (no `title`/`series`/`preacher`) continue to work with those three fields simply absent/undefined — no migration, no backfill needed (matches this codebase's existing optional-snapshot-field compatibility pattern).
- `SermonForm` shows and saves all four fields.
- **Superseded 2026-09-01, confirmed with Madrid:** the original criterion below ("submitting with only Passage filled still saves successfully") was revised — Title and Preacher are now required alongside Passage (Series stays optional), validated both client-side (`SermonForm.tsx`) and server-side (`sermonActions.ts`'s `saveSermon`). ~~submitting with only Passage filled (Title/Series/Preacher blank) still saves successfully, matching today's minimum-viable behavior~~
- The Compile View, both docx export audiences, and the Web View all show whichever of the four fields are actually present for a given Sermon, verified by generating a real docx export and viewing a real Web View for a liturgy with all four fields filled, and separately for one with only Passage filled (old-style, pre-dating the required-field change).
- `npm test`, `tsc --noEmit`, `eslint`, `next build` all clean.
**Do not:**
- Do not touch `LiturgyDateRow.tsx` or the liturgy row summary line — that's Ticket 19.
- Do not make any of the four fields `leaderOnly: true` — all four are public per the confirmed decision.
- Do not rename `passage` or add a second, separate "Sermon Text" field.
- **Note (2026-09-01):** the ticket's original chokepoint plan (route every render surface through `resolveItemText`'s extended `"sermon"` case) was also superseded — Compile View, Web View, and DOCX each grew a dedicated Sermon component (`SermonBody`/`sermonParagraphs`) reading the raw item directly, since the required small-caps-title/centered presentation can't be carried in `resolved.text`'s flat string. This matches Song's and Verbal Cue's existing precedent of bypassing `resolved.text` for structured display; `resolveItemText`'s sermon case remains the live path only for the frozen legacy PDF (`lib/pdf/LiturgyDocument.tsx`), which renders `resolved.text` generically with no per-type branch. See `resolveItemText.ts`'s own comment on the `"sermon"` case.

---

### Ticket 19: Sermon — liturgy row summary Title→Passage fallback

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** Ticket 18 (`SermonItem.title` must exist first).
**Pattern to match:** `LiturgyDateRow.tsx:96`'s existing `[liturgy.sermonPassage, formatDateDisplay(liturgy.serviceDate)].filter(Boolean).join(" | ")` and `lib/liturgy/getLiturgies.ts`'s existing `sermonPassage` resolution logic (the Morning "Sermon" / Vesper "The Lord's Discourses" branch).
**Files to touch:** `lib/liturgy/getLiturgies.ts` (or wherever `LiturgySummary.sermonPassage` is populated — trace `sermonPassage`'s source before editing), `components/liturgy/LiturgyDateRow.tsx`, `types/liturgy.ts` (`LiturgySummary`, if a new field is needed — see below).
**Files to NOT touch:** `formatLiturgyName.ts` — that function's own Sermon-segment logic (`if (summary.sermonPassage)`) is a separate consumer (the page `<h1>` naming convention) not named in the confirmed plan; leave it using `sermonPassage` exactly as it does today unless you determine it must change to stay consistent — if so, stop and report rather than silently changing a second consumer beyond what was asked.
**Spec:**
`getLiturgies.ts` currently resolves one `sermonPassage` string per liturgy (Morning: the Sermon Section's `SermonItem.passage`; Vesper: The Lord's Discourses citation). Extend this so Morning liturgies also expose the new `SermonItem.title` (from Ticket 18) alongside `passage` — either by adding a new `sermonTitle: string | null` field to `LiturgySummary`, or by changing what `sermonPassage` itself resolves to (your call — but state which you chose and why in your completion report, since `formatLiturgyName.ts` also consumes this field and must not silently break). Update `LiturgyDateRow.tsx:96`'s row text to use Title if present, falling back to Passage if Title is empty/absent (today's exact value), exactly matching the confirmed fallback chain — Vesper liturgies are unaffected (they have no Title field at all, so they keep using the Discourses citation exactly as today).
**Done when:**
- A Morning liturgy with a Sermon Title set shows that Title in the `/liturgies` row text line.
- A Morning liturgy with no Title but a Passage set shows the Passage (today's exact behavior, unchanged).
- A Morning liturgy with neither set shows just the date (today's exact behavior for a fully-empty Sermon, unchanged).
- Vesper liturgies show The Lord's Discourses citation exactly as before, with zero behavior change.
- `formatLiturgyName.ts`'s own Sermon-segment behavior (the page `<h1>`) is verified unchanged (or, if you determined it needed updating, your reasoning is stated in your completion report).
- `npm test`, `tsc --noEmit`, `eslint`, `next build` clean; manually verified in a real browser against `/liturgies` for at least one Morning liturgy with a Title and one without.
**Do not:**
- Do not change Vesper's row-summary logic at all.
- Do not silently change `formatLiturgyName.ts`'s behavior without stating so explicitly.

---

### Ticket 20: Natural-flow per-instance toggle

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `sections.column_break_before`/`sections.show_prayer_guide` and `sections.silent_confession_language` — each a boolean/enum column on the `sections` instance row, defaulted, set via a small dedicated Server Action (`setColumnBreakAction.ts`/`setShowPrayerGuideAction.ts`/`setSilentConfessionLanguageAction.ts`), toggled via a small dedicated UI control in `SectionCard.tsx` (e.g. `SilentConfessionLanguageToggle.tsx` as the closest UI-component precedent). Follow this exact three-part shape (migration column, Server Action, UI control) rather than inventing a new one.
**Files to touch:** one new migration (`supabase/migrations/<timestamp>_natural_flow_toggle.sql`), a new `lib/liturgy/setNaturalFlowAction.ts` (or similar name matching the existing `set*Action.ts` convention), `components/liturgy/SectionCard.tsx` (both the new toggle UI and gating the existing merge logic at lines ~601-627).
**Files to NOT touch:** any Formula/Prayer/Song file — this ticket is Selection-merge-only.
**Spec:**
Add a new boolean column to `sections` (e.g. `merge_selections`, default `false`) via a migration following the exact shape of `20260721030000_column_break_before.sql` (simple `alter table sections add column ...` with a short rationale comment). Write a `setNaturalFlowAction.ts` mirroring `setShowPrayerGuideAction.ts`'s exact shape (auth-gated Server Action, single-column update, `revalidatePath` if that's the established convention there). Add a small toggle UI to `SectionCard.tsx`, rendered **only** when the Section's name is one of "Righteousness of God", "Call to Confession", or "The Lord's Discourses" (a small local array constant in `SectionCard.tsx` or a new export in `markableSections.ts` — your call, matching whichever existing precedent, `DIALOGUE_MARK_SECTIONS`-style or inline, reads more consistently with the surrounding code). Gate the existing merge logic (`shouldMergeSelections` at line 612) so that for these three named Sections, merging only happens when the new toggle is `true` for that Section instance; for every other Section — Assurance of Pardon included — leave the existing unconditional `selectionItems.length > 1` behavior completely untouched.
**Done when:**
- The new column exists, migrates cleanly (`npm run db:reset` replays clean), defaults to `false`.
- The toggle UI appears only on the three named Sections, nowhere else.
- Toggling it on/off for one of the three named Sections actually changes whether 2+ Selections in that Section merge into one flowing paragraph, verified live in a real browser against a real liturgy.
- Assurance of Pardon (and every Section not in the three named ones) continues to merge unconditionally whenever it has 2+ Selections, with zero behavior change and no toggle UI shown.
- `npm test`, `tsc --noEmit`, `eslint`, `next build` clean.
**Do not:**
- Do not add the toggle to Assurance of Pardon or any Section beyond the three named ones.
- Do not change Assurance of Pardon's existing hardcoded merge behavior in any way.

---

### Ticket 21: Set Target unification — `ReaderTargetPicker` always-renders, greyed inactive mode

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** none
**Pattern to match:** `ReaderTargetPicker.tsx`'s existing mode-toggle buttons (lines ~72-97) for the greyed/disabled visual treatment — a disabled button in this codebase's existing convention (check `disabled:opacity-50`, already used elsewhere in this same file's "Set Target" buttons, as the disabled-state pattern to reuse).
**Files to touch:** `app/reader/page.tsx` (wherever it currently decides whether to render `ReaderTargetPicker` at all based on whether a target is already set — locate this condition and remove it so the picker always renders), `components/reader/ReaderTargetPicker.tsx`.
**Files to NOT touch:** `app/reader/ReaderClient.tsx`'s actual target-driven behavior (verse markers, Add panel, etc.) — this ticket only changes when/how the picker itself renders, not what happens once a target is set.
**Spec:**
Today, `ReaderTargetPicker` is only rendered by its parent when the Reader has no target yet (arriving via a plain `/reader` visit); a redirect arrival (`?liturgyId=&sectionIndex=` from Compile View) skips rendering it entirely. Change this so `ReaderTargetPicker` always renders, in every arrival case. Add a new prop reflecting how the page was arrived at (e.g. `arrivedVia: "none" | "section" | "library"`, derived from which URL params are present) so the component knows which mode to show as active-but-greyed vs. fully interactive:
- Arrived via `?liturgyId=&sectionIndex=` (Compile redirect): "Liturgy Section" mode shows active and still fully usable (can switch to a different Liturgy/Section, same as today's picker-when-no-target behavior) — "Scripture Library" mode's toggle button is present but disabled (`disabled:opacity-50` or equivalent), not clickable.
- Arrived via `?librarySection=` (the new Library deep-link, built in Ticket 22): the reverse — "Scripture Library" active/usable, "Liturgy Section" toggle disabled.
- Arrived with no target at all (plain `/reader` visit): both modes fully active, exactly as today.
Preserve every other piece of the picker's existing behavior (the `showModeToggle` visibility rule, the "Set Target" button logic, the empty-state `return null` when there's truly nothing to pick from) untouched.
**Done when:**
- Arriving via Compile View's "+ Scripture" link shows the picker (not hidden), with Liturgy Section pre-set-and-switchable and Scripture Library visibly disabled.
- Arriving via a plain `/reader` visit shows both modes fully active, unchanged from today.
- `tsc --noEmit`, `eslint`, `next build` clean; manually verified in a real browser for both arrival cases described above (the `?librarySection=` case can be verified once Ticket 22 lands its deep-link, or by manually constructing that URL in this ticket's own verification).
**Do not:**
- Do not change what happens once "Set Target" is actually clicked — only the picker's own visibility/disabled-state logic changes.
- Do not remove the existing empty-state `return null` behavior.

**Superseded 2026-09-01, confirmed with Madrid — read before touching this ticket's files again:** the `arrivedVia: "none" | "section" | "library"` prop described above was never built; the correction pass instead added a stricter `lockedTarget` prop to `ReaderTargetPicker.tsx`, computed only from a Compile-View arrival (`targetSection`), which renders a fully locked, non-interactive block rather than this ticket's "active but switchable, sibling mode greyed out" shape — a deliberate strengthening (the user genuinely cannot redirect a Compile-arrived Selection at all, not just "discouraged by a disabled toggle"). A `?librarySection=` arrival was left with no special treatment at all until a 2026-09-01 survey caught it: it fell through to the fully-open dual-mode picker, defaulting to "Liturgy Section" active with no indication the URL's Library choice was honored. Fixed same day with a lighter mechanism than this ticket originally specified: a new `initialLibrarySection` prop pre-selects "Scripture Library" mode and that Section, without locking it (the user can still switch, consistent with `architecture.md`'s "Reader retains its own normal picker" invariant for Library arrivals — only Compile-View arrivals get the hard lock). `app/reader/page.tsx` still does not unconditionally fetch `liturgies`/`librarySectionNames` for every arrival — it skips them only for a locked (`targetSection`) arrival, since `lockedTarget` never needs them; a `librarySection` arrival always fetches both, so this fix works without needing the ticket's original "always fetch" change.

---

### Ticket 22: `/library` "+ Add from Reader" deep-link; retire `/selections/new`

**Tier:** Junior-safe
**Required capability:** Junior-safe or higher; a stronger model may execute this ticket
**Depends on:** Ticket 21 (the greyed-picker behavior this deep-link relies on must exist first).
**Pattern to match:** `components/liturgy/SectionCard.tsx:839`'s existing `<Link href={\`/reader?liturgyId=${liturgyId}&sectionIndex=${sectionIndex}\`}>` deep-link — same shape, targeting `?librarySection=` instead.
**Files to touch:** `/library`'s Scripture Selections tab (wherever its current "+ Add Selection" link to `/selections/new` lives), `app/selections/new/` (delete this route entirely), any nav/link elsewhere pointing at `/selections/new`.
**Files to NOT touch:** `ReaderTargetPicker.tsx`'s internal mode logic (already built in Ticket 21) — this ticket only adds the new entry-point link and removes the old route.
**Spec:**
Add a new link/button on `/library`'s Scripture Selections tab, alongside (replacing) whatever currently links to `/selections/new`: `/reader?librarySection=<name>` for each real Library Section tag (mirror however the existing Compile-View deep-link is parameterized — likely one link per Section tag the way Formula/Prayer/Song "+ New" already scope by Section, or a single control with a Section picker if that's a better fit for this page's existing layout; use your judgment on the exact UI shape, but the destination URL pattern is fixed). Delete `app/selections/new/` entirely (route, its client component, everything under that directory) — per the confirmed decision to retire manual-entry in favor of the Reader-based flow exclusively. Search the codebase for any other link pointing at `/selections/new` and remove/redirect it.
**Done when:**
- `/library` has a working "+ Add from Reader" (or equivalently-named) entry point per Library Section tag, landing on `/reader?librarySection=<name>` with that mode pre-set-and-active (per Ticket 21's behavior).
- `app/selections/new/` no longer exists; visiting that URL directly returns Next.js's normal 404 (no dangling broken link anywhere else in the app).
- Adding a Scripture Selection via this new path successfully saves to `scripture_selections`, verified live in a real browser.
- `tsc --noEmit`, `eslint`, `next build` clean.
**Do not:**
- Do not delete or alter `lib/selections/scriptureSelectionActions.ts`'s `createScriptureSelection` — only the standalone form route goes away, not the underlying write path (the Reader-based flow already uses it, per Flow 1b in `architecture.md`).

**Superseded 2026-09-01, confirmed with Madrid:** the shipped entry point (`components/library/AddScriptureFromReaderLink.tsx`) is a single generic "+ New Scripture" link to `/reader?from=library`, not a per-Section-tag link to `/reader?librarySection=<name>` as this ticket specified — the Section choice is made once inside the Reader's own picker instead of at the Library entry point, avoiding a second, parallel Section-picker UI on the Library side (which the correction pass explicitly removed). `from=library` only drives the "Back to Library" label; see Ticket 21's superseded-note above for how a direct `?librarySection=` link (still supported, just no longer this ticket's own entry point) is now pre-selected rather than ignored.

---

### Ticket 23: Formula `item_types`/marking-table migration

**Tier:** Senior-required
**Required capability:** Senior-required — must run in the user-selected senior-capability mode, not a fresh Junior session.
**Why kept back:** this is the first tracked migration this repository will ever have for `item_types` — every prior change to that field was applied live and untracked in Production (a known, previously-flagged gap in `progress-tracker.md`'s 2026-08-25 Decisions Made entry). There is no existing migration to copy the shape of for editing a `jsonb` array nested inside `templates.sections`, and this change touches `architecture.md`'s Absolute Invariant "A Section only offers the Item types listed in its `templates.sections[].item_types` whitelist" directly.
**Depends on:** none
**Precedent (if any):** `supabase/migrations/20260826010000_fix_straight_apostrophes_in_section_names.sql` for the general shape of "a migration that edits `templates.sections` jsonb in place" (that one edited Section names inside the array; this one edits `item_types` arrays inside the array) — the closest existing pattern, though it edited a different field.
**Files to touch:** one new migration file; `lib/liturgy/markableSections.ts` (`FORMULA_MARK_SECTIONS`, `getFormulaMarks`); `components/liturgy/SectionCard.tsx` (delete `FORMULA_EXCLUDED_SECTIONS` and its usage, since the database whitelist now enforces the same exclusion).
**Files to NOT touch:** any Selection-marks logic (`DIALOGUE_MARK_SECTIONS`/`getSelectionMarks`) — Formula-only ticket.
**Spec:**
Write a migration that, for both templates' `sections` jsonb arrays, removes `'formula'` from the `item_types` array for exactly these three Sections: Charge (Morning), The Great Commission (Vesper), Benediction (both templates — it appears once per template). Leave every other Section's `item_types` untouched, including the other five Sections confirmed as Formula-eligible (Assurance of Pardon, Affirmation of Faith ×2 templates, Words of Thanksgiving). Use a targeted `jsonb` update (matching by Section `name` within the array, following whatever approach `20260826010000_fix_straight_apostrophes_in_section_names.sql` used for its own targeted in-array edit) rather than replacing the whole `sections` column wholesale — the goal is a minimal, auditable diff against the live data, not a full reseed.
Then update `markableSections.ts`: set `FORMULA_MARK_SECTIONS` to exactly —
```typescript
const FORMULA_MARK_SECTIONS: Record<string, Exclude<TextMark["type"], "bold">[]> = {
  "Assurance of Pardon": ["minister", "congregation"],
  "Words of Thanksgiving": ["congregation"],
};
```
(Charge/Great Commission/Benediction removed entirely — they're no longer Formula-eligible at all, so they need no entry.) Update `getFormulaMarks`'s Affirmation of Faith special case so **both** `kind` values (`"covenant"` and `"affirmation"`/default) return `["congregation", "small_caps"]` — currently only `"covenant"` does; `"affirmation"` returns `[]`. Delete `FORMULA_EXCLUDED_SECTIONS` from `SectionCard.tsx` and every place it's referenced (it gated Benediction's "+ Formula" add button as an app-code-only guard; the database whitelist now enforces the same thing, so the parallel mechanism is redundant and should be removed, not left in place as a second guard).
**Done when:**
- The live `item_types` query used to discover this list (`select t.name, s->>'name' from templates t, jsonb_array_elements(t.sections) as s where s->'item_types' ? 'formula'`) returns exactly: Assurance of Pardon, Affirmation of Faith (×2), Words of Thanksgiving — Charge/Great Commission/Benediction no longer appear.
- `getFormulaMarks("Affirmation of Faith", "affirmation")` and `getFormulaMarks("Affirmation of Faith", "covenant")` both return `["congregation", "small_caps"]`.
- `getFormulaMarks("Words of Thanksgiving")` (no `kind` arg needed — it's not Affirmation of Faith) returns `["congregation"]`.
- `FORMULA_EXCLUDED_SECTIONS` no longer exists anywhere in the codebase (`grep -r "FORMULA_EXCLUDED_SECTIONS"` returns nothing).
- The Compile View no longer offers "+ Formula" on Charge, Great Commission, or Benediction, verified live against real Morning and Vesper liturgies.
- `npm run db:reset` replays cleanly; `npm test`, `tsc --noEmit`, `eslint`, `next build` clean.
- Any pre-existing placed Formula item inside Charge/Great Commission/Benediction (if one exists in real data) is confirmed to still render correctly (removal governs adding only, per the existing Invariant precedent for whitelist changes — "an already-placed item never disappears if its type later drops off the whitelist").
**Do not:**
- Do not touch the `item_types` array for any Section beyond the three named ones.
- Do not remove any already-placed Formula item's data — this is an add-time whitelist change only.
- Do not skip writing this as a tracked migration in favor of another live/untracked Production edit — closing that gap is part of this ticket's purpose.

---

### Ticket 24: Song multi-Section tagging

**Tier:** Senior-required
**Required capability:** Senior-required — must run in the user-selected senior-capability mode, not a fresh Junior session.
**Why kept back:** this is the first many-to-many/join-table relationship in a schema that otherwise has no array or join-table columns at all (every existing relationship is either a foreign key or a scoping text column) — a genuinely new schema pattern, not an extension of an existing one. It also requires a real judgment call (same-title duplicate detection) the confirmed plan explicitly left as "attempt to detect/merge" rather than a fully pinned-down algorithm.
**Depends on:** none
**Precedent (if any):** none for the join-table shape itself; `lib/liturgy/translationPairing.ts` for the general style of a small dedicated `lib/liturgy/` module handling a cross-row relationship, though its shape (a self-referencing `paired_id` FK) is structurally different from a join table.
**Files to touch:** one new migration (`supabase/migrations/<timestamp>_song_section_tags.sql`), `lib/songs/getSongs.ts`, `lib/songs/songActions.ts`, `lib/liturgy/getSectionNames.ts` (the `"song"` case), the Compile View's Section-filtered Song picker (`SectionCard.tsx`/`AddSongPanel.tsx`, wherever songs are currently filtered by `section_name`).
**Files to NOT touch:** `songs.translation`/`songs.paired_id` and their existing pairing logic — unrelated to Section tagging, must continue working unchanged.
**Spec:**
Create a new join table:
```sql
create table song_section_tags (
  song_id uuid not null references songs(id) on delete cascade,
  section_name text not null,
  primary key (song_id, section_name)
);
alter table song_section_tags enable row level security;
```
Backfill: for every existing row in `songs`, insert one `song_section_tags` row from its current `section_name`. Then attempt same-title (within the same `kind` — a Psalm never merges with a Hymn) duplicate detection: for any set of `songs` rows sharing an identical `title` (exact string match) and `kind`, treat them as the same underlying Song that was duplicated across Sections under the old one-row-per-Section model — merge by keeping one canonical row (the earliest-created, or your own reasoned choice — state which and why) and re-pointing every duplicate's `section_name` as an additional `song_section_tags` row on the canonical row instead, then either delete the duplicate `songs` rows or leave them and only migrate the tags (your call — but any placed `SongItem.songId` referencing a row you delete would become a dangling reference, so if you choose to delete, you must also re-point any `section_items` rows referencing a merged-away `songs.id` to the canonical id first; if that's not safely automatable, leave duplicate rows in place, migrate only the tags, and flag the leftover duplicates for Madrid's manual review instead of guessing). Do not merge anything beyond an exact title+kind match — a near-match (different casing, extra whitespace) should be flagged for manual review, not auto-merged.
Rewrite `getSongs.ts` to join through `song_section_tags` instead of filtering on `songs.section_name` directly (an optional `sectionName` filter now means "has a tag for this Section," not "its one Section equals this"). Rewrite the Compile View's Section-filtered picker and `getSectionNames("song")` the same way. Keep `songs.section_name` as a column for now if dropping it risks breaking something not yet found (state your reasoning either way — dropping it is not required by this ticket, only ensuring nothing still depends on it as the source of truth).
**Done when:**
- `song_section_tags` exists, backfilled with one row per existing Song's original Section, RLS enabled.
- The Compile View's "Add Song" picker for a given Section shows every Song tagged for that Section, including a Song tagged for multiple Sections appearing correctly in each one without duplication of the underlying row.
- The duplicate-detection pass's outcome (how many exact title+kind duplicates were found, how each was resolved — merged or flagged) is reported in your completion report, not just silently applied.
- `npm run db:reset` replays cleanly; `npm test`, `tsc --noEmit`, `eslint`, `next build` clean; live-verified against local Supabase: a Song tagged for two Sections is placeable from both, and a real pre-existing duplicate (if any exist locally) is handled per your stated approach.
**Do not:**
- Do not merge anything beyond exact title+kind matches.
- Do not delete a `songs` row that's still referenced by a `section_items.data.songId` without first re-pointing that reference — a dangling reference must never be created silently.
- Do not touch `songs.translation`/`paired_id` pairing logic.

---

### Ticket 25: Prayer kind moves to a per-placement Compile View toggle

**Tier:** Senior-required
**Required capability:** Senior-required — must run in the user-selected senior-capability mode, not a fresh Junior session.
**Why kept back:** `prayers.kind` currently drives `resolveItemText.ts`'s `leaderOnly` derivation for Prayer (Bulletin-visibility) — an already-load-bearing field this ticket repurposes from "a property of the library entry" to "a property of where/how it's placed." That's a real behavior-and-meaning change to an existing mechanism, not a new field addition, and the per-Section default lookup's storage mechanism (a code lookup vs. a new column) is an open judgment call the confirmed plan didn't fully pin down.
**Depends on:** none
**Precedent (if any):** `lib/liturgy/amenPolicy.ts` for the shape of "a per-Section default policy, resolved in code, with a per-instance override stored on the placed item" — the closest existing pattern for exactly this kind of per-Section-default-plus-per-placement-override mechanism.
**Files to touch:** `components/prayers/PrayerForm.tsx` (remove the `kind` field/select entirely from create/edit), `lib/prayers/prayerActions.ts` (`createPrayer`/`updatePrayer` — remove `kind` from their signatures, or make it vestigial/ignored — your call, state which), a new `lib/liturgy/prayerKindPolicy.ts` (per-Section default, mirroring `amenPolicy.ts`'s shape), `components/liturgy/SectionCard.tsx` (new on/off switch UI for a placed Prayer, plus the Confession-of-Sin-defaults-on/everything-else-defaults-off logic), `types/liturgy.ts` (`PrayerItem` — needs its own per-placement `kind`/`isCorporate`-style field, since the library `Prayer.kind` is going away as the source of truth for placement behavior), `lib/liturgy/resolveItemText.ts` (Prayer's `leaderOnly` derivation, currently `prayer?.kind === "leader"` — must switch to reading the new per-placement field on the `PrayerItem` itself, not the library row).
**Files to NOT touch:** `prayers.is_guide` and `PrayerGuidePanel.tsx`'s existing guide-reference display — placeability (`is_guide`) is a separate concept from audience (`kind`) per the existing 2026-07-23 redesign, and only audience/`kind` is moving in this ticket; do not conflate the two.
**Spec:**
Remove `kind` entirely from `PrayerForm.tsx`'s create/edit fields and from what gets submitted — a Prayer's library row no longer carries an audience distinction at creation time. Add a per-Section default policy in `prayerKindPolicy.ts`: `getDefaultPrayerKind(sectionName: string): "corporate" | "leader"` returning `"corporate"` for exactly "Confession of Sin" and `"leader"` (i.e. Guide-only/off) for every other Section — mirror `amenPolicy.ts`'s exact structural shape (a typed lookup with a documented default-fallback). Add a per-placement `kind`/on-off field to `PrayerItem` (name it consistently with the rest of that type's snapshot fields), initialized from the Section's default policy value at placement time (same "snapshot at placement" convention `SongItem`/existing `PrayerItem` fields already follow) and changeable afterward via a new on/off switch rendered on the placed Prayer in `SectionCard.tsx`. Update `resolveItemText.ts`'s Prayer case to derive `leaderOnly` from this new per-placement field on `item` (the `PrayerItem` itself), not from `prayer?.kind` (the library row) — this is the actual behavior-and-meaning change this ticket exists to make.
**Done when:**
- `PrayerForm.tsx` no longer has a Kind field; creating/editing a Prayer in the Library never sets an audience.
- Placing a Prayer into Confession of Sin defaults its on/off switch to on/Corporate; placing it anywhere else defaults to off/Guide.
- Toggling the switch on an already-placed Prayer changes its Bulletin visibility (`leaderOnly`) live, independent of any other placement of the same library Prayer elsewhere (i.e. the same library Prayer placed in two different Sections can have different on/off states — confirms this is genuinely per-placement, not still secretly global).
- `PrayerGuidePanel.tsx`'s `is_guide`-driven reference display is completely unaffected by any of this.
- `npm test`, `tsc --noEmit`, `eslint`, `next build` clean; live-verified against local Supabase: place the same library Prayer into Confession of Sin and into a different Section, confirm each gets its own independent on/off state and correct Bulletin-visibility behavior in a real docx export.
**Do not:**
- Do not touch `is_guide`/`PrayerGuidePanel.tsx` — placeability stays exactly as it is today.
- Do not leave `resolveItemText.ts` reading from the library row's old `kind` field anywhere — that's the actual bug this ticket closes; a partial fix that still reads the old field in some path is not done.

---

### Ticket 26: Library add-modal (Song/Prayer/Formula)

**Tier:** Senior-required
**Required capability:** Senior-required — must run in the user-selected senior-capability mode, not a fresh Junior session.
**Why kept back:** this introduces a new UI pattern (a multi-field form inside a modal) that doesn't exist anywhere in this codebase today — the only existing modal usage (`components/ui/Modal.tsx`) is for short confirm dialogs, not a full create/edit form; there is no precedent to mechanically copy. It also depends on Tickets 23-25's field changes all being final before its field sets can be built correctly.
**Depends on:** Ticket 23 (Formula's marking table), Ticket 24 (Song's multi-Section tagging), Ticket 25 (Prayer's kind removal) — this ticket's three field sets are only correct once all three land.
**Precedent (if any):** `components/ui/Modal.tsx` for the base modal shell (dialog semantics, focus containment, Escape dismissal — already fully accessible per the 2026-08-25 Modal accessibility work) as the wrapper; `SongForm.tsx`/`PrayerForm.tsx`/`FormulaForm.tsx` for the field logic to relocate inside it — reuse these components' internals rather than rewriting field logic from scratch.
**Files to touch:** new `components/library/AddLibraryItemModal.tsx` (or a small family of type-specific modal components sharing one sized shell — your call on exact composition, but the three modals must be visually the same size regardless of type, per the confirmed decision), `/library`'s page/tab components (wire the modal trigger in place of the old `/new` page links), deletion of `app/songs/new/`, `app/prayers/new/`, `app/formulas/new/` entirely.
**Files to NOT touch:** `SongForm.tsx`/`PrayerForm.tsx`/`FormulaForm.tsx` internals beyond what's needed to host them inside a modal instead of a page (their field logic, validation, and submit-handling should be reused, not rewritten).
**Spec:**
Build a modal-shell component wrapping `Modal.tsx`, sized identically across all three item types. Inside it, render the appropriate existing form component (`SongForm`/`PrayerForm`/`FormulaForm`, each already updated by Tickets 23-25's changes — Song now Section-tag-multi-select via `song_section_tags`, Prayer with no Kind field, Formula with the Ticket 23 marking table wired through `getFormulaMarks`), triggered from a "+ Add [Song/Prayer/Formula]" control on `/library`'s corresponding tab. On successful save, close the modal and refresh the Library list (matching whatever revalidation pattern the existing forms' `router.push("/library")` was achieving — likely `router.refresh()` instead, since there's no longer a page navigation to rely on). Delete `app/songs/new/`, `app/prayers/new/`, `app/formulas/new/` entirely once the modal path is confirmed working — do not leave the old pages in place as a redundant second entry point.
**Done when:**
- All three item types can be created from `/library` via the new modal, with the exact field sets confirmed in the charter session (Song: Section tags multi-select, Kind, Title, Versification/author [Psalm-only], Year published, Additional Information, Language, Translation-of; Prayer: Section, Title, Prayer Content, Language, Translation-of, no Kind; Formula: Title, Content, marking toolbar per Ticket 23's table, Language, Translation-of).
- All three modals are visually the same size; only their field content differs.
- `app/songs/new/`, `app/prayers/new/`, `app/formulas/new/` no longer exist; no dangling link anywhere in the app points at them.
- `tsc --noEmit`, `eslint`, `next build` clean; live-verified in a real browser: create one of each item type via the new modal, confirm it appears correctly in `/library` afterward with all fields saved.
**Do not:**
- Do not rewrite `SongForm`/`PrayerForm`/`FormulaForm`'s field/validation logic — host the existing components, don't reimplement them.
- Do not leave any of the three old `/new` pages reachable after this ticket completes.
