# Progress Tracker Archive — Banka Docking & Adoption (BA-001/BA-002 Memory)

Carried forward verbatim from `ADOPTION-ASSESSMENT.md` (project root, produced
during Docking, 2026-08-24) per explicit instruction — this is the direct
evidence behind that assessment's two Resolved readiness findings (BA-001,
BA-002), not narrative color, and is not to be compressed away. Moved from
`context/progress-tracker.md`'s "Memory during Banka Docking Protocol"
section into Protocol §2.9's Overflow Index on 2026-08-25 (settled boundary:
both findings closed, adoption completed, same session) — see
`context/progress-tracker.md`'s Overflow Index and Decisions Made for the
settled facts that came out of this work; come here only when you need the
full story behind one of them.

---

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

**2026-08-24 — Banka adoption**

- `Ready for Banka` status (above) plus Madrid's explicit election to
  continue triggered Banka adoption per `/Users/madridj1689/Code/projects/banka-docking-protocol/handoff/BANKA-HANDOFF.md`
  and current Banka protocol 1.1.0 at `/Users/madridj1689/Code/projects/Banka`.
- Classified as a legacy Standard-tier Banka authority (`CLAUDE.md` carried
  the `# Project Operating Protocol` heading; `/context/` already held all 9
  required Standard-tier files) — migrated via Section 3.2's explicit
  sequence, previewed and confirmed by Madrid before any file was touched.
- Complexity rubric re-confirmed Standard tier at 5/5 yes, matching the
  shape already in place.
- Migration applied: `AGENTS.md` created as the new schema-2 canonical
  authority (this project's real Persona/Critical-context content carried
  over, not placeholder text); `CLAUDE.md` reduced to the one-line
  `@AGENTS.md` import shim; `IDEA-SCOPE.md` backfilled from the existing
  `context/project-overview.md`/`architecture.md`/`build-plan.md` as the
  permanent origin record; all 9 `context/*.md` files (plus the extra
  `redesign-plan-v1.1.md`, not one of the required 9) left untouched.
- Skills decision: Madrid chose to switch from this project's prior local
  skill set (`/architect`, `/review`, `/recover`, `/remember`, `/imprint`)
  to Banka's canonical Skills Kit (`charter`, `survey`, `dredge`, `remember`,
  `moor`, `scale`, `delegate`, `watershed`, `linis`) — installed at
  `~/.claude/skills/` from `/Users/madridj1689/Code/projects/Banka/skills-kit/`
  in this same session. The older skill names are retired for this project.
