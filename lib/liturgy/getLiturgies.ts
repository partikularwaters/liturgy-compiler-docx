import { supabase } from "@/lib/db/supabase";
import type { Item, LiturgySummary, SermonItem, TemplateSection } from "@/types/liturgy";

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
    .select("liturgy_id, template_section_index, items")
    .in(
      "liturgy_id",
      data.map((row) => row.id)
    );

  if (sectionsError) {
    console.error("[lib/liturgy/getLiturgies]", sectionsError.message);
  }

  return data.map((row) => {
    const template = row.templates as unknown as { name: string; sections: TemplateSection[] };
    const sermonSectionIndex = template.sections.findIndex((s) => s.name === "Sermon");
    const sermonRow = sectionRows?.find(
      (s) => s.liturgy_id === row.id && s.template_section_index === sermonSectionIndex
    );
    const sermonItem = (sermonRow?.items as Item[] | undefined)?.find(
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
