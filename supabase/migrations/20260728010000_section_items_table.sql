-- v3 item 1: Item storage migration. sections.items (one jsonb array per
-- Section) becomes section_items (one row per item), so a future feature
-- (tagging, universal search, cross-day duplicate flagging -- v3 items 3-5)
-- can query across items directly instead of scanning jsonb blobs.
--
-- One polymorphic table, not six per-type tables: architecture.md's
-- Invariants already require item deletion to be "one generic action, never
-- a per-type delete function" -- a single table with a `type` discriminator
-- keeps that literally true (one untyped delete-by-id), where six tables
-- would force type-branching back into removeItemAction.ts.
--
-- `data` holds every field an item has today except `id`/`type` (citation,
-- text, marks, formulaId, overrideText, etc.) -- unchanged shape, just moved
-- off the array. `position` replaces "array index" as the explicit render
-- order, since a table has no inherent order the way an array element does.
--
-- Purely additive: sections.items is untouched here and stays the fallback
-- until the app code is cut over and verified live (see progress-tracker.md).
create table if not exists section_items (
  id uuid primary key,
  section_id uuid not null references sections (id) on delete cascade,
  position integer not null,
  type text not null check (type in ('selection', 'formula', 'verbal_cue', 'prayer', 'sermon', 'song')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists section_items_section_id_position_idx on section_items (section_id, position);
