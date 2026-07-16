-- Phase 2, Feature 04: New Liturgy Flow — Logic (content correction)
-- "Affirmation of Faith / Church Covenant" (Vesper Worship) becomes a
-- dynamic-naming section, same mechanism as the Psalm/Hymn sections: the
-- name is already written as "Option A / Option B", and SectionCard's
-- title logic displays it as-is when dynamic_naming is true and the name
-- doesn't start with "Psalm"/"Hymn" — no code change needed, just the flag.

update templates
set sections = (
  select jsonb_agg(
    case
      when elem->>'name' = 'Affirmation of Faith / Church Covenant'
        then jsonb_set(elem, '{dynamic_naming}', 'true'::jsonb)
      else elem
    end
  )
  from jsonb_array_elements(sections) as elem
)
where name = 'Vesper Worship';
