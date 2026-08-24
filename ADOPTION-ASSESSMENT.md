# Adoption Assessment — liturgy-compiler-docx

## 0. Document control

- Assessment date: 2026-08-24
- Assessor: Claude Code (Docking pass), authorized by Madrid
- Existing project owner: Madrid (partikularwaters)
- Repository and path: `partikularwaters/liturgy-compiler-docx`, local path `/Users/madridj1689/Code/projects/liturgy-compiler-docx`
- Branch and commit/revision: `main` @ `21f0cd3` (2026-07-29 18:55:04 +0800), plus an uncommitted working tree (18 modified files, 10 untracked files — see §3, §6 BA-002)
- Environments in scope: local / production (Vercel + Supabase, live at https://liturgy-compiler-three.vercel.app). Preview (Vercel) is in scope for one specific finding (BA-001) only; not separately walked end-to-end.
- Assessment status: **Readiness work required**
- Protocol version: 0.1.0-draft
- Assessment revision and supersedes: 1 (first assessment for this project)

## 1. Purpose and authorized scope

- Project purpose and intended outcome: web app letting a liturgist compile Scripture, liturgical formulas, and prayer into a coherent order of worship for Reformed Life Community Church, with a bilingual Bible reader and dual `.docx` export (Leader Guide / Congregation Bulletin). Full detail: `context/project-overview.md`, `context/architecture.md`, `context/build-plan.md`.
- Assessment boundary: this Docking pass — read-only discovery plus minimal, individually-authorized readiness fixes if a genuine handoff-blocking gap surfaced. No Phase 4 corrective work was performed this pass (see §8).
- Authorized actions: inspect repository, docs, git history, dependencies, tests, lint, typecheck, local build; run already-established local npm scripts (`test`, `lint`, `tsc --noEmit`). No new dependency installs, no privileged-system access, no Git writes, no production access.
- Prohibited actions: any Git commit/push, any production or Preview deployment change, any Supabase key rotation, any file deletion, any change outside a proposed-and-confirmed readiness fix.
- Decision owners and external system owners: Madrid owns the project, the GitHub repo, the Vercel project, and the Supabase project. No separate external owners identified.
- Sensitive-data and privacy boundary: `SUPABASE_SERVICE_ROLE_KEY` is the one secret in scope; per `docs/OWNER-GUIDE.md` it is a Vercel Sensitive value and is never present in this repo's tracked files. No secret values were read or recorded here — only the fact of the key's existence and its known Preview-exposure gap (BA-001).

## 2. Evidence inventory

| Evidence ID | Source and location | Date checked | Authority: Observed / User-supplied / Assumption | Confidence and limits |
| --- | --- | --- | --- | --- |
| EV-001 | `git status`, `git log -1`, `git remote -v` | 2026-08-24 | Observed | Local clone only; does not confirm GitHub remote's own protection rules |
| EV-002 | `context/project-overview.md`, `architecture.md`, `build-plan.md` | 2026-08-24 | Observed | Read in full for project-overview.md; architecture/build-plan referenced via progress-tracker, not re-read line by line this pass |
| EV-003 | `context/progress-tracker.md` (Decisions Made, Known Issues, Session Notes) | 2026-08-24 | Observed (project's own prior session record) | Authored by prior sessions of this same assistant/user pairing, not independently re-verified fact by fact except where cross-checked below |
| EV-004 | `docs/PHASE-0-DATABASE-RECONCILIATION.md` | 2026-08-24 | Observed | Documents its own verification steps; production claims within it are User/prior-session-supplied, not re-verified live by this pass |
| EV-005 | `docs/OWNER-GUIDE.md` | 2026-08-24 | Observed | Same limits as EV-004 |
| EV-006 | `npm test` (vitest run) — 2 files, 6 tests, all passing | 2026-08-24 | Observed, this pass | Local only |
| EV-007 | `npx tsc --noEmit` — zero errors | 2026-08-24 | Observed, this pass | Local only |
| EV-008 | `npm run lint` — 1 error (`ReaderClient.tsx:69`, set-state-in-effect), 3 warnings | 2026-08-24 | Observed, this pass | Local only; matches EV-003's own record of the same pre-existing issue |
| EV-009 | `package.json` scripts and dependencies | 2026-08-24 | Observed | — |
| EV-010 | `supabase/migrations/` — 33 files present | 2026-08-24 | Observed (file count only; not replayed this pass) | Replay itself is User/prior-session-supplied (EV-003/EV-004), not repeated in this pass |
| EV-011 | `.env.local.example` — three variable names only, no values | 2026-08-24 | Observed | No `.env.local` value was opened or read; only its existence and permissions were noted (file present, not inspected) |

Credential location: `SUPABASE_SERVICE_ROLE_KEY`, held in Vercel environment variables (Production, marked Sensitive) and in a local, git-ignored `.env.local` pointed at a disposable local Supabase instance per `docs/OWNER-GUIDE.md`. No value recorded here.

## 3. Project reality

### Architecture and source layout
Next.js App Router (TypeScript strict), Supabase/Postgres, Tailwind v4. Domain logic in `lib/liturgy/`, `lib/selections/`, `lib/bible/`; components in `components/liturgy/`; Server Components for reads, Server Actions for mutations (established convention, confirmed in `context/code-standards.md` per EV-003's session notes). `docx` library for Word export; legacy `@react-pdf/renderer` pipeline frozen in place in `lib/pdf/`.

### Dependencies and supported runtimes
Next.js 16.2.10, React 19.2.4, TypeScript 5, Supabase JS 2.110.2, `docx` 9.7.1, Vitest 4.1.10 (dev), Supabase CLI 2.114.0 (dev). See BA-005 for a known audit gap.

### Commands and observed results
`npm run dev`/`build` gate on `npm run env:check` (`scripts/check-env.mjs`) before starting. This pass ran and confirmed: `npm test` (6/6 passing), `npx tsc --noEmit` (clean), `npm run lint` (1 pre-existing error, 3 warnings — matches project's own Known Issues record). Local Supabase replay (`supabase db reset` against all 33 migrations) was not re-run this pass; its prior success is recorded in EV-003/EV-004 as evidence from an earlier session, not this one.

### Tests and verification paths
`vitest.config.mts` present; two test files (`formatCitation.test.ts`, `mutationAuthorization.test.ts`), 6 focused tests, all passing locally this pass. `scripts/verify-db-contract.mjs` is a hostname-locked local-only RLS/grant verification script (not re-run this pass — would require a running local Supabase instance).

### Automation, deployment configuration, and instruction files
No `.github/` workflows found. Deployment is Vercel, connected directly to the GitHub repo (no CI config file observed in-repo). `CLAUDE.md` at project root is the existing instruction file; `context/` holds the eight-file Standard-tier documentation set referenced by `CLAUDE.md`.

### Version-control state and authoritative branch
`main` is the sole branch, tracking `origin/main`, HEAD at `21f0cd3`. The working tree carries substantial uncommitted work (see BA-002) — this is the single most important piece of project reality for a truthful handoff, since a plain `git clone` of `origin/main` right now would **not** reflect the completed local Phase 0 database-contract work or the partial Phase 1 authorization containment described in `context/progress-tracker.md`.

## 4. Environment reality

| Environment | What was observed | Evidence | Owner | Access/authority limits | Unknowns |
| --- | --- | --- | --- | --- | --- |
| Local | Clean install runs; tests/typecheck/lint pass or match known exceptions; local Supabase replay previously verified (not repeated this pass) | EV-006–EV-010 | Madrid | Full | Whether the uncommitted working tree state matches what a fresh `npm install` + `.env.local` copy would reproduce exactly — not re-tested this pass |
| Preview/staging | Vercel Preview deployments currently receive the same privileged Supabase service-role secret as Production (BA-001) | EV-005, `docs/OWNER-GUIDE.md` lines ~44, ~121–123 | Madrid (Vercel project owner) | Not separately walked live this pass — read from prior-session documentation only | Whether any Preview deployment has actually been exploited; whether a Preview-specific Supabase project already exists |
| Production | Live at https://liturgy-compiler-three.vercel.app. Database-contract migration applied and verified 2026-08-16 (RLS on all 12 tables, service-role-only `create_liturgy()`, `authenticated` limited to `user_roles` read). Anonymous read paths, both DOCX exports, and Madrid's own sign-in/role/Compile-View/sign-out checks passed live per `docs/PHASE-0-DATABASE-RECONCILIATION.md` | EV-004 | Madrid | This pass did not re-touch or re-verify production live; relies on the prior session's recorded verification | The Phase 1 authorization fixes (Prayer Guide/column-break/Vesper-reading gating) are **not yet deployed to Production** — they exist only in the uncommitted local working tree (BA-002) |

Never use local success as proof of production state — noted explicitly because the most material gap in this project right now is exactly that local (uncommitted) ≠ deployed Production.

## 5. Documentation versus observed behavior

| Claim | Observed reality | Evidence | Consequence | Finding ID |
| --- | --- | --- | --- | --- |
| `context/progress-tracker.md` states Phase 1's authorization containment (Prayer Guide, column-break, Vesper-reading gating) is complete and tested | True locally, but the corresponding code is uncommitted and not deployed — Production still runs the pre-fix code path | EV-003 session note "No Phase 1 code has been deployed"; `git status` showing those exact files modified and unstaged | Anyone reading only the docs (not `git status`) would believe Production is already protected against the "anonymous visitors can reach client-callable compile mutations" issue, when it is not | BA-001, BA-002 |
| README's Known Issues / progress-tracker's Known Issues table lists ESLint as "one pre-existing error, three warnings" | Confirmed identically by this pass's own `npm run lint` run | EV-008 | None — documentation matches observed behavior here | — |

## 6. Findings

| ID | Classification | State | Finding and impact | Evidence | Proposed owner | Completion test | Resolution/supersession record |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BA-001 | Readiness requirement | Resolved | Vercel Preview deployments shared the Production Supabase service-role secret. | EV-005 (`docs/OWNER-GUIDE.md` "Planned key migration" / "Preview scope is not accepted as a permanent configuration") | Madrid | New Supabase secret key created and scoped to Vercel Production only; existing default publishable key adopted to replace the legacy `anon` key (also Production-only); Vercel Preview deployments disabled entirely (Environments → Preview → Branch Tracking off) rather than given a separate non-prod project, since this is a single-developer project with no PR-review workflow; legacy `anon`/`service_role` JWT-based keys disabled in Supabase after live verification. Verifier: Madrid, 2026-08-24, live checks on https://liturgy-compiler-three.vercel.app (anonymous Home/Reader with real DB content, sign-in, both DOCX exports, signed-out guard) — see "Memory during Banka Docking Protocol" below for the full step sequence. |
| BA-002 | Readiness requirement | Resolved | `main`'s HEAD (`21f0cd3`) did not reflect the completed local database-contract work or the partial Phase 1 authorization containment sitting uncommitted in the working tree. | EV-001, EV-003 (2026-08-16 session note) | Madrid | Working tree split into 5 reviewed commits (`0e43007`, `c2a4e16`, `de8dc52`, `bcd9402`, `05e708c`) plus a follow-up `9873c8a` untracking `.claude/settings.local.json`, all pushed to `origin/main`. Verifier: Madrid, 2026-08-24, `origin/main` confirmed matching local HEAD and live Production deploy verified working. |
| BA-003 | Stabilization backlog | Open | `section_items.position` can duplicate after deletion or concurrent insertion — confirmed in source per project's own record; needs atomic insertion plus a database uniqueness guarantee. | EV-003 Known Issues table | Madrid/future session | Concurrent/duplicate-position scenario no longer reproduces; DB constraint enforces uniqueness | Not re-verified independently this pass — carried forward from project's own record |
| BA-004 | Stabilization backlog | Open | Item-read errors can surface as a successful, silently empty/partial DOCX export rather than a visible failure. | EV-003 Known Issues table | Madrid/future session | A forced item-read error produces a visible failure, not a truncated but "successful" export | Carried forward, not independently re-verified this pass |
| BA-005 | Stabilization backlog | Open | Next.js 16.2.10 and its transitive PostCSS/Sharp versions have three high-severity `npm audit` findings; 16.3.1 is the noted repair candidate. | EV-003 Known Issues table (not re-run via `npm audit` this pass — no new dependency operations were authorized) | Madrid/future session | `npm audit` reports the three findings resolved after a verified upgrade batch | Carried forward |
| BA-006 | Stabilization backlog | Open | Full ESLint run: 1 error (`ReaderClient.tsx:69`, `react-hooks/set-state-in-effect`) + 3 warnings. | EV-008 (confirmed live this pass) | Madrid/future session | `npm run lint` reports zero errors | Independently reconfirmed this pass, matches prior record |
| BA-007 | Stabilization backlog | Open | Automated Vesper reading row "Matthew 5–7" rests on an unresolved OCR correction, not yet confirmed against the printed handbook. | EV-003 Known Issues table | Madrid | Confirmed against the printed source or corrected | Content-correctness item, not a technical/security concern |
| BA-008 | Observation | Open | A BibleGateway/PBS permission request for AB2001/MBB adaptation display is drafted but not yet sent or answered. | EV-003 Known Issues table | Madrid | Request sent and a response received/recorded | No blocking effect on current app behavior (existing display arrangement continues) |
| BA-009 | Readiness requirement | Resolved | Production's actual hosted defaults (auto-RLS, broad API grants, no `notifications` table) diverged from a clean local migration replay — the migrations alone did not fully own the security/runtime contract. | `docs/PHASE-0-DATABASE-RECONCILIATION.md`; EV-004 | Madrid (completed 2026-08-16) | All 12 application tables confirmed RLS-enabled in Production; anonymous/authenticated access denied where intended; service role confirmed working; verifier: Madrid, 2026-08-16 | Resolved via `20260815010000_explicit_database_contract.sql`, applied to Production 2026-08-16 |

Retained per protocol: no findings were superseded or renumbered this pass; this is the assessment's first revision.

## 7. Scope clarity

- Scope is sufficiently clear: **yes**
- Decision-ready scope source, filename, and owner: `context/project-overview.md` + `context/architecture.md` + `context/build-plan.md`, owned by Madrid — an existing, detailed, decision-ready scope source; no new scoping exercise (ASMP) was requested or needed.
- Evidence for the decision: `project-overview.md` names the app's purpose, users, page-by-page flows, data model, and invariants in enough detail to judge readiness against; `context/progress-tracker.md`'s Decisions Made log shows scope questions being actively resolved rather than left ambiguous.
- Open scope questions and consequence: none material to Docking's readiness judgment. Feature-level open items (e.g. Songs library management, Formula delete-in-place — noted in `progress-tracker.md`'s transfer-prep note) are ordinary in-flight product scope, not a Docking blocker.
- Optional clarification route chosen, if any: none — owner confirmed inline rather than via ASMP (per the authority Q&A that opened this pass).

## 8. Minimal readiness actions

| Finding ID | Authorized action | Authorized by/date | Change made | Verification | Rollback or reversibility |
| --- | --- | --- | --- | --- | --- |
| — | None performed | — | No Phase 4 corrective work was taken this pass. Both open Readiness requirements (BA-001, BA-002) require Madrid's own authority — Supabase/Vercel dashboard access for BA-001, and a deliberate commit-boundary decision for BA-002 — neither of which Docking may perform on the owner's behalf without separate, specific authorization. | — | — |

## 9. Stabilization backlog

| Finding ID | Item | Priority | Proposed owner | Trigger or next step | Why it does not block handoff |
| --- | --- | --- | --- | --- | --- |
| BA-003 | Fix `section_items.position` duplication (atomic insert + DB uniqueness constraint) | Critical (app-level) | Madrid/future session | Next time Sections/items ordering logic is touched | Data-integrity bug, not a handoff-truthfulness or safety issue — already documented and tracked by the project itself |
| BA-004 | Fail-closed DOCX export on item-read error | Critical (app-level) | Madrid/future session | Before next export-path change | Same reasoning as BA-003 |
| BA-005 | Upgrade Next.js to 16.3.1 (dependency audit repair) | High | Madrid/future session | Verified upgrade batch, isolated from feature work | Known, already scheduled as a separate verified batch per the project's own decision log |
| BA-006 | Fix `ReaderClient.tsx` set-state-in-effect lint error + related warnings | Medium | Madrid/future session | Next time Reader interactivity is touched | Cosmetic/code-health, does not affect current behavior |
| BA-007 | Confirm Vesper "Matthew 5–7" reading against printed handbook | High (content) | Madrid | Before that reading is next used live | Content-correctness, not a technical handoff concern |
| BA-008 | Send/track PBS permission request for AB2001/MBB adaptation | Low | Madrid | Whenever Madrid is ready to send it | No current functional dependency on its answer |

## 10. Recovery, security, and production safety

- Secret and private-data handling: `SUPABASE_SERVICE_ROLE_KEY` is the only secret; Vercel-Sensitive in Production, git-ignored locally, never observed or recorded by value in this pass. `.env.local.example` correctly holds names only.
- Backup status, evidence, owner, and limits: two owner-only, FileVault-protected local backups exist per `docs/OWNER-GUIDE.md` (`2026-08-15-0221-PHT` and `2026-08-15-phase0-prechange`), each containing `roles.sql`/`schema.sql`/`data.sql`. Not re-verified by this pass; taken on Madrid's authority in a prior session.
- Restore/rollback path and verification: documented in `docs/PHASE-0-DATABASE-RECONCILIATION.md`'s Rollback posture section — stop writes, restore from the verified backup/pre-change schema dump; explicitly does not recommend broadly restoring anonymous table access as a fix.
- Production owner and explicit authority status: Madrid, sole owner; this Docking pass performed no production access and holds no standing production-mutation authority.
- Proposed production action, if separately authorized: none proposed by this pass. BA-001's remaining containment steps (new secret key, Preview isolation, legacy-key revocation) would need separate, explicit authorization when Madrid is ready.
- Post-change verification and stop conditions: not applicable — no change was made this pass.

## 11. Readiness decision

- Status: **Ready for Banka**
- Supporting finding IDs and evidence: BA-001 and BA-002, this project's only open Readiness requirements, are both now Resolved (see §6) with owner-verified live evidence dated 2026-08-24. All other findings (BA-003 through BA-008) are Stabilization backlog, not blocking; BA-009 was already Resolved as of 2026-08-16.
- Unresolved blockers or readiness requirements: none.
- Explicitly unverified claims: local Supabase migration replay and the full Production reconciliation record (EV-003/EV-004) remain prior-session evidence, not independently re-replayed by this pass — carried forward as a bounded limitation, not a blocker, since Production's live behavior was independently re-verified twice this session (post-secret-key swap, post-publishable-key swap).
- Decision owner and date: Madrid, 2026-08-24.
- Why this status is truthful and safe: both readiness requirements were resolved with real, owner-performed changes (not merely reclassified) and confirmed against the live Production site after each change, not assumed. `Ready for Banka` does not mean adoption is complete — see §12 for the actual next action and the required owner election to continue.

`Ready for Banka` does not mean Banka adoption is complete.

## Memory during Banka Docking Protocol

This section exists so the session-by-session record of *how* BA-001 and BA-002
were actually closed is not lost between this assessment and whatever
Banka-managed session-state file succeeds it (e.g. `context/progress-tracker.md`
under a Standard-tier adoption). On Banka adoption, carry this section's content
into that file's session-notes/decisions log rather than discarding it — it is
the direct evidence behind the two Resolved findings above, not narrative
color.

**2026-08-24 — Docking assessment, then same-session readiness closure**

- Ran a full Docking pass (read-only discovery, authority: read-only plus
  minimal readiness fixes with each fix individually confirmed). Produced this
  assessment with two open Readiness requirements: BA-001 (Preview shared
  Production's privileged Supabase key) and BA-002 (`main` didn't reflect real
  project state — Phase 0/Phase 1 work sat uncommitted).
- **BA-002 closed first.** The uncommitted working tree was split into 5
  reviewed commits, each proposed with a full commit message and confirmed by
  Madrid individually before the next was staged: `0e43007` (require sign-in
  for Vesper-reading/column-break/Prayer-Guide actions — the Phase 1
  authorization fix), `c2a4e16` (remove hardcoded production `auth.users`
  UUIDs from the `user_roles` migration), `de8dc52` (add Vitest, Supabase CLI,
  and the env preflight check as local dev tooling), `bcd9402` (the explicit
  database-contract migration — already live in Production since 2026-08-16,
  this commit only caught Git up to that reality), `05e708c` (Speed Insights
  and doc updates). A sixth commit, `9873c8a`, followed separately to stop
  tracking `.claude/settings.local.json` (per-machine Claude Code permission
  grants, not shared project config — added to `.gitignore`, file kept on
  disk). All six were pushed to `origin/main` together in one push, verified
  matching, and the resulting Production deploy was verified live (anonymous
  Home/Library/Reader, signed-out `/liturgy/new` guard, signed-in Compile View,
  both DOCX exports).
- **BA-001 closed second**, now that the Phase 1 fixes were actually deployed
  (a precondition for the rotation plan). Sequence actually followed:
  1. Created a new Supabase **secret key** (replacing the legacy
     `service_role` key), added to Vercel scoped **Production only**, marked
     Sensitive.
  2. Hit a real Vercel UI limitation along the way: an existing environment
     variable's environment scope could not be edited in place — changing
     Production/Preview scope required deleting the variable and re-adding it
     fresh with the correct scope checked.
  3. Verified the new secret key live before touching anything else.
  4. Decided to disable Vercel Preview deployments entirely (Environments →
     Preview → Branch Tracking off) rather than give Preview its own
     non-production Supabase project — proportionate for a single-developer
     project with no PR-review workflow; local Supabase (already set up via
     `supabase/config.toml` and `npm run db:start`/`db:reset`) plus
     `npm run dev`/`build`/`test` already covers the development-without-
     touching-Production need that Preview would otherwise have served.
  5. Replaced the legacy `anon` key with an **already-existing default
     publishable key** on the Supabase project (no need to generate a new
     one) — kept under the existing `NEXT_PUBLIC_SUPABASE_ANON_KEY` variable
     name rather than renaming it, since the app code reads that exact
     variable name in several places and a rename would require a coordinated
     code change, not just a dashboard edit. This is recorded as a deferred,
     non-blocking cleanup item, not a defect.
  6. Verified live again after the publishable-key swap: the homepage loaded
     real recent-liturgies data, and `/reader` rendered real AB1905 Filipino
     verse text (Psalms 95) — genuine end-to-end database reads on the new
     key, not cached or placeholder content.
  7. Only after both new keys were confirmed live did Madrid disable the
     legacy `anon`/`service_role` JWT-based key pair in Supabase's dashboard
     ("Disable JWT-based API keys").
- Net effect: Production now runs on Supabase's newer publishable/secret key
  pair, scoped Production-only; Preview deployments no longer exist for this
  project; the legacy key pair is fully retired.

## 12. Handoff package and unresolved dependencies

- This assessment: `ADOPTION-ASSESSMENT.md` (this file), kept at project root, not yet committed pending Madrid's review.
- Decision-ready scope source: `context/project-overview.md`, `context/architecture.md`, `context/build-plan.md` (owner: Madrid).
- Verified commands and environment facts: `npm test` (6/6 pass), `npx tsc --noEmit` (clean), `npm run lint` (1 known error, 3 known warnings) — all verified live this pass, 2026-08-24.
- Stabilization backlog and owners: BA-003 through BA-008, all owned by Madrid/future session (see §9).
- Explicit exclusions and prohibited actions: no Git writes, no production/Preview changes, no key rotation, no dependency installs performed by this pass.
- Unresolved external dependencies and owners: Supabase Dashboard and Vercel project access for BA-001 — Madrid only.
- Receiving workflow and current authoritative link: status is `Ready for Banka` as of 2026-08-24. Per the Adoption Guide, reaching this status permits Banka adoption to begin but does not itself begin it — Madrid must still explicitly elect to continue. If he does, use [the Banka handoff](../banka-docking-protocol/handoff/BANKA-HANDOFF.md) and current Banka protocol at `/Users/madridj1689/Code/projects/Banka`; that process determines its own tier, `AGENTS.md` structure, and adopted state. On adoption, carry the "Memory during Banka Docking Protocol" section above into the resulting Banka-managed session-state file (e.g. `context/progress-tracker.md` under Standard tier) rather than discarding it.
- Next action and owner: Madrid decides whether to stop here with this completed assessment, or elect to continue into Banka adoption.
- Stop acknowledgement: this pass stops here with status `Ready for Banka`, per Docking's own Phase 6 — awaiting Madrid's election to continue or stop.
