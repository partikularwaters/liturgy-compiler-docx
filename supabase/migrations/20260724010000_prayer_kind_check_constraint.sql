-- Follow-up to 20260723020000_prayer_kind_redesign.sql -- that migration
-- added `is_guide` but didn't touch the original `prayers_kind_check`
-- constraint (from 20260716010000_prayer_guides.sql), which still only
-- allows `kind in ('prayer', 'guide')`. The app-level reclassification data
-- script (updating real rows to 'corporate'/'leader') fails against this
-- constraint until it's replaced.
alter table prayers drop constraint prayers_kind_check;
alter table prayers add constraint prayers_kind_check check (kind in ('corporate', 'leader'));

-- Default also referenced the old value.
alter table prayers alter column kind set default 'leader';
