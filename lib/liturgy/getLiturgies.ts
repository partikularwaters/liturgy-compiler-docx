import { supabase } from "@/lib/db/supabase";
import { getItemsForSections } from "@/lib/liturgy/sectionItems";
import type { LiturgySummary, SelectionItem, SermonItem, TemplateSection } from "@/types/liturgy";

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

    // Morning's own "Sermon" section holds a real SermonItem. Vesper has no
    // Sermon section at all -- "The Lord's Discourses" (a Selection) is its
    // closest equivalent for this summary line, per Madrid's own framing
    // (the Liturgies list's middle/side text next to the template name and
    // date). `sermonPassage` carries either value; the field wasn't renamed
    // since every consumer already treats it as "whatever goes in that
    // slot," not literally "a Sermon."
    const sectionName = template.name === "Vesper Worship" ? "The Lord's Discourses" : "Sermon";
    const sectionIndex = template.sections.findIndex((s) => s.name === sectionName);
    const sectionRow = sectionRows?.find(
      (s) => s.liturgy_id === row.id && s.template_section_index === sectionIndex
    );
    const items = sectionRow ? itemsBySection.get(sectionRow.id) : undefined;

    const sermonPassage =
      sectionName === "Sermon"
        ? (items?.find((item): item is SermonItem => item.type === "sermon")?.passage ?? null)
        : (items?.find((item): item is SelectionItem => item.type === "selection")?.citation ?? null);

    return {
      id: row.id,
      templateName: template.name,
      serviceDate: row.service_date,
      lordsDayNumber: row.lords_day_number,
      sermonPassage,
    };
  });
}
