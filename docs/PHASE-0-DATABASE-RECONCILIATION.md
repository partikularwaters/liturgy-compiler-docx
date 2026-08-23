# Phase 0 Database Reconciliation

## What went wrong with the original assumption

A clean local database accepted every migration, so it initially looked like
the repository could recreate Production. That proved only that the table-
changing instructions were valid. It did **not** prove that the finished local
database had the same permissions and safety switches as Production.

Supabase's hosted service had silently supplied two things the migration files
did not describe:

- it automatically enabled Row Level Security (RLS) on exposed tables; and
- it granted broad database access to Supabase's API roles.

The local database did neither. In plain language, the repository described the
rooms, but not which doors should be locked or who should hold the keys.

There was a second mismatch: the repository contained a Notifications migration
that Production never received. Production's migration ledger was completely
empty even though nearly all historical changes had been applied manually.

## The chosen contract

The app remains free and publicly readable. A visitor does not need an account
to browse the Library, read a public liturgy, or download a document.

The security boundary is now explicit:

- public visitors ask the Next.js app for content;
- the server reads the database using its protected service credential;
- the browser's public Supabase key is used for sign-in, not direct table access;
- a signed-in browser may directly read only the user's role record so the app
  knows whether the user is a Curator, Compiler, or pending approval;
- database-changing server actions must still check the signed-in user's role.
  That action-level repair is Phase 1 and is not replaced by this migration.

This preserves the current user experience while removing accidental database
exposure. Personal Formula, Prayer, and Song drafts are also no longer covered
by the old “everyone can select every row” policies.

## What is implemented locally

Migration `20260815010000_explicit_database_contract.sql` now:

- creates the missing Notifications table safely if necessary;
- explicitly enables RLS on all 12 application tables;
- removes direct table access from anonymous and ordinary authenticated API
  roles;
- gives the service role the table and function access the server requires;
- permits authenticated users to read `user_roles` only;
- limits `create_liturgy()` to the service role;
- narrows Library visibility policies so personal drafts are not public; and
- applies the same least-privilege defaults to future migrations.

The local verification command is:

```bash
npm run db:verify-contract
```

It refuses to run against any non-local hostname. It creates disposable local
records, verifies the allowed and denied paths, and removes those records.

Verified on 2026-08-15:

- all 33 migrations replayed from a blank local database;
- all 12 application tables have RLS enabled;
- anonymous and signed-in clients cannot read liturgies directly;
- anonymous and signed-in clients cannot call `create_liturgy()` directly;
- signed-in clients can read the role information the app needs;
- the service role can read tables and create a liturgy with its Sections;
- the public Home, Library, and Reader pages return HTTP 200 locally;
- the signed-out New Liturgy page asks the visitor to sign in; and
- the production build succeeds.

## Production result — 2026-08-16 PHT

The reviewed procedure was completed with separate approvals for the ledger
repair and the contract migration:

- a fresh owner-only backup was written to
  `~/Documents/Liturgy Compiler Backups/2026-08-15-phase0-prechange/`;
- the fresh schema and roles were byte-for-byte identical to the earlier
  checkpoint;
- all 32 historical migrations were recorded as already applied without
  rerunning their SQL;
- the dry run listed only `20260815010000_explicit_database_contract.sql`;
- that single migration was applied successfully; and
- the final ledger matches all 33 repository migrations.

Post-migration inspection confirms the Notifications table exists, all 12
application tables have RLS enabled, `service_role` retains application-table
and `create_liturgy()` access, and `authenticated` retains only the direct
`user_roles` read required by the app.

Live anonymous verification passed for Home, Library, Reader, Compile View,
public Web View, and the signed-out New Liturgy guard. Both the Leader Guide and
Bulletin returned HTTP 200 as valid, non-empty Word documents.

Madrid completed the existing-account sign-in, role display, Compile View,
sign-out, and public-homepage checks on 2026-08-16. No credential was shared
with Codex, and no new Production account or throwaway worship content was
created for verification. Phase 0 is complete.

## Production procedure used

The existing verified backup is the required safety checkpoint:

`~/Documents/Liturgy Compiler Backups/2026-08-15-0221-PHT/`

When Madrid explicitly approves the Production maintenance window, Codex will:

1. Start a short-lived Supabase CLI login. Madrid completes browser approval;
   no token or database password is pasted into chat.
2. Confirm the linked project is `Liturgy Compiler` with project reference
   `mzprbjrxgfjljlmsdxcy`.
3. Take and verify a fresh dated schema/data/roles backup if the existing one is
   no longer current.
4. Repeat the read-only schema comparison. Stop if any new unexplained drift is
   present.
5. Mark the first 32 historical versions as already applied. This updates only
   Supabase's bookkeeping; it does not rerun those old instructions against
   live worship data.
6. Run `supabase db push --dry-run` and require it to list only
   `20260815010000_explicit_database_contract.sql`.
7. Present that dry run for final approval.
8. Apply the one reconciliation migration.
9. Verify anonymous Home/Library/Web View access, editor login and role lookup,
   a reversible trusted edit, and both DOCX exports.
10. Recheck the migration ledger and database permissions, then log out of the
    CLI and remove its short-lived access token.

The historical ledger must never be repaired before step 4. Marking a migration
“applied” is an assertion that Production already contains its intended result;
it is not a way to make drift disappear.

## Rollback posture

If the migration breaks a public page, stop writes first and use the verified
backup plus the pre-change schema dump as the recovery source. Do not solve a
problem by broadly restoring anonymous table access. The public website is
supposed to read through the server; a failure there indicates an application
or service-role configuration problem that should be corrected directly.

The migration creates Notifications only when missing and does not delete
worship content. Its other changes are permissions and safety settings, which
can be adjusted without rewriting liturgy data.
