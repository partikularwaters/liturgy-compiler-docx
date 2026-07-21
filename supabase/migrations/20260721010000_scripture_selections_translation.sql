-- v2: BSB (English) Selections. scripture_selections gains a translation
-- tag so a Filipino and an English entry for the same passage coexist as a
-- linked pair (matched at read/save time by canonical verse reference, not
-- a foreign key -- their citation strings already differ by book-name
-- spelling, so no constraint change is needed for the existing
-- unique(section_name, citation), just this new descriptive column).
-- Defaults every existing row to 'fil', since every Selection saved before
-- this feature came from AB1905 (Tagalog). A one-time backfill script
-- generates the missing English companion for each of those separately --
-- this migration only adds the column.

alter table scripture_selections
  add column if not exists translation text not null default 'fil'
    check (translation in ('fil', 'en'));
