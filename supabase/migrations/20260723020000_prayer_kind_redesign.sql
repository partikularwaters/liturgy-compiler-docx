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
-- Idempotent -- safe to re-run in full even after a partial run. Ordering
-- matters: the old constraint (`kind in ('prayer', 'guide')`, from
-- 20260716010000_prayer_guides.sql) has to come off, and every row's `kind`
-- has to already satisfy the new constraint, before the new constraint goes
-- on -- otherwise ADD CONSTRAINT fails against whatever rows still hold the
-- old values (confirmed live: "check constraint ... is violated by some row").
alter table prayers add column if not exists is_guide boolean not null default false;

update prayers set is_guide = true where kind = 'guide';

alter table prayers drop constraint if exists prayers_kind_check;

-- Reclassification confirmed with Madrid (2026-07-23/24): the 2 Confession
-- of Sin prayers are corporate (prayed by the whole church); everything
-- else -- including the 6 real `is_guide` checklist rows, for which `kind`
-- is now meaningless -- gets 'leader'.
update prayers set kind = 'corporate' where section_name = 'Confession of Sin' and not is_guide;
update prayers set kind = 'leader' where kind not in ('corporate');

alter table prayers add constraint prayers_kind_check check (kind in ('corporate', 'leader'));
alter table prayers alter column kind set default 'leader';
