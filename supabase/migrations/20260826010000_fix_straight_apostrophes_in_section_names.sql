-- 2026-08-26: "THE LORD'S TABLE" (and "THE LORD'S DISCOURSES") in the
-- Compile View rendered with a straight apostrophe instead of curly --
-- confirmed live against Production, then a real Vesper liturgy created
-- there (2026-08-30 service date).
--
-- Root cause: `templates.sections[].name` is never set by any migration in
-- this repo (same untracked-manual-SQL pattern already known for
-- `item_types`) -- these two Vesper Section names were evidently typed with
-- a straight apostrophe when originally added by hand. `sectionTitle()`
-- (lib/liturgy/sectionTitle.ts) renders `section.name` verbatim; Section
-- names are Template metadata, not authored liturgical content, so they
-- never pass through `normalizeTypography()` the way Selection/Formula/
-- Prayer/Verbal Cue text does.
--
-- Idempotent and safe to re-run: only rewrites a Section's `name` field when
-- it actually contains a straight apostrophe, leaves every other field and
-- every other Section untouched. Confirmed via the same inspect
-- query before/after running this by hand in the SQL Editor; captured here
-- so the fix is tracked in the repo, not just applied live.
update templates t
set sections = (
  select jsonb_agg(
    case
      when elem->>'name' like '%''%'
        then jsonb_set(elem, '{name}', to_jsonb(replace(elem->>'name', '''', '’')))
      else elem
    end
  )
  from jsonb_array_elements(t.sections) as elem
)
where exists (
  select 1 from jsonb_array_elements(t.sections) as e2
  where e2->>'name' like '%''%'
);
