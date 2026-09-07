# Owner-Only Release Governance

This file is regulated by the repository owner. It is not contributor
guidance, package documentation, or a public compatibility promise —
Liturgy Compiler has no published package and no general public who
"upgrades" to a new version.

Adapted from Banka's own `RELEASE-GOVERNANCE.md`, rewritten for this
project's real shape: continuous deployment to Production on every push to
`main`, a single app with no separate consumers to keep lockstep with,
except one.

## One version axis, applied after the fact

Unlike a project with a discrete publish step, every push to `main`
deploys to Production immediately — there is no moment where "the release
happens." A version number here is a label applied *retroactively* to a
commit already live, marking a point in history worth naming. It never
gates or precedes a deploy.

There is no second "state-schema version" axis (Banka tracks one because it
generates file structure other repositories must migrate against — this
project generates nothing for anyone else to adopt).

The `"v1"` / `"v1.1"` / `"v2"` / `"v3"` labels already used throughout
`context/project-overview.md`, `context/architecture.md`, and
`context/build-plan.md` are informal scope/phase labels, unrelated to this
file. Do not conflate a phase label with a release version — a commit
belonging to "v2" scope work might land inside release `0.3.0`, and that is
expected, not an inconsistency to resolve.

## Release impact

- **Major:** a breaking change to `app/api/automation/*`'s request or
  response contract, made without updating the n8n Liturgy Automation
  workflow to match. This is the one real "established consumer" this
  project has — everything else (public congregation-facing pages, the
  Reader, shared Web View links) is a website people click through, not a
  contract anyone programmatically depends on staying the same.
- **Minor:** a new feature, Section, item type, or backward-compatible
  capability.
- **Patch:** wording, copy corrections, bugfixes that don't change behavior
  anyone was relying on.
- **Pre-1.0:** stay on `0.MINOR.PATCH` until the tagging/changelog practice
  itself has proven out over a few real releases. `1.0.0` is a deliberate
  future statement ("this practice is trustworthy now"), never backdated
  onto a past commit.

## Release evidence

Before tagging a release:

1. Update `package.json`'s `"version"` and add the entry to `CHANGELOG.md`.
2. Record what changed and why — plain language, not a commit-log dump.
3. Run this project's own standard checks: `tsc --noEmit`, `eslint`,
   `npm test`, `next build` — all clean.
4. If the change touches `app/api/automation/*`, confirm the n8n workflow
   still matches before calling it Minor/Patch rather than Major.
5. Self-review the diff — this project has no PR/review workflow (a solo
   owner, direct pushes to `main`), so this replaces Banka's "complete the
   repository's review workflow" step with an honest equivalent.
6. Create an annotated Git tag (`v0.x.x`) only after the release commit
   exists, and only when the owner separately authorizes the tag. Tagging
   is never automatic and never bundled into the same step as the commit
   itself.

## Retrospective classification

Written record only — no tags exist for these; they mark what each release
number *would have meant*, had this practice existed at the time.

- `0.1.0` — v1 definition of done reached and live in Production
  (`388260e`, 2026-07-18): Bible reader, six-part item model, Morning/Vesper
  templates, dual DOCX export, shareable Web View.
- `0.2.0` — Banka Standard-tier adoption plus the post-adoption stabilization
  backlog (BA-003 through BA-007) closed (`f0aa3bf` through `2d1e3d7`,
  2026-08-24/25): first tracked session-state protocol, several
  Critical/High production fixes.
- `0.3.0` — Track A closed: Liturgy Row Redesign, deletion accountability,
  emil-design-eng motion charter across all six phases (`cee123a`,
  2026-08-30).
- `0.4.0` — Track B closed: unified Library entry points, six item types,
  Song multi-Section tagging, session-state file split (`814b2d6`,
  2026-09-03).
- `0.5.0` — Production migration-integrity pass: two silently-never-applied
  migrations found and fixed live (Song save/placement outage, Formula
  whitelist drift), cross-template Scripture Library sharing, Library
  auto-submission (`896c6e8`, 2026-09-05). Current state as of this file's
  adoption.
