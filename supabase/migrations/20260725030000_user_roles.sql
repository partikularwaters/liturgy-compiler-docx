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

-- Placeholder seed data -- Madrid asked for placeholder accounts to unblock
-- this work until he provides real ones. Two real Supabase Auth users were
-- created via the admin API (not invented UUIDs) so these rows reference
-- actual auth.users entries and the login flow is genuinely testable once
-- NEXT_PUBLIC_SUPABASE_ANON_KEY is added to .env.local. Credentials given
-- directly in chat, not committed here. DELETE these two rows (and the
-- corresponding auth.users accounts, via the Supabase dashboard) once real
-- accounts exist.
insert into user_roles (user_id, role) values
  ('04135f3b-3637-4e18-9c9a-1107c0646d80', 'curator'),
  ('18033cdb-7ee9-40ad-89b5-6e0022ed208e', 'compiler')
on conflict (user_id) do nothing;
