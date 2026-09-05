-- Track B (2026-08-31): the first tracked migration for `item_types` in
-- this repository's history. Feature 23 (2026-07-16) set `item_types` on
-- every Section directly and live in Production -- it was never captured
-- in a tracked migration (a known, previously-flagged gap; see
-- progress-tracker.md's 2026-08-25 Decisions Made entry). Local dev never
-- received it at all: `item_types` is absent from every Section on a fresh
-- local database, which silently falls back to "every item type allowed"
-- (SectionCard.tsx: `section.item_types ?? ALL_ITEM_TYPES`) -- every Add
-- button shows on every Section locally, which does not match Production's
-- real, curated whitelist.
--
-- This migration sets the complete `item_types` array for every Section in
-- both templates, reconstructed from `redesign-plan-v1.1.md`'s §Y mapping
-- table. It also applies deliberate departures from §Y's original spec,
-- per direct product decision: Formula is removed from Charge, The Great
-- Commission, and Benediction (both templates, 2026-08-31) -- the
-- Trinitarian Seal on Selection already produces the same closing-line
-- function Formula served in those three Sections, and the app already
-- blocked new Formula adds on Benediction via a separate, now-redundant
-- app-code guard (`FORMULA_EXCLUDED_SECTIONS` in SectionCard.tsx, removed
-- in this same batch). Also, Song is added to Vesper's "Offertory &
-- Thanksgiving" (2026-09-05) -- confirmed a genuine oversight, not a
-- deliberate restriction: Morning's equivalent split off a dedicated
-- Song-only "Psalm of Thanksgiving" Section (Feature 28), but Vesper's
-- combined Section never got Song added to its own whitelist.
--
-- CORRECTED 2026-09-05, before this ever ran in Production: this file's
-- original Morning block was authored against Morning's *pre-Feature-28*
-- 18-Section layout (its own comment even said "18 Morning"), but
-- Production's Morning template has had 19 Sections since Feature 28 split
-- "Offertory & Thanksgiving" into "Offertory Call" + "Psalm of Thanksgiving"
-- on 2026-07-16 -- six weeks before this migration was written. Diffing
-- the original file against a live dump of Production's current
-- `item_types` (per this comment's own prior instruction to do so) caught
-- it: every Morning position from index 13 onward was shifted by one,
-- meaning applying the original file as-is would have overwritten five real
-- Sections (Offertory Call, Psalm of Thanksgiving, Pastoral Prayer, Charge,
-- Benediction) with item_types meant for a different Section, and left
-- Doxology (index 18) untouched entirely since the original case statement
-- had no branch for it. The Morning `case` below is corrected to match the
-- real 19-Section array; Vesper's block was diffed the same way and found
-- already correctly aligned, so only Vesper's Offertory Song addition
-- changed there.
--
-- Uses jsonb_set per Section index (chained) rather than replacing each
-- template's whole `sections` array literally, so every other existing
-- field (page, column, posture, dynamic_naming) is preserved untouched --
-- only the `item_types` key is added/overwritten at each index.
-- This project has no direct Postgres connection in this environment (see
-- 20260721030000_column_break_before.sql's note) -- applied via Supabase's
-- SQL editor directly, kept here as the documented, auditable source.

update templates
set sections = (
  select jsonb_agg(
    case idx
      when 0 then elem || '{"item_types": ["selection","verbal_cue"]}'::jsonb
      when 1 then elem || '{"item_types": ["selection","prayer","verbal_cue"]}'::jsonb
      when 2 then elem || '{"item_types": ["song","verbal_cue"]}'::jsonb
      when 3 then elem || '{"item_types": ["selection","verbal_cue"]}'::jsonb
      when 4 then elem || '{"item_types": ["selection","verbal_cue"]}'::jsonb
      when 5 then elem || '{"item_types": ["prayer","verbal_cue"]}'::jsonb
      when 6 then elem || '{"item_types": ["song","verbal_cue"]}'::jsonb
      when 7 then elem || '{"item_types": ["selection","formula","verbal_cue"]}'::jsonb
      when 8 then elem || '{"item_types": ["prayer","verbal_cue"]}'::jsonb
      when 9 then elem || '{"item_types": ["song","verbal_cue"]}'::jsonb
      when 10 then elem || '{"item_types": ["sermon"]}'::jsonb
      when 11 then elem || '{"item_types": ["song","verbal_cue"]}'::jsonb
      when 12 then elem || '{"item_types": ["formula","verbal_cue"]}'::jsonb
      when 13 then elem || '{"item_types": ["selection","verbal_cue"]}'::jsonb
      when 14 then elem || '{"item_types": ["song","verbal_cue"]}'::jsonb
      when 15 then elem || '{"item_types": ["prayer"]}'::jsonb
      when 16 then elem || '{"item_types": ["selection","verbal_cue"]}'::jsonb
      when 17 then elem || '{"item_types": ["selection"]}'::jsonb
      when 18 then elem || '{"item_types": ["song"]}'::jsonb
      else elem
    end
    order by idx
  )
  from templates t2, jsonb_array_elements(t2.sections) with ordinality as arr(elem, ord), lateral (select ord - 1 as idx) o
  where t2.name = 'Morning Worship'
)
where name = 'Morning Worship';

update templates
set sections = (
  select jsonb_agg(
    case idx
      when 0 then elem || '{"item_types": ["selection","verbal_cue"]}'::jsonb
      when 1 then elem || '{"item_types": ["selection","prayer","verbal_cue"]}'::jsonb
      when 2 then elem || '{"item_types": ["song","verbal_cue"]}'::jsonb
      when 3 then elem || '{"item_types": ["selection","verbal_cue"]}'::jsonb
      when 4 then elem || '{"item_types": ["prayer","verbal_cue"]}'::jsonb
      when 5 then elem || '{"item_types": ["selection","formula","verbal_cue"]}'::jsonb
      when 6 then elem || '{"item_types": ["song","verbal_cue"]}'::jsonb
      when 7 then elem || '{"item_types": ["selection"]}'::jsonb
      when 8 then elem || '{"item_types": ["selection"]}'::jsonb
      when 9 then elem || '{"item_types": ["prayer"]}'::jsonb
      when 10 then elem || '{"item_types": ["song"]}'::jsonb
      when 11 then elem || '{"item_types": []}'::jsonb
      when 12 then elem || '{"item_types": ["selection","prayer"]}'::jsonb
      when 13 then elem || '{"item_types": ["formula","verbal_cue"]}'::jsonb
      when 14 then elem || '{"item_types": ["selection","verbal_cue","song"]}'::jsonb -- Song added 2026-09-05, confirmed oversight fix
      when 15 then elem || '{"item_types": []}'::jsonb
      when 16 then elem || '{"item_types": ["selection","verbal_cue"]}'::jsonb
      when 17 then elem || '{"item_types": ["selection"]}'::jsonb
      when 18 then elem || '{"item_types": ["song"]}'::jsonb
      else elem
    end
    order by idx
  )
  from templates t2, jsonb_array_elements(t2.sections) with ordinality as arr(elem, ord), lateral (select ord - 1 as idx) o
  where t2.name = 'Vesper Worship'
)
where name = 'Vesper Worship';
