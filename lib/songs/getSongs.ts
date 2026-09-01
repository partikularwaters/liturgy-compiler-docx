import { supabase } from "@/lib/db/supabase";
import type { Song } from "@/types/liturgy";

interface SongRow {
  id: string;
  section_name: string;
  kind: string;
  title: string;
  attribution: string | null;
  year_published: string | null;
  notes: string | null;
  owner_id: string | null;
  translation?: "fil" | "en" | null;
  paired_id?: string | null;
  song_section_tags?: { section_name: string }[];
}

function toSong(row: SongRow): Song {
  return {
    id: row.id,
    sectionName: row.section_name,
    // Falls back to [section_name] whenever no tag rows exist for this
    // Song -- covers both the pre-migration-applied case (this table
    // doesn't exist yet in this environment, same reasoning as this
    // function's own translation/paired_id fallback below) and a genuine
    // gap (a tag insert that failed after the Song itself saved
    // successfully, see createSong's own comment) -- a Song must never go
    // fully untagged and invisible everywhere just because its one tag
    // insert didn't land.
    sectionNames:
      row.song_section_tags && row.song_section_tags.length > 0
        ? row.song_section_tags.map((t) => t.section_name)
        : [row.section_name],
    kind: row.kind as "psalm" | "hymn",
    title: row.title,
    attribution: row.attribution,
    yearPublished: row.year_published,
    notes: row.notes,
    translation: row.translation ?? null,
    pairedId: row.paired_id ?? null,
    ownerId: row.owner_id ?? null,
  };
}

// `null` means the read failed -- distinct from `[]`, a genuinely empty
// library -- so a caller that must not silently proceed on missing Song
// data (the export route) can fail closed instead of treating the two the
// same, matching getItemsForSection's contract (BA-004).
export async function getSongs(sectionName?: string): Promise<Song[] | null> {
  let data: SongRow[] | null = null;
  let error: { message: string } | null = null;

  // Always load the complete tag set, then apply the optional membership
  // filter below. PostgREST's filtered embedded relation only returns the
  // matching tag, which made a Song look single-Section to an incidental
  // Compile View edit and could collapse its other tags on save.
  {
    const query = supabase
      .from("songs")
      .select(
        "id, section_name, kind, title, attribution, year_published, notes, translation, paired_id, owner_id, song_section_tags(section_name)"
      );
    const result = await query.order("section_name").order("title");
    data = result.data as SongRow[] | null;
    error = result.error;
  }

  // Graceful fallback if song_section_tags doesn't exist yet in this
  // environment (manually-applied migrations) -- fall back to the old
  // section_name-only filter/shape rather than failing the whole read.
  if (error?.message.includes("song_section_tags")) {
    let fallbackQuery = supabase
      .from("songs")
      .select("id, section_name, kind, title, attribution, year_published, notes, translation, paired_id, owner_id");
    if (sectionName) fallbackQuery = fallbackQuery.eq("section_name", sectionName);
    const fallback = await fallbackQuery.order("section_name").order("title");
    data = fallback.data as SongRow[] | null;
    error = fallback.error;
  }

  // Graceful fallback if `translation`/`paired_id` aren't present yet --
  // migrations are applied manually, not automatically.
  if (error?.message.includes("translation") || error?.message.includes("paired_id")) {
    let fallbackQuery = supabase
      .from("songs")
      .select("id, section_name, kind, title, attribution, year_published, notes, owner_id");
    if (sectionName) fallbackQuery = fallbackQuery.eq("section_name", sectionName);
    const fallback = await fallbackQuery.order("section_name").order("title");
    data = (fallback.data?.map((row) => ({ ...row, translation: null, paired_id: null })) ?? null) as
      | SongRow[]
      | null;
    error = fallback.error;
  }

  if (error) {
    console.error("[lib/songs/getSongs]", error.message);
    return null;
  }

  const songs = (data ?? []).map(toSong);
  return sectionName ? songs.filter((song) => song.sectionNames.includes(sectionName)) : songs;
}
