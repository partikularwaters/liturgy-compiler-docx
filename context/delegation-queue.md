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

- [ ] Ticket 1: Publication ledger migration — add `liturgies.status`/`ready_by`/`ready_at`, create `liturgy_publications`
- [ ] Ticket 2: Completion policy and progress computation (`lib/liturgy/readiness.ts`)
- [ ] Ticket 3: Weekly Sunday-liturgy idempotent ensure (`lib/liturgy/ensureWeek.ts`)
- [ ] Ticket 4: Compile View progress bar and Mark Ready control — *depends on Tickets 2 and the Senior-required markReady/markDraft ticket below both being done first*
- [ ] Ticket 5: Manual-fallback documentation note in `context/architecture.md`

## Kept with the current session (Senior-required)

- [ ] Ticket 6: `markReady()`/`markDraft()` + wiring into `lib/liturgy/sectionItems.ts`'s three write chokepoints — cross-cutting: this is the single, already-documented "only place that writes to `section_items`" that every one of the six item types and every renderer depends on (`architecture.md`'s `section_items` section and its Invariants). A subtle mistake here breaks Selection/Formula/Prayer/Sermon/Song/Verbal-Cue mutation for the whole app, not just this feature.
- [ ] Ticket 7: New automation API surface under `app/api/automation/`, plus the dedicated automation credential it authenticates with — establishes a genuinely new authentication pattern (machine-to-machine, not the existing human Curator/Compiler session model) with no existing pattern in this codebase to copy the shape of. The charter's own Assumptions section left the credential's exact shape unresolved ("a dedicated role vs. a signed-token scheme") — a real judgment call, not something a fresh Junior session should invent alone.
- Ticket 8 (not a code ticket): n8n workflow construction (Monday/Wed/Fri/Saturday triggers, Gmail node wiring, branching logic) — requires Madrid's own n8n instance access and Gmail credential setup; no repository code is touched. Whoever builds this needs live access to those external accounts, which this delegation queue cannot grant.
- Ticket 9 (not a code ticket): UptimeRobot second heartbeat monitor + Render capacity confirmation — same as above: external-account configuration (UptimeRobot dashboard, Render workspace), not a code change. Requires Madrid's own account access.

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
