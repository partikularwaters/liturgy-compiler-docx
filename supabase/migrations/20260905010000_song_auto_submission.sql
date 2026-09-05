-- Auto-submission (2026-09-05, direct product decision): a Compiler's new
-- Song proposal used to sit at the table's own 'draft' default until a
-- separate manual "Submit for Review" trip on /my-library -- now it lands
-- straight in the Curator Inbox, matching the same change made to
-- lib/prayers/prayerActions.ts's createPrayer in the same session. A
-- Curator's own creation (p_owner_id null) is already canonical/shared, so
-- status is moot there; the column's own default ('draft') still applies.
--
-- Redefines create_song_with_tags from 20260901010000_song_tag_atomic_writes.sql
-- (create or replace, not an edit to that file) -- update_song_with_tags is
-- untouched, since editing an existing Song was never in scope for
-- auto-submission.
create or replace function create_song_with_tags(
  p_section_names text[],
  p_kind text,
  p_title text,
  p_attribution text,
  p_year_published text,
  p_notes text,
  p_translation text,
  p_owner_id uuid
) returns uuid
language plpgsql
as $$
declare
  v_song_id uuid;
begin
  if coalesce(array_length(p_section_names, 1), 0) = 0 then
    raise exception 'At least one Section is required';
  end if;

  insert into songs (
    section_name,
    kind,
    title,
    attribution,
    year_published,
    notes,
    translation,
    owner_id,
    status
  ) values (
    p_section_names[1],
    p_kind,
    p_title,
    nullif(p_attribution, ''),
    nullif(p_year_published, ''),
    nullif(p_notes, ''),
    p_translation,
    p_owner_id,
    case when p_owner_id is not null then 'submitted' else 'draft' end
  ) returning id into v_song_id;

  insert into song_section_tags (song_id, section_name)
  select v_song_id, section_name
  from unnest(p_section_names) as tag(section_name);

  return v_song_id;
end;
$$;
