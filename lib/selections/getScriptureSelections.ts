import { supabase } from "@/lib/db/supabase";
import type { ScriptureSelection } from "@/types/liturgy";

export async function getScriptureSelections(sectionName?: string): Promise<ScriptureSelection[]> {
  let query = supabase.from("scripture_selections").select("id, section_name, citation, text");

  if (sectionName) {
    query = query.eq("section_name", sectionName);
  }

  const { data, error } = await query.order("section_name").order("citation");

  if (error) {
    console.error("[lib/selections/getScriptureSelections]", error.message);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    sectionName: row.section_name,
    citation: row.citation,
    text: row.text,
  }));
}
