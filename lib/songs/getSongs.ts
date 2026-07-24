import { supabase } from "@/lib/db/supabase";
import type { Song } from "@/types/liturgy";

export async function getSongs(sectionName?: string): Promise<Song[]> {
  let query = supabase
    .from("songs")
    .select("id, section_name, kind, title, attribution, year_published, notes, translation, paired_id");

  if (sectionName) {
    query = query.eq("section_name", sectionName);
  }

  let { data, error } = await query.order("section_name").order("title");

  // Graceful fallback if `translation`/`paired_id` aren't present yet --
  // migrations are applied manually, not automatically.
  if (error?.message.includes("translation") || error?.message.includes("paired_id")) {
    let fallbackQuery = supabase
      .from("songs")
      .select("id, section_name, kind, title, attribution, year_published, notes");
    if (sectionName) fallbackQuery = fallbackQuery.eq("section_name", sectionName);
    const fallback = await fallbackQuery.order("section_name").order("title");
    data = fallback.data?.map((row) => ({ ...row, translation: null, paired_id: null })) ?? null;
    error = fallback.error;
  }

  if (error || !data) {
    console.error("[lib/songs/getSongs]", error?.message);
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
    translation: (row as { translation?: "fil" | "en" | null }).translation ?? null,
    pairedId: (row as { paired_id?: string | null }).paired_id ?? null,
  }));
}
