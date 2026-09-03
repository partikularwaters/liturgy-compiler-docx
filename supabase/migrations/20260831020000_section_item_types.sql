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
-- table. Section names, order, and counts were cross-checked directly
-- against live template data before writing this (18 Morning + 19 Vesper,
-- no drift from §Y found). It also applies three deliberate departures
-- from §Y's original spec, per direct product decision (2026-08-31):
-- Formula is removed from Charge, The Great Commission, and Benediction
-- (both templates) -- the Trinitarian Seal on Selection already produces
-- the same closing-line function Formula served in those three Sections,
-- and the app already blocked new Formula adds on Benediction via a
-- separate, now-redundant app-code guard (`FORMULA_EXCLUDED_SECTIONS` in
-- SectionCard.tsx, removed in this same batch).
--
-- IMPORTANT before this runs against Production: Production's `item_types`
-- already has real, live values (unlike local, which has none). This
-- migration's values were reconstructed from §Y, not read from Production
-- directly -- diff this migration's values against a live dump of
-- Production's current `item_types` for every Section before applying, to
-- catch any drift between §Y and what Production actually has for anything
-- other than the three Formula-eligibility changes above -- those three
-- were confirmed directly against a live Production query before this
-- migration was written, not reconstructed from §Y alone.
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
      when 13 then elem || '{"item_types": ["selection","verbal_cue","song"]}'::jsonb
      when 14 then elem || '{"item_types": ["prayer"]}'::jsonb
      when 15 then elem || '{"item_types": ["selection","verbal_cue"]}'::jsonb
      when 16 then elem || '{"item_types": ["selection"]}'::jsonb
      when 17 then elem || '{"item_types": ["song"]}'::jsonb
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
      when 14 then elem || '{"item_types": ["selection","verbal_cue","song"]}'::jsonb
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
