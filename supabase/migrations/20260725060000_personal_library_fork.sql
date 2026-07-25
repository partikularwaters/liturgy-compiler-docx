-- Personal Library fork tracking for Prayer/Song
-- forked_from_id lets a Compiler's own copy of a Prayer/Song remember
-- which shared entry it started from, so editing the same placement
-- again updates their existing fork instead of creating a new one
-- every time. Self-referencing, nullable -- most rows (the shared
-- canonical set) have no fork origin at all.

alter table prayers add column if not exists forked_from_id uuid references prayers(id) on delete set null;
alter table songs add column if not exists forked_from_id uuid references songs(id) on delete set null;
