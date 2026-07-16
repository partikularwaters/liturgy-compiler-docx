-- Phase 3, Feature 08: Formula Library (retrofit — Section scoping)
-- Formulas are scoped per Section name, not one global catalog. Madrid's
-- explicit direction (2026-07-13): "You don't need an Absolution formula
-- to appear in other sections. Make formulas per section."
-- formulas table is empty (confirmed live before writing this migration),
-- so this is a safe structural change with no data to migrate.

alter table formulas add column section_name text not null default '';
alter table formulas alter column section_name drop default;

alter table formulas drop constraint formulas_name_key;
alter table formulas add constraint formulas_section_name_name_key unique (section_name, name);
