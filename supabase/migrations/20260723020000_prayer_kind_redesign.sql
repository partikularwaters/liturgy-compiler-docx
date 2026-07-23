-- 2026-07-23: Prayer Kind redesign.
--
-- `kind` used to conflate two unrelated facts: who a prayer is for
-- ("corporate" vs "leader") and whether it's placeable content at all vs a
-- reference-only checklist ("guide"). Madrid: "I don't think the Guide is
-- relevant any more since we have guides already... The Guide, if we're
-- talking about the outline, can be triggered in the Compile view already."
-- Splitting these into two independent facts -- `kind` (audience) and
-- `is_guide` (placeability) -- lets the app derive a real prayer's Bulletin
-- visibility automatically instead of every Prayer always showing in both
-- Guide and Bulletin unconditionally (the prior, admittedly leaky, default).
--
-- Idempotent -- safe to re-run in full even after a partial run (this file
-- originally shipped as additive-only; the `kind` check constraint/default
-- fix below was folded in afterward, once the reclassification data script
-- revealed the original 20260716010000_prayer_guides.sql constraint still
-- only allowed 'prayer'/'guide' and was never touched by this migration).
alter table prayers add column if not exists is_guide boolean not null default false;

update prayers set is_guide = true where kind = 'guide';

alter table prayers drop constraint if exists prayers_kind_check;
alter table prayers add constraint prayers_kind_check check (kind in ('corporate', 'leader'));
alter table prayers alter column kind set default 'leader';
