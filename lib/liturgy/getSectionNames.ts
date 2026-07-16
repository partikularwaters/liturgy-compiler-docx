import { supabase } from "@/lib/db/supabase";
import type { TemplateSection } from "@/types/liturgy";

export async function getSectionNames(): Promise<string[]> {
  const { data, error } = await supabase.from("templates").select("sections");

  if (error || !data) {
    console.error("[lib/liturgy/getSectionNames]", error?.message);
    return [];
  }

  const names = new Set<string>();
  for (const row of data) {
    for (const section of row.sections as TemplateSection[]) {
      names.add(section.name);
    }
  }

  return Array.from(names).sort();
}
