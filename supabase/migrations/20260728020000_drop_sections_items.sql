-- v3 item 1 follow-up: sections.items (the old jsonb array) is fully
-- superseded by section_items (20260728010000_section_items_table.sql) --
-- verified live 2026-07-28 (Compile View, docx export, public Web View all
-- read/write section_items correctly; a real add/remove round-trip
-- confirmed against the live database). Safe to drop now that the cutover
-- is confirmed, not bundled with the additive migration so the rollback
-- window was real.
alter table sections drop column items;
