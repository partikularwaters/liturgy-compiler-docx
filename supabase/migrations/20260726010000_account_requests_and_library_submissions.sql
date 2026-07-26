-- Account Requests + Library Submissions schema (2026-07-26)
-- Adds the three columns the Curator Inbox needs: a name to show for an
-- Account Request, a submission lifecycle for a Library Submission, and a
-- Bin flag so a deleted account's orphaned draft is never mistaken for a
-- shared/canonical entry (owner_id null already means that).

-- user_roles: Supabase Auth has no built-in name field, and the Inbox needs
-- a real name (not just an email) for an Account Request to review at a
-- glance. Split first/last per Madrid's own choice over one combined field.
alter table user_roles add column if not exists first_name text;
alter table user_roles add column if not exists last_name text;

-- 'pending' is a new third role value: signup now creates a user_roles row
-- immediately (with first/last name captured), before any real role is
-- granted -- that pending row IS the Account Request the Curator Inbox
-- lists. Without this, there'd be nowhere to store the submitted name until
-- approval, and no way to tell "signed up, awaiting approval" apart from
-- "never signed up" (both would otherwise mean "no row"). A pending user is
-- treated as having no permissions at all (same as anonymous) until a
-- Curator grants curator/compiler.
alter table user_roles drop constraint if exists user_roles_role_check;
alter table user_roles add constraint user_roles_role_check check (role in ('curator', 'compiler', 'pending'));

-- status: draft (private, Compiler-only) -> submitted (visible in the
-- Curator Inbox) -> promoted | rejected (rejected loops back to draft --
-- real authored work isn't destroyed just because it wasn't accepted).
-- Existing rows all default to 'draft' -- shared/canonical (owner_id null)
-- rows are never submitted/promoted through this flow, so 'draft' is a
-- harmless default for them too.
alter table formulas add column if not exists status text not null default 'draft' check (status in ('draft', 'submitted', 'promoted', 'rejected'));
alter table prayers add column if not exists status text not null default 'draft' check (status in ('draft', 'submitted', 'promoted', 'rejected'));
alter table songs add column if not exists status text not null default 'draft' check (status in ('draft', 'submitted', 'promoted', 'rejected'));

-- is_binned: true only when the owning account has been deleted. Must be
-- set explicitly by the "delete account" action *before* owner_id gets
-- nulled out by the FK's own "on delete set null" -- otherwise the orphan
-- becomes indistinguishable from a real shared entry (owner_id null already
-- means "shared/canonical" -- this is what the Bin design exists to avoid).
alter table formulas add column if not exists is_binned boolean not null default false;
alter table prayers add column if not exists is_binned boolean not null default false;
alter table songs add column if not exists is_binned boolean not null default false;
