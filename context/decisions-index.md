<!-- Decisions Index: migrated from context/progress-tracker.md on 2026-09-10 -->

# Decisions Index

## Threshold Check

_Mechanical, not estimated — run `bash scripts/check-galleon-thresholds.sh` to refresh._

_Last run: 2026-09-10._

| File | Words | Threshold | Status |
| --- | --- | --- | --- |
| `decisions-index.md` (this file) | 974 | ~2,000 | OK |

---

| ID | Title | Status | Summary |
| --- | --- | --- | --- |
| `0001` | [Facebook App Review is required for durable posting](decisions/0001-facebook-app-review-required/decision.md) | `Accepted` | Keep Facebook posting disabled while Saturday email remains live; enable it after Meta approves App Review. |
| `0002` | [Add Facebook only after the Saturday core flow is proven](decisions/0002-saturday-facebook-channel-after-core/decision.md) | `Accepted` | Finish polling, publication recording, and email delivery before attaching the Facebook channel. |
| `0003` | [Keep n8n implementation narrative in the personal learning journal](decisions/0003-n8n-learning-journal-boundary/decision.md) | `Accepted` | Repository state tracks app facts; setup and learning narrative lives outside the repository. |
| `0004` | [Use the leverage-first motion charter phase order](decisions/0004-motion-charter-phase-order/decision.md) | `Accepted` | Build motion foundations and shared chrome before Compile View, Reader, Library, and Web View work. |
| `0005` | [Assign project-unique local Supabase ports](decisions/0005-unique-local-supabase-ports/decision.md) | `Accepted` | Use the dedicated 5532x port block to prevent host-level collisions with other local projects. |
| `0006` | [Separate durable project records from local working material](decisions/0006-repository-working-material-policy/decision.md) | `Accepted` | Use CONTRIBUTING, docs history and backups, and ignored dev scratch according to their defined roles. |
| `0007` | [Give Great Commission Text parity with Words of Institution](decisions/0007-great-commission-rotation-parity/decision.md) | `Accepted` | Auto-assign it as a reference-only Selection while retaining the Compiler override path. |
| `0008` | [Use the settled Vesper rotation anchor and fifth-Sunday default](decisions/0008-vesper-rotation-anchor-and-fifth-sunday/decision.md) | `Accepted` | Keep the Jan/Apr/Jul/Oct anchor and repeat the fourth Sunday, with manual override as the authority. |
| `0009` | [Maintain the present-tense liturgy product scope](decisions/0009-present-tense-liturgy-scope/decision.md) | `Accepted` | Morning remains three-column, Vesper remains flat, DOCX is active, and PDF is compatibility-only. |
| `0010` | [Initial contribution and release policy](decisions/0010-initial-contribution-and-release-policy/decision.md) | `Superseded by 0011` | Adopt Assisted-by trailers while deferring formal release governance. |
| `0011` | [Adopt project-specific SemVer release governance](decisions/0011-project-semver-release-governance/decision.md) | `Accepted` | Version retrospectively without deployment gates and treat the n8n automation API as the established consumer. |
| `0012` | [Archive settled Banka Docking evidence](decisions/0012-archive-banka-docking-memory/decision.md) | `Accepted` | Keep completed BA-001 and BA-002 narrative in the dedicated overflow record. |
| `0013` | [Use the canonical overflow structure](decisions/0013-canonical-overflow-structure/decision.md) | `Accepted` | Keep historic narrative in numbered overflow files and retain a discoverable live index. |
| `0014` | [Split the live tracker from historic narrative](decisions/0014-split-live-tracker-from-history/decision.md) | `Superseded by 0013` | Keep the tracker lean and move prior session narrative to archival files. |
| `0015` | [Prioritize the post-adoption critical backlog](decisions/0015-prioritize-critical-backlog/decision.md) | `Accepted` | Address BA-003 and BA-004 before lower-priority stabilization work and keep BA-008 buried cold. |
| `0016` | [Stabilize verified weekly worship before broad refactors](decisions/0016-stabilize-weekly-worship-first/decision.md) | `Accepted` | Protect anonymous reading and trusted Curator or Compiler mutations while repairing boundaries. |
| `0017` | [Preserve the free and anonymous-access boundary](decisions/0017-free-and-anonymous-access-boundary/decision.md) | `Accepted` | Avoid paid dependencies and congregation login; treat free hosting as having no uptime SLA. |
| `0018` | [Banka transition sequence](decisions/0018-banka-transition-sequence/decision.md) | `Accepted` | First establish reproducibility, then reconcile present-tense architecture and historic narrative. |
| `0019` | [Never seed environment-specific Auth user IDs in migrations](decisions/0019-no-auth-user-ids-in-migrations/decision.md) | `Accepted` | Create real accounts per environment and assign their roles after creation. |
| `0020` | [Production privileged-key containment plan](decisions/0020-production-key-rotation-plan/decision.md) | `Accepted` | Repair authorization, deploy Production-only secret keys, then revoke legacy keys. |
| `0021` | [Production backup checkpoint](decisions/0021-production-backup-checkpoint/decision.md) | `Accepted` | Retain the owner-only encrypted backup outside Git and remove temporary CLI credentials afterward. |
| `0022` | [Treat migration-ledger drift as a separate investigation](decisions/0022-migration-ledger-drift-investigation/decision.md) | `Accepted` | Do not mechanically push or mark historical migrations as applied. |
| `0023` | [Use a server-mediated least-privilege database contract](decisions/0023-server-mediated-database-contract/decision.md) | `Accepted` | Keep application data server-side and authorize every client-reachable privileged mutation. |
| `0024` | [Record the completed Production database reconciliation](decisions/0024-production-database-reconciliation/decision.md) | `Accepted` | The historical migrations and explicit contract migration were reconciled under approved live verification. |
| `0025` | [Record Phase 0 Production verification](decisions/0025-production-phase-zero-verification/decision.md) | `Accepted` | Live sign-in, role display, Compile View, sign-out, and public homepage behavior were confirmed. |
| `0026` | [Use the shared current-user authorization gate](decisions/0026-shared-current-user-authorization/decision.md) | `Accepted` | Keep getCurrentUser as the trusted-editor resolver and protect internal service helpers with server-only. |
| `0027` | [Use Server Components for Reader reads and Server Actions for mutations](decisions/0027-reader-server-component-architecture/decision.md) | `Accepted` | Read via the page Server Component and keep selection and highlighting interaction in the client wrapper. |
| `0028` | [Keep verse highlights translation-independent](decisions/0028-translation-independent-highlights/decision.md) | `Accepted` | Key highlights by book, chapter, and verse so they persist across translation switches. |
| `0029` | [Self-host AB1905 and BSB Bible text](decisions/0029-self-host-bible-text/decision.md) | `Accepted` | Seed the public-domain translations into bible_verses rather than depend on a live text API. |
| `0030` | [Confirm the project fit for Banka Track B](decisions/0030-banka-track-b-fit/decision.md) | `Accepted` | The original complexity rubric produced a four-of-five result. |
| `0031` | [Initial application stack](decisions/0031-initial-application-stack/decision.md) | `Accepted` | Use Next.js, Supabase Postgres, Tailwind v4, and the legacy PDF renderer. |
| `0032` | [Bible translation storage boundary](decisions/0032-bible-translation-storage-boundary/decision.md) | `Accepted` | Self-host AB1905 and BSB; display AB2001 and MBB only through BibleGateway. |
| `0033` | [Initial liturgical item model](decisions/0033-initial-liturgical-item-model/decision.md) | `Accepted` | Model Selection, Formula, Verbal Cue, and Prayer as distinct domain item types. |
| `0034` | [Use JSONB section items in v1](decisions/0034-section-items-jsonb-v1/decision.md) | `Accepted` | Defer child-table migration and section editability to the later version. |
| `0035` | [Initial design token system](decisions/0035-initial-design-token-system/decision.md) | `Accepted` | Use the warm-paper and burgundy palette with Inter, Old Standard TT, and Ibarra Real Nova. |
