import { supabase } from "@/lib/db/supabase";
import type { Prayer } from "@/types/liturgy";

export async function getPrayers(sectionName?: string): Promise<Prayer[]> {
  let query = supabase.from("prayers").select("id, section_name, text");

  if (sectionName) {
    query = query.eq("section_name", sectionName);
  }

  const { data, error } = await query.order("section_name");

  if (error) {
    console.error("[lib/prayers/getPrayers]", error.message);
    return [];
  }

  return data.map((row) => ({ id: row.id, sectionName: row.section_name, text: row.text }));
}
