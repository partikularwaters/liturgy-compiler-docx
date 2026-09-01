-- Track B (2026-08-31): natural-flow auto-merging of 2+ Selections in one
-- Section into a single flowing paragraph was previously unconditional
-- (SectionCard.tsx: any Section with 2+ Selections merged, no exceptions).
-- Assurance of Pardon keeps that old, unconditional behavior untouched --
-- no code change, no toggle. This column adds a *new*, separate mechanism:
-- a per-liturgy-instance opt-in, exposed only on Righteousness of God, Call
-- to Confession, and The Lord's Discourses (the last one forward-looking,
-- for if/when it ever holds more than its single rotation-assigned reading).
-- Same shape as column_break_before/show_prayer_guide/
-- silent_confession_language: a per-Section-instance choice on `sections`,
-- not a template default, since it depends on that week's actual content.
--
-- This project has no direct Postgres connection in this environment (see
-- 20260721030000_column_break_before.sql's note) -- applied via Supabase's
-- SQL editor by Madrid, kept here as the documented, auditable source.
alter table sections
  add column merge_selections boolean not null default false;
