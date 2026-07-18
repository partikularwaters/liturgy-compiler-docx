-- Phase 7, Feature 21: Psalm & Hymn Item Types (Songs Library)
-- Shared library like Formula/Prayer, tagged by kind (psalm | hymn),
-- Section-scoped. Replaces Selection entirely in the 5 dynamic song
-- Sections (redesign-plan-v1.1.md §L). No seed data -- real song metadata
-- is Madrid's to author through the app, not to fabricate.

create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  section_name text not null,
  kind text not null check (kind in ('psalm', 'hymn')),
  title text not null,
  -- Psalm: versification (e.g. "Reformed Life Community Church").
  -- Hymn: author. Same column, meaning depends on kind -- avoids two
  -- mutually-exclusive nullable columns for what's really one "attribution"
  -- field per §L.
  attribution text,
  year_published text,
  notes text
);
