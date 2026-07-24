-- Bilingual FIL/ENG tagging for Formula, Prayer, and Song -- the same
-- concept scripture_selections already has, but a different mechanism.
-- Scripture can auto-match a translation pair by citation (a Bible verse
-- reference is a canonical, language-independent key) and even auto-create
-- the companion by fetching real text from bible_verses. None of that is
-- possible here -- two independently-authored Filipino and English prayers
-- can't be confirmed identical by the computer, and there's no independent
-- source to fetch a companion's text from. So instead of auto-matching,
-- `paired_id` is a real link the user sets explicitly (once, from a
-- picker), symmetrically on both rows, so either side finds its companion
-- with a single lookup.
--
-- Both columns are nullable with no default -- an untagged/unlinked
-- existing row honestly means "not yet tagged," not silently "Filipino"
-- (this project's library rows predate any translation concept, and
-- several genuinely mix languages already).
alter table formulas add column if not exists translation text check (translation in ('fil', 'en'));
alter table formulas add column if not exists paired_id uuid references formulas(id) on delete set null;

alter table prayers add column if not exists translation text check (translation in ('fil', 'en'));
alter table prayers add column if not exists paired_id uuid references prayers(id) on delete set null;

alter table songs add column if not exists translation text check (translation in ('fil', 'en'));
alter table songs add column if not exists paired_id uuid references songs(id) on delete set null;
