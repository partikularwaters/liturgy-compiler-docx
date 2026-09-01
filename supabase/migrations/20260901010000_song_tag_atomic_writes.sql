-- A Song and its Section tags are one logical Library record. Keep their
-- create/update operations in one database transaction so a failed tag write
-- cannot report success with a partially-tagged Song.
--
-- Authorization remains in lib/songs/songActions.ts before either RPC is
-- called. These functions run only through the server-side service-role
-- client; the database contract grants execute solely to service_role.

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
    owner_id
  ) values (
    p_section_names[1],
    p_kind,
    p_title,
    nullif(p_attribution, ''),
    nullif(p_year_published, ''),
    nullif(p_notes, ''),
    p_translation,
    p_owner_id
  ) returning id into v_song_id;

  insert into song_section_tags (song_id, section_name)
  select v_song_id, section_name
  from unnest(p_section_names) as tag(section_name);

  return v_song_id;
end;
$$;

create or replace function update_song_with_tags(
  p_song_id uuid,
  p_section_names text[],
  p_kind text,
  p_title text,
  p_attribution text,
  p_year_published text,
  p_notes text,
  p_translation text
) returns void
language plpgsql
as $$
begin
  if coalesce(array_length(p_section_names, 1), 0) = 0 then
    raise exception 'At least one Section is required';
  end if;

  update songs
  set
    section_name = p_section_names[1],
    kind = p_kind,
    title = p_title,
    attribution = nullif(p_attribution, ''),
    year_published = nullif(p_year_published, ''),
    notes = nullif(p_notes, ''),
    translation = p_translation
  where id = p_song_id;

  if not found then
    raise exception 'Song not found';
  end if;

  delete from song_section_tags where song_id = p_song_id;

  insert into song_section_tags (song_id, section_name)
  select p_song_id, section_name
  from unnest(p_section_names) as tag(section_name);
end;
$$;
