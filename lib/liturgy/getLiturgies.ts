import { supabase } from "@/lib/db/supabase";
import { getItemsForSections } from "@/lib/liturgy/sectionItems";
import type { Item, LiturgySummary, SelectionItem, SermonItem, TemplateSection } from "@/types/liturgy";

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

  // This is a summary list, not an export -- degrade gracefully (log and
  // treat as "no sermon passage to show") rather than fail the whole
  // dashboard over one item-read error, matching this function's own
  // existing handling of sectionsError above. BA-004's fail-closed
  // requirement is specifically about getLiturgy()'s export path, where a
  // silent gap produces a misleadingly "complete" downloadable document.
  const itemsResult = await getItemsForSections((sectionRows ?? []).map((row) => row.id));
  if (itemsResult === null) {
    console.error("[lib/liturgy/getLiturgies] failed to load items for one or more sections");
  }
  const itemsBySection = itemsResult ?? new Map<string, Item[]>();

  return data.map((row) => {
    const template = row.templates as unknown as { name: string; sections: TemplateSection[] };

    // Morning's own "Sermon" section holds a real SermonItem. Vesper has no
    // Sermon section at all -- "The Lord's Discourses" (a Selection) is its
    // closest equivalent for this summary line, per Madrid's own framing
    // (the Liturgies list's middle/side text next to the template name and
    // date). `sermonPassage` carries either value; the field wasn't renamed
    // since every consumer already treats it as "whatever goes in that
    // slot," not literally "a Sermon."
    const sectionName = template.name === "Vesper Worship" ? "The Lord’s Discourses" : "Sermon";
    const sectionIndex = template.sections.findIndex((s) => s.name === sectionName);
    const sectionRow = sectionRows?.find(
      (s) => s.liturgy_id === row.id && s.template_section_index === sectionIndex
    );
    const items = sectionRow ? itemsBySection.get(sectionRow.id) : undefined;

    const sermonItem =
      sectionName === "Sermon" ? items?.find((item): item is SermonItem => item.type === "sermon") : undefined;

    const sermonPassage =
      sectionName === "Sermon"
        ? (sermonItem?.passage ?? null)
        : (items?.find((item): item is SelectionItem => item.type === "selection")?.citation ?? null);

    return {
      id: row.id,
      templateName: template.name,
      serviceDate: row.service_date,
      lordsDayNumber: row.lords_day_number,
      sermonPassage,
      sermonTitle: sermonItem?.title ?? null,
    };
  });
}
