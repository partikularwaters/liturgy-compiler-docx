-- v2 item 2: Continuous-flow authoring + manual column-break overrides.
--
-- One new column on `sections` (the per-liturgy instance row, NOT
-- `templates.sections` jsonb) -- "push this Section to the start of the
-- next Word column" is a decision Madrid makes per liturgy, based on that
-- week's actual content volume, not a fixed per-template default. That's
-- the whole point of continuous flow replacing the old fixed page/column
-- assignment: content varies week to week, so the break points should too.
--
-- Additive, non-destructive, safe default (false) for every existing row --
-- no backfill/derivation from the old templates.sections[].page/.column
-- fields needed. Those fields stay untouched in the DB and in
-- types/liturgy.ts (frozen, same treatment as lib/pdf/), but the new docx
-- export path (lib/docx/) does not read them -- Word's native multi-column
-- section flow (see lib/docx/columnLayout.ts) makes per-Section page/column
-- assignment unnecessary; Section order + this one boolean is enough.
--
-- This file is applied via Supabase's SQL editor by Madrid -- this project
-- has no linked Supabase CLI project / direct Postgres connection string
-- (see 20260715010000_charge_benediction_split.sql's note), so DDL can't run
-- through supabase-js's REST interface. Kept here as the documented,
-- auditable source of truth for what was run.

alter table sections
  add column column_break_before boolean not null default false;
