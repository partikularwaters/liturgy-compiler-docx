-- v2: Library-level marking toolbar (build-plan.md's v2 item 5). `formulas`
-- and `scripture_selections` gain the same `marks` shape SelectionItem/
-- FormulaItem already carry on placed instances, so a library entry can be
-- pre-marked once and have that carried onto every future placement as a
-- starting point, instead of remarking a Formula/Selection from scratch on
-- every single placement (Absolution's Minister/Congregation dialogue was
-- the original pain point). Default '[]' so every pre-existing row means
-- "no marks," identical to how placed items already treat an absent marks
-- field.
alter table formulas add column marks jsonb not null default '[]'::jsonb;
alter table scripture_selections add column marks jsonb not null default '[]'::jsonb;
