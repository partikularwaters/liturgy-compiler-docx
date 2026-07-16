-- Phase 7, Feature 20: Scripture Text Library ("Existing Selections").
-- Auto-saves every Selection submitted via addSelectionAction, Section-
-- scoped like Formula/Prayer, regardless of whether the parent liturgy is
-- ever saved -- this table is populated independently of `sections.items`,
-- not derived from it at read-time. No retention/cleanup logic in v1
-- (flagged for a future manual tool per redesign-plan-v1.1.md §I).
--
-- unique(section_name, citation) lets the auto-save use a plain
-- on-conflict-do-nothing insert instead of a separate existence check.

create table if not exists scripture_selections (
  id uuid primary key default gen_random_uuid(),
  section_name text not null,
  citation text not null,
  text text not null,
  created_at timestamptz not null default now(),
  unique (section_name, citation)
);

create index if not exists scripture_selections_section_name_idx
  on scripture_selections (section_name);
