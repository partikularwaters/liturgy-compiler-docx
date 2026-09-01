-- Track B (2026-08-31): Songs move from one Section (`songs.section_name`,
-- a single text column) to many -- the same Hymn/Psalm can now be tagged
-- for every Section it's actually used in, instead of requiring a
-- duplicate `songs` row per Section (the only workaround the old model
-- allowed). First many-to-many/join-table relationship in this schema --
-- every other relationship here is a foreign key or a single scoping
-- column, so this is a genuinely new shape, not an extension of one.
--
-- `songs.section_name` is deliberately kept (not dropped) -- nothing yet
-- depends on it as the source of truth once this ships, but dropping it
-- isn't required by this migration and risks breaking something not yet
-- found. A future migration can drop it once every consumer is confirmed
-- reading only from song_section_tags.
create table song_section_tags (
  song_id uuid not null references songs(id) on delete cascade,
  section_name text not null,
  primary key (song_id, section_name)
);

alter table song_section_tags enable row level security;

-- Backfill: one tag per existing Song, from its current single section_name.
-- No data loss, no merging -- every existing row keeps exactly the
-- placement it already had.
insert into song_section_tags (song_id, section_name)
select id, section_name from songs
on conflict do nothing;

-- Same-title+kind duplicate detection was in scope for this migration (the
-- old one-row-per-Section model meant the same Hymn used in two Sections
-- required two separate `songs` rows). Deliberately NOT auto-merged here:
-- `songs.attribution`/`notes`/`year_published` could genuinely differ
-- between two rows that share a title+kind (e.g. different attribution
-- text entered for the same hymn), and there is no `created_at` or other
-- column on `songs` to safely establish which row's version of that data
-- is authoritative. Blindly deleting one row on a title+kind match alone
-- risks silently discarding real, different content. Run the query below
-- after this migration to find and manually review any actual duplicates
-- rather than guessing:
--
-- select kind, title, count(*), array_agg(id) as song_ids
-- from songs
-- group by kind, title
-- having count(*) > 1;
