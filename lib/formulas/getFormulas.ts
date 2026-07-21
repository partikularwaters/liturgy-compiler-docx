import { supabase } from "@/lib/db/supabase";
import type { Formula, TextMark } from "@/types/liturgy";

export async function getFormulas(sectionName?: string): Promise<Formula[]> {
  let query = supabase.from("formulas").select("id, section_name, name, default_text, marks");

  if (sectionName) {
    query = query.eq("section_name", sectionName);
  }

  const { data, error } = await query.order("section_name").order("name");

  if (error) {
    console.error("[lib/formulas/getFormulas]", error.message);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    sectionName: row.section_name,
    name: row.name,
    defaultText: row.default_text,
    marks: (row.marks as TextMark[] | null) ?? [],
  }));
}
