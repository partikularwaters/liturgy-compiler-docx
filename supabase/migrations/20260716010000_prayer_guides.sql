-- Phase 7, Feature 27: Prayer Guides
-- New `guide` kind within the existing Prayer library (same table, tagged
-- like Songs would be, per redesign-plan-v1.1.md §W) -- Section-scoped,
-- editable/addable via Browse Library, not hardcoded. `kind` defaults to
-- 'prayer' so every existing row keeps its current meaning unchanged; only
-- newly-created 'guide' rows opt into the new reference-panel display.
-- No seed data here either, same discipline as the original prayers table:
-- real guide content (per §W's structural checklists) is Madrid's to author
-- through the app, not fabricated in a migration.

alter table prayers
  add column if not exists kind text not null default 'prayer'
    check (kind in ('prayer', 'guide'));
