import { supabase } from "@/lib/db/supabase";
import type { Item, TemplateSection } from "@/types/liturgy";

export interface TargetSection {
  liturgyId: string;
  sectionIndex: number;
  templateName: string;
  sectionName: string;
  citations: string[];
}

export async function getTargetSection(liturgyId: string, sectionIndex: number): Promise<TargetSection | null> {
  const { data: liturgy, error: liturgyError } = await supabase
    .from("liturgies")
    .select("id, templates(name, sections)")
    .eq("id", liturgyId)
    .single();

  if (liturgyError || !liturgy) return null;

  const template = liturgy.templates as unknown as { name: string; sections: TemplateSection[] };
  const sectionDef = template.sections[sectionIndex];
  if (!sectionDef) return null;

  const { data: sectionRow, error: sectionError } = await supabase
    .from("sections")
    .select("items")
    .eq("liturgy_id", liturgyId)
    .eq("template_section_index", sectionIndex)
    .single();

  if (sectionError || !sectionRow) return null;

  const items = sectionRow.items as Item[];
  const citations = items.filter((item) => item.type === "selection").map((item) => item.citation);

  return {
    liturgyId,
    sectionIndex,
    templateName: template.name,
    sectionName: sectionDef.name,
    citations,
  };
}
