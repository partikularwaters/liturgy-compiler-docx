-- Bilingual tagging (2026-07-25 migration) intentionally allows two Formula
-- rows with the same section_name+name -- one 'fil', one 'en' (e.g. two
-- "Trinitarian Seal" rows in Benediction). The existing
-- formulas_section_name_name_key unique(section_name, name) constraint from
-- 20260713050000_formula_section_scope.sql predates that and blocks it,
-- surfacing as "A Formula with this name already exists in this Section."
-- when saving the second translation. Widening the constraint to include
-- translation fixes this while still blocking true duplicates (same name,
-- same section, same translation).

alter table formulas drop constraint formulas_section_name_name_key;
alter table formulas add constraint formulas_section_name_name_translation_key unique (section_name, name, translation);
