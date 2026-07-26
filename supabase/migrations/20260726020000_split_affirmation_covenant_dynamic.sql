-- Split "Affirmation of Faith / Church Covenant" into a real dynamic pair
-- (2026-07-26), same mechanism Psalm/Hymn Sections already use: one base
-- Section name ("Affirmation of Faith"), a `kind` on the Formula itself
-- disambiguates which of the two it actually is, and sectionTitle.ts
-- resolves the displayed heading at render time based on what's placed.

-- Formula gains `kind`, mirroring Song's own psalm/hymn kind -- nullable
-- (and only meaningful for Formulas scoped to "Affirmation of Faith") since
-- every other Formula (Absolution, Trinitarian Seal, etc.) has no such
-- distinction to make. A null/missing kind defaults to "affirmation" at
-- render time -- no backfill needed for the existing Apostles' Creed rows.
alter table formulas add column if not exists kind text check (kind is null or kind in ('affirmation', 'covenant'));

-- Vesper's template Section: rename the combined label down to the base
-- form ("Affirmation of Faith" -- same name Morning's own, always-static
-- Affirmation of Faith Section already uses; sharing one name is
-- intentional, matching how "Call to Worship"/"Benediction"/etc. already
-- share Library entries across both templates). dynamic_naming stays true.
update templates
set sections = (
  select jsonb_agg(
    case
      when elem->>'name' = 'Affirmation of Faith / Church Covenant'
        then jsonb_set(elem, '{name}', '"Affirmation of Faith"'::jsonb)
      else elem
    end
  )
  from jsonb_array_elements(sections) as elem
)
where name = 'Vesper Worship';

-- No historical-data rename needed for individual liturgies -- the
-- `sections` table has no `name` column at all, only `template_section_index`
-- (an integer pointing back into the template's own `sections` array).
-- Every liturgy's Section display name is always resolved live from the
-- CURRENT template at read time, so renaming the template above already
-- applies retroactively to every existing Vesper liturgy automatically.

-- Defensive -- no Formula is actually scoped to the old combined name yet
-- (no Church Covenant formula has been authored), but this keeps the
-- migration correct if that ever changes before it's run.
update formulas set section_name = 'Affirmation of Faith' where section_name = 'Affirmation of Faith / Church Covenant';
