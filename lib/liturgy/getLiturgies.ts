import { supabase } from "@/lib/db/supabase";
import { getItemsForSections } from "@/lib/liturgy/sectionItems";
import type { LiturgySummary, SermonItem, TemplateSection } from "@/types/liturgy";

export async function getLiturgies(): Promise<LiturgySummary[]> {
  const { data, error } = await supabase
    .from("liturgies")
    .select("id, service_date, lords_day_number, templates(name, sections)")
    .order("service_date", { ascending: false });

  if (error || !data) {
    console.error("[lib/liturgy/getLiturgies]", error?.message);
    return [];
  }

  if (data.length === 0) return [];

  const { data: sectionRows, error: sectionsError } = await supabase
    .from("sections")
    .select("id, liturgy_id, template_section_index")
    .in(
      "liturgy_id",
      data.map((row) => row.id)
    );

  if (sectionsError) {
    console.error("[lib/liturgy/getLiturgies]", sectionsError.message);
  }

  const itemsBySection = await getItemsForSections((sectionRows ?? []).map((row) => row.id));

  return data.map((row) => {
    const template = row.templates as unknown as { name: string; sections: TemplateSection[] };
    const sermonSectionIndex = template.sections.findIndex((s) => s.name === "Sermon");
    const sermonRow = sectionRows?.find(
      (s) => s.liturgy_id === row.id && s.template_section_index === sermonSectionIndex
    );
    const sermonItem = (sermonRow ? itemsBySection.get(sermonRow.id) : undefined)?.find(
      (item): item is SermonItem => item.type === "sermon"
    );

    return {
      id: row.id,
      templateName: template.name,
      serviceDate: row.service_date,
      lordsDayNumber: row.lords_day_number,
      sermonPassage: sermonItem?.passage ?? null,
    };
  });
}
