-- v3 Curator/Compiler RBAC, part 2 (2026-07-25). `owner_id` replaces the
-- originally-reserved `access_level` idea (unused since Feature 08) --
-- NULL means "the shared, canonical Library entry" (Curator-controlled);
-- a real auth.users id means "a Compiler's own Personal Library fork" of
-- that entry. One column does double duty: it's both the Curator-lockdown
-- gate (task 3) and the Personal Library mechanism (task 4) at once,
-- rather than two separate concepts.
--
-- Formula: NULL rows are the sensitive, curated set (Absolution, the Seal,
-- the current Creed) -- only a Curator may ever touch them. A non-NULL row
-- is a Compiler's *proposed new* Formula (e.g. a Creed variant not yet
-- curated), never an edited copy of an existing shared one.
alter table formulas add column if not exists owner_id uuid references auth.users(id) on delete set null;

-- Prayer/Song: NULL rows are the shared master; a Compiler editing a placed
-- Prayer/Song forks it into their own non-NULL-owned row instead (the
-- placed item then points at the fork's id -- same prayerId/songId shape
-- already in types/liturgy.ts, no schema change needed there).
alter table prayers add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table songs add column if not exists owner_id uuid references auth.users(id) on delete set null;

alter table formulas enable row level security;
alter table prayers enable row level security;
alter table songs enable row level security;
alter table scripture_selections enable row level security;

-- Everyone (including anonymous/public visitors) can read every Library
-- table -- browsing is never gated, per Madrid's explicit "public users can
-- browse the Library" rule.
create policy "formulas_select_all" on formulas for select using (true);
create policy "prayers_select_all" on prayers for select using (true);
create policy "songs_select_all" on songs for select using (true);
create policy "scripture_selections_select_all" on scripture_selections for select using (true);

-- Formula: insert only your own (owner_id = you, i.e. a new proposal) or,
-- if you're a Curator, a shared (owner_id null) row too. Update/delete only
-- your own row, or (Curator) any shared row -- never someone else's
-- unpromoted proposal, and never another Curator's edit mid-flight is
-- blocked here since Curators are trusted as a set.
create policy "formulas_insert" on formulas for insert with check (
  owner_id = auth.uid()
  or (owner_id is null and exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'curator'))
);
create policy "formulas_update_delete" on formulas for all using (
  owner_id = auth.uid()
  or (owner_id is null and exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'curator'))
);

create policy "prayers_insert" on prayers for insert with check (
  owner_id = auth.uid()
  or (owner_id is null and exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'curator'))
);
create policy "prayers_update_delete" on prayers for all using (
  owner_id = auth.uid()
  or (owner_id is null and exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'curator'))
);

create policy "songs_insert" on songs for insert with check (
  owner_id = auth.uid()
  or (owner_id is null and exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'curator'))
);
create policy "songs_update_delete" on songs for all using (
  owner_id = auth.uid()
  or (owner_id is null and exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'curator'))
);

-- Scripture: no owner_id, no Curator-lockdown at all -- its pairing has an
-- independent canonical key (the citation itself), so a deleted/edited row
-- never permanently loses hand-curated pairing work the way Formula/
-- Prayer/Song can. Any authenticated user (Curator or Compiler) may
-- insert/update. No delete policy at all -- Madrid's own call ("they can't
-- delete from the Library") is enforced by simply having no delete policy
-- to allow it; RLS defaults to deny.
create policy "scripture_selections_insert" on scripture_selections for insert with check (auth.role() = 'authenticated');
create policy "scripture_selections_update" on scripture_selections for update using (auth.role() = 'authenticated');
