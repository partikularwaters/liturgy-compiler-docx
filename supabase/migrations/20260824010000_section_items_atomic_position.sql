-- BA-003: section_items.position could duplicate under concurrent inserts.
-- insertSectionItem() (lib/liturgy/sectionItems.ts) computed "count of
-- existing rows" via one SELECT, then did a separate INSERT with no lock
-- held between the two -- two simultaneous placements into the same Section
-- could both read the same count and both insert at the same position.
--
-- Fix, per progress-tracker.md's BA-003 wording ("atomic insertion plus a
-- database uniqueness guarantee"):
--   1. A BEFORE INSERT trigger computes position server-side, inside the
--      same transaction as the insert, serialized by a per-Section
--      transaction-scoped advisory lock (pg_advisory_xact_lock) -- a second
--      concurrent insert into the same Section blocks here until the first
--      commits or rolls back, so the MAX(position) read below can never be
--      seen identically by two racing inserts.
--   2. A unique constraint on (section_id, position) as a hard backstop --
--      if anything ever bypasses the trigger (a future direct SQL write, a
--      bug), the database refuses the duplicate outright instead of
--      silently accepting it.
--
-- Renumber existing rows first (defensively, in case duplicates already
-- exist in production) so the unique constraint below can actually be added.
with ranked as (
  select id, section_id,
         row_number() over (partition by section_id order by position, created_at, id) - 1 as new_position
  from section_items
)
update section_items
set position = ranked.new_position
from ranked
where section_items.id = ranked.id
  and section_items.position <> ranked.new_position;

alter table section_items
  add constraint section_items_section_id_position_key unique (section_id, position);

create or replace function section_items_set_position() returns trigger as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.section_id::text, 0));

  select coalesce(max(position) + 1, 0)
  into new.position
  from section_items
  where section_id = new.section_id;

  return new;
end;
$$ language plpgsql;

drop trigger if exists section_items_set_position_trigger on section_items;
create trigger section_items_set_position_trigger
  before insert on section_items
  for each row
  execute function section_items_set_position();

-- Position is now always computed server-side by the trigger above --
-- whatever value the app sends (or omits) is overwritten. This closes the
-- race the app-level "count then insert" pattern was exposed to.
