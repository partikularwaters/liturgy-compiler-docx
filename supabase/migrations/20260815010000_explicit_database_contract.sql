-- Make the database contract independent of hosted Supabase defaults.
--
-- The public website remains readable without an account, but those reads go
-- through the Next.js server and its service-role client. The browser's anon
-- key is for Supabase Auth, not direct access to liturgy or Library tables.
-- This prevents a future platform-default change from quietly exposing data.

-- Production was created through manual SQL history and is missing this table,
-- while a clean local replay already has it. Keep the repair idempotent so the
-- same file is safe in both environments.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

-- RLS must be explicit. Hosted Supabase currently auto-enables it for exposed
-- tables, but local PostgreSQL does not, and the repository must reproduce its
-- own security rather than depend on an environment-specific event trigger.
alter table public.bible_verses enable row level security;
alter table public.verse_highlights enable row level security;
alter table public.templates enable row level security;
alter table public.liturgies enable row level security;
alter table public.sections enable row level security;
alter table public.section_items enable row level security;
alter table public.formulas enable row level security;
alter table public.prayers enable row level security;
alter table public.scripture_selections enable row level security;
alter table public.songs enable row level security;
alter table public.user_roles enable row level security;
alter table public.notifications enable row level security;

-- The original Library policies predate personal drafts and say that every row
-- is public. Narrow them now as defense-in-depth. The current app reads through
-- service_role, so this does not hide shared Library content from the website.
drop policy if exists "formulas_select_all" on public.formulas;
drop policy if exists "prayers_select_all" on public.prayers;
drop policy if exists "songs_select_all" on public.songs;

drop policy if exists "formulas_select_visible" on public.formulas;
create policy "formulas_select_visible" on public.formulas for select using (
  (owner_id is null and is_binned = false) or owner_id = auth.uid()
);

drop policy if exists "prayers_select_visible" on public.prayers;
create policy "prayers_select_visible" on public.prayers for select using (
  (owner_id is null and is_binned = false) or owner_id = auth.uid()
);

drop policy if exists "songs_select_visible" on public.songs;
create policy "songs_select_visible" on public.songs for select using (
  (owner_id is null and is_binned = false) or owner_id = auth.uid()
);

-- These policies may already exist after a clean replay but not in the
-- manually-built Production database. Create only the missing policies.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_select_own'
  ) then
    create policy "notifications_select_own" on public.notifications
      for select using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_update_own'
  ) then
    create policy "notifications_update_own" on public.notifications
      for update using (user_id = auth.uid());
  end if;
end
$$;

-- Start from no direct Data API access. The server-side service role receives
-- the privileges needed by the existing architecture. Authenticated clients
-- receive only the role lookup used by getCurrentUser/getSessionStatus.
revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;
revoke all privileges on all functions in schema public from public, anon, authenticated;

grant usage on schema public to service_role, authenticated;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
grant select on table public.user_roles to authenticated;

-- Apply the same least-privilege rule to objects created by future migrations.
-- Supabase migrations run as postgres, so these defaults cover the repository's
-- normal migration path.
alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all privileges on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

alter default privileges for role postgres in schema public
  grant all privileges on tables to service_role;
alter default privileges for role postgres in schema public
  grant all privileges on sequences to service_role;
alter default privileges for role postgres in schema public
  grant execute on functions to service_role;

