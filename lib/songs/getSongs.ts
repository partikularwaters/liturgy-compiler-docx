import { supabase } from "@/lib/db/supabase";
import type { Song } from "@/types/liturgy";

export async function getSongs(sectionName?: string): Promise<Song[]> {
  let query = supabase
    .from("songs")
    .select("id, section_name, kind, title, attribution, year_published, notes");

  if (sectionName) {
    query = query.eq("section_name", sectionName);
  }

  const { data, error } = await query.order("section_name").order("title");

  if (error) {
    console.error("[lib/songs/getSongs]", error.message);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    sectionName: row.section_name,
    kind: row.kind as "psalm" | "hymn",
    title: row.title,
    attribution: row.attribution,
    yearPublished: row.year_published,
    notes: row.notes,
  }));
}
