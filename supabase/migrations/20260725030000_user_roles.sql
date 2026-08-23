-- v3 Curator/Compiler RBAC (2026-07-25). Two roles only, per Madrid's own
-- framing: this isn't about liturgical seniority (presider/deacon/preacher
-- are all equally "Compiler" here) -- it's about who can be trusted not to
-- accidentally destroy hand-curated Library work. A user with no row in
-- this table is treated as an anonymous/public visitor (read-only), not an
-- error case -- see the RLS policies added alongside this table below.
create table if not exists user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('curator', 'compiler')),
  created_at timestamptz not null default now()
);

alter table user_roles enable row level security;

-- Anyone authenticated can read the role table (needed so the app can show
-- "which tab am I" UI) -- but only a curator can ever write to it (granting
-- roles is itself a curator-level action, not self-service).
create policy "user_roles_select_authenticated" on user_roles
  for select using (auth.role() = 'authenticated');

create policy "user_roles_write_curator_only" on user_roles
  for all using (
    exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'curator')
  );

-- Roles are assigned after a real Auth user signs up. Never seed user IDs in
-- an ordered migration: auth.users belongs to each Supabase environment, so a
-- production UUID cannot exist in a clean local or recovery project.
