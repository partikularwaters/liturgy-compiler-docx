# Owner Guide

This is the short operational guide for tasks that require the project owner's
account, judgment, or physical access. Routine code, dependency, and local
database work belongs to Codex unless a step below explicitly says otherwise.

## What is already handled

- Node dependencies are installed through `npm install` and recorded in the
  lockfile.
- Vercel Speed Insights is installed in the application. It is observational;
  it does not block the congregation from using the app.
- Colima and the Docker CLI are installed as the free local container runtime.
- The Supabase CLI and Vitest are project development dependencies.
- `.env.local` exists, is ignored by Git, and points only to the disposable
  local Supabase database. It contains no production credential.
- All 33 repository migrations have been replayed against a blank local
  database, including the explicit security/runtime contract.

No owner action is needed to repeat local tests. Codex can start and stop the
local services when needed.

## What the owner needs to confirm now

1. Sign in to the Supabase Dashboard and open the production project.
2. Check the organization or project billing page and confirm that the project
   is on the **Free** plan. Do not upgrade it.
3. Reply only with:

   `Supabase is Free, and I can access the project.`

Do not send screenshots of API settings, database connection strings, tokens,
passwords, or environment-variable values.

Vercel Hobby is already confirmed, so no additional Vercel action is needed
now.

Supabase Free was confirmed on 2026-08-15.

Environment review confirmed on 2026-08-15:

- Production contains all three required variables.
- The production service-role variable is marked Sensitive in Vercel.
- The same production service-role credential is currently available to Preview.
- Supabase's newer publishable and secret API keys are available for this
  project. The confirmation screenshot contained no key value.

The Preview scope is not accepted as a permanent configuration. Do not remove
or rotate it in isolation: existing Preview deployments retain their old build
environment, and the current application still has client-reachable mutations
that rely on a privileged server client. The safe containment sequence is:

1. Make and verify the production backup.
2. Repair server-side authorization for every privileged mutation.
3. Create a new Supabase secret key.
4. Add that key to Vercel Production only as Sensitive, then redeploy and test.
5. Give Preview either its own non-production Supabase project or no
   write-capable deployment configuration.
6. Revoke the legacy service-role key so older Production and Preview
   deployments can no longer use it.

Production backup checkpoint completed on 2026-08-15 at 02:21 PHT:

- Stored outside Git at `~/Documents/Liturgy Compiler Backups/2026-08-15-0221-PHT/`.
- Contains `roles.sql`, `schema.sql`, and `data.sql`.
- Folder permissions are owner-only (`700`); file permissions are owner-only
  (`600`).
- The data file is 10,487,098 bytes and contains 38 `COPY` data sections; the
  schema contains 11 table definitions.
- The Supabase CLI access token was deleted immediately after verification.
- Confirmed on 2026-08-15 that macOS FileVault is On, so the owner-only
  backup files are also protected by full-disk encryption when the Mac is off or
  locked.

Production reconciliation completed on 2026-08-16 PHT. The 32 historical
versions are now recorded, the explicit database contract migration was applied
after a one-file dry run and separate approval, and all 33 repository versions
match Production. The procedure and verification record are in
`docs/PHASE-0-DATABASE-RECONCILIATION.md`.

The fresh owner-only pre-change backup is stored at
`~/Documents/Liturgy Compiler Backups/2026-08-15-phase0-prechange/`. Its schema
and roles matched the earlier backup byte-for-byte; the data file is non-empty
and contains all current application data sections.

## Environment-file security

The repository ignores every `.env*` file except a sanitized `*.example` file.
The example contains variable names only and must never contain real values.

The three current variables have different security levels:

- `NEXT_PUBLIC_SUPABASE_URL` identifies the Supabase project and is intentionally
  available to the browser.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the legacy low-privilege browser key. It is
  intentionally public and is safe only when Row Level Security and database
  grants are correct.
- `SUPABASE_SERVICE_ROLE_KEY` is privileged, bypasses Row Level Security, and is
  a secret. It must never gain a `NEXT_PUBLIC_` prefix, enter a Client Component,
  appear in a URL, log, screenshot, issue, chat, email, or committed file.

The privileged database module imports `server-only`, so Next.js will reject a
future attempt to include it in client-side code.

### Local machine rules

1. Keep the normal `.env.local` pointed at the disposable local Supabase stack.
2. Keep full-disk encryption and the macOS login password enabled.
3. Do not synchronize `.env.local` through a public Git repository, shared
   folder, or unencrypted note-taking service.
4. Do not copy the production service-role key into `.env.local` for ordinary
   development. Production maintenance should use an explicit, short-lived CLI
   session and a confirmed backup.
5. Before committing, run `git status --short`. No `.env` filename should
   appear. The only tracked environment file should be `.env.local.example`.

### Vercel rules

1. Keep environment variables at the project level, not shared across unrelated
   Vercel projects.
2. Scope production Supabase values to Production. Give Preview a separate
   non-production Supabase project before enabling write-capable previews; until
   then, do not point Preview at production with a service-role key.
3. Store `SUPABASE_SERVICE_ROLE_KEY` as a Vercel **Sensitive** environment
   variable. Sensitive values cannot be read back from the dashboard.
4. After any environment change, create a new deployment; old deployments keep
   the values that existed when they were built.
5. Test the new deployment before revoking an old key.

### Planned key migration

The project currently names the legacy `anon` and `service_role` keys. Supabase
now recommends publishable (`sb_publishable_...`) and secret (`sb_secret_...`)
keys, and says the legacy keys are being deprecated by the end of 2026. Handle
this as a separately tested production batch:

1. Repair the server-side authorization checks first.
2. Create a new Supabase publishable key and secret key; keep the legacy keys
   working temporarily.
3. Add the new values to Vercel, marking the secret sensitive.
4. Redeploy and verify anonymous reading, editor login, compile mutations, and
   both exports.
5. Only after verification, disable the legacy keys.

If a privileged value may have leaked, do not merely delete the local file.
Treat it as compromised: repair the exposure path, create a replacement key,
update Vercel, redeploy and verify, then revoke the old key.

Official references:

- [Next.js environment variables](https://nextjs.org/docs/pages/guides/environment-variables)
- [Supabase API key security](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase data security](https://supabase.com/docs/guides/database/secure-data)
- [Vercel sensitive environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [Vercel secret rotation](https://vercel.com/docs/environment-variables/rotating-secrets)

## Before any production database change

The Free Supabase plan does not include retained automatic backups. Supabase
recommends that Free projects make a logical backup with `supabase db dump` and
keep it off-site. Therefore every production migration batch must stop until
these steps are complete:

1. The owner confirms that the correct Supabase project is open.
2. Codex starts `npx supabase login`.
3. The owner completes the browser authorization personally. Never paste an access
   token into chat or put it in the repository.
4. Codex links the repository to the hosted project read-only first and shows
   the resolved project identity before any write is proposed.
5. Codex creates a dated logical backup outside the Git repository and verifies
   that the backup is non-empty.
6. The owner chooses where that backup should be retained privately.

CLI login stores its authorization in the operating system's credential
storage when available. A production push still requires a separate, explicit
approval; login alone does not authorize a migration.

Official references:

- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase CLI login and project linking](https://supabase.com/docs/reference/cli/getting-started)

## Free-plan Sunday readiness

Supabase says Free projects may pause after one week of inactivity. This is a
cost-saving constraint, not an application bug. To protect the worship-team
experience without paying for an upgrade:

1. On Thursday or Friday, open the live Liturgy Compiler.
2. Confirm the liturgy list loads.
3. Open the coming service's public Web View.
4. Download both the Leader Guide and Congregation Bulletin.
5. If the database is paused, restore it from the Supabase Dashboard and repeat
   the checks before Sunday.

Keep the downloaded documents as the service-day fallback. The congregation
must never be required to create an account just to read the liturgy.

[Supabase Free plan limits](https://supabase.com/pricing)

## Vercel environment variables

The production project must contain these names under Project Settings →
Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The owner may confirm that the names exist but should not copy their values into
chat. If a variable is added or changed, it affects only new deployments, so
Codex must run or request a new deployment afterward.

- [Vercel project settings](https://vercel.com/docs/project-configuration/project-settings)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)

## Starting and stopping local services

Codex normally handles these commands. They are documented here so the project
does not depend on one machine or one model's memory.

Start:

```bash
colima start
npm run db:start
```

Stop when finished:

```bash
npm run db:stop
colima stop
```

`npm run db:reset` deletes only the disposable local database and reapplies all
migrations. It must never be run against the production project.
