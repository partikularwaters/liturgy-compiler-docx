-- Phase 6, Feature 17: Compile View 2-Page/3-Column Layout (Morning only --
-- Vesper's Section->column assignment is deferred to Feature 18).
--
-- Structural change: Morning Worship's "Charge & Benediction" Section splits
-- into two separate Sections, "Charge" and "Benediction", inserted right
-- before Doxology. Morning goes from 17 to 18 Sections.
--
-- Real data migration: 4 Morning Worship liturgies exist at the time of this
-- migration (2 with real content in the combined Charge & Benediction
-- Section, 2 empty). Confirmed with Madrid before writing this: the first
-- existing item in that Section becomes the new Charge Section's item, the
-- second becomes the new Benediction Section's item (matches the
-- exhortation/doxology pattern already present in both real liturgies'
-- content -- e.g. 1 Peter 5:6-9 then 5:10-11).
--
-- This file is applied via an equivalent Node/supabase-js script (this
-- project has no linked Supabase CLI project / direct Postgres connection
-- string, so multi-table JOIN UPDATEs like below can't run as-is through
-- supabase-js's REST interface) -- kept here as the documented, auditable
-- source of truth for what that script does. A full backup of the Morning
-- Worship template + all its liturgies' sections rows was taken immediately
-- before running, per code-standards.md's data-safety practice for
-- structural changes touching real liturgies.

-- Step 1: shift Doxology from index 16 to 17 (must run before Step 2, or
-- the newly-inserted Benediction rows at index 16 would also get shifted).
update sections
set template_section_index = 17
from liturgies
join templates on templates.id = liturgies.template_id
where sections.liturgy_id = liturgies.id
  and templates.name = 'Morning Worship'
  and sections.template_section_index = 16;

-- Step 2: insert new Benediction rows at index 16, carrying over the second
-- item (if any) from the old combined Charge & Benediction Section.
insert into sections (liturgy_id, template_section_index, items)
select sections.liturgy_id, 16,
  case when jsonb_array_length(sections.items) > 1
       then jsonb_build_array(sections.items -> 1)
       else '[]'::jsonb
  end
from sections
join liturgies on liturgies.id = sections.liturgy_id
join templates on templates.id = liturgies.template_id
where templates.name = 'Morning Worship'
  and sections.template_section_index = 15;

-- Step 3: trim the old combined row (still at index 15) down to just its
-- first item -- it now represents "Charge" alone.
update sections
set items = case when jsonb_array_length(sections.items) > 0
                 then jsonb_build_array(sections.items -> 0)
                 else '[]'::jsonb
            end
from liturgies
join templates on templates.id = liturgies.template_id
where sections.liturgy_id = liturgies.id
  and templates.name = 'Morning Worship'
  and sections.template_section_index = 15;

-- Step 4: update the Morning Worship template's sections array itself --
-- Charge & Benediction split into two, page/column added to every entry
-- per redesign-plan-v1.1.md §F's fixed assignment table.
update templates
set sections = '[
  {"name": "Call to Worship", "posture": "standing", "dynamic_naming": false, "page": 1, "column": 1},
  {"name": "Prayer of Invocation", "posture": "standing", "dynamic_naming": false, "page": 1, "column": 1},
  {"name": "Psalm of Adoration", "posture": "standing", "dynamic_naming": true, "page": 1, "column": 1},
  {"name": "Righteousness of God", "posture": "standing", "dynamic_naming": false, "page": 1, "column": 2},
  {"name": "Call to Confession", "posture": "seated", "dynamic_naming": false, "page": 1, "column": 2},
  {"name": "Confession of Sin", "posture": "seated", "dynamic_naming": false, "page": 1, "column": 3},
  {"name": "Hymn of Propitiation", "posture": "standing", "dynamic_naming": true, "page": 2, "column": 1},
  {"name": "Assurance of Pardon", "posture": "standing", "dynamic_naming": false, "page": 2, "column": 1},
  {"name": "Prayer for Illumination", "posture": "seated", "dynamic_naming": false, "page": 2, "column": 2},
  {"name": "Psalm of Proclamation", "posture": "standing", "dynamic_naming": true, "page": 2, "column": 2},
  {"name": "Sermon", "posture": "seated", "dynamic_naming": false, "page": 2, "column": 2},
  {"name": "Hymn of Dedication", "posture": "seated", "dynamic_naming": true, "page": 2, "column": 3},
  {"name": "Affirmation of Faith", "posture": "standing", "dynamic_naming": false, "page": 2, "column": 3},
  {"name": "Offertory & Thanksgiving", "posture": "seated", "dynamic_naming": false, "page": 2, "column": 3},
  {"name": "Pastoral Prayer", "posture": "seated", "dynamic_naming": false, "page": 2, "column": 3},
  {"name": "Charge", "posture": "standing", "dynamic_naming": false, "page": 2, "column": 3},
  {"name": "Benediction", "posture": "standing", "dynamic_naming": false, "page": 2, "column": 3},
  {"name": "Doxology", "posture": "standing", "dynamic_naming": false, "page": 2, "column": 3}
]'::jsonb
where name = 'Morning Worship';
