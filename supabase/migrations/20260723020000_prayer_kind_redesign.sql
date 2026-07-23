-- 2026-07-23: Prayer Kind redesign, Phase 1 (additive only).
--
-- `kind` currently conflates two unrelated facts: who a prayer is for
-- ("corporate" vs "leader") and whether it's placeable content at all vs a
-- reference-only checklist ("guide"). Madrid: "I don't think the Guide is
-- relevant any more since we have guides already... The Guide, if we're
-- talking about the outline, can be triggered in the Compile view already."
-- Splitting these into two independent facts -- `kind` (audience) and
-- `is_guide` (placeability) -- lets the app derive a real prayer's Bulletin
-- visibility automatically instead of every Prayer always showing in both
-- Guide and Bulletin unconditionally (the current, admittedly leaky, default).
--
-- Purely additive: backfills `is_guide = true` for every existing
-- `kind = 'guide'` row so the app's guide-filtering logic can switch from
-- `kind === 'guide'` to `is_guide === true` with zero behavior change. The
-- `kind` column's actual values ("prayer"/"guide" -> "corporate"/"leader")
-- are NOT touched here -- that reclassification is a confirmed, reviewed
-- data mutation (see the throwaway conversion script run alongside the app
-- code change), not a blind DDL default.
alter table prayers add column is_guide boolean not null default false;

update prayers set is_guide = true where kind = 'guide';
