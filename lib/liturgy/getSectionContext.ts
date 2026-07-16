import { supabase } from "@/lib/db/supabase";
import type { Item, TemplateSection } from "@/types/liturgy";

export interface SectionContext {
  id: string;
  items: Item[];
  sectionName: string;
}

export async function getSectionContext(
  liturgyId: string,
  sectionIndex: number
): Promise<SectionContext | null> {
  const { data: liturgy, error: liturgyError } = await supabase
    .from("liturgies")
    .select("templates(sections)")
    .eq("id", liturgyId)
    .single();

  if (liturgyError || !liturgy) {
    console.error("[lib/liturgy/getSectionContext]", liturgyError?.message);
    return null;
  }

  const { data: sectionRow, error: sectionError } = await supabase
    .from("sections")
    .select("id, items")
    .eq("liturgy_id", liturgyId)
    .eq("template_section_index", sectionIndex)
    .single();

  if (sectionError || !sectionRow) {
    console.error("[lib/liturgy/getSectionContext]", sectionError?.message);
    return null;
  }

  const template = liturgy.templates as unknown as { sections: TemplateSection[] };
  const sectionName = template.sections[sectionIndex]?.name;

  if (!sectionName) {
    console.error("[lib/liturgy/getSectionContext] no template section at index", sectionIndex);
    return null;
  }

  return { id: sectionRow.id, items: sectionRow.items as Item[], sectionName };
}
