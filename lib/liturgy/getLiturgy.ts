import { supabase } from "@/lib/db/supabase";
import type { CompiledLiturgy, CompiledSection, Item, TemplateSection } from "@/types/liturgy";

export async function getLiturgy(id: string): Promise<CompiledLiturgy | null> {
  const { data: liturgy, error: liturgyError } = await supabase
    .from("liturgies")
    .select("id, service_date, lords_day_number, templates(name, sections)")
    .eq("id", id)
    .single();

  if (liturgyError || !liturgy) {
    if (liturgyError) console.error("[lib/liturgy/getLiturgy]", liturgyError.message);
    return null;
  }

  const { data: sectionRows, error: sectionsError } = await supabase
    .from("sections")
    .select("template_section_index, items")
    .eq("liturgy_id", id)
    .order("template_section_index");

  if (sectionsError || !sectionRows) {
    console.error("[lib/liturgy/getLiturgy]", sectionsError?.message);
    return null;
  }

  const template = liturgy.templates as unknown as { name: string; sections: TemplateSection[] };
  const sections: CompiledSection[] = sectionRows.map((row) => ({
    ...template.sections[row.template_section_index],
    items: row.items as Item[],
  }));

  return {
    id: liturgy.id,
    templateName: template.name,
    serviceDate: liturgy.service_date,
    lordsDayNumber: liturgy.lords_day_number,
    sections,
  };
}
