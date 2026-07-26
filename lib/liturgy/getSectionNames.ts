import { supabase } from "@/lib/db/supabase";
import { getSectionOrderIndex } from "@/lib/liturgy/canonicalOrder";
import type { Item, TemplateSection } from "@/types/liturgy";

// Powers every "New Formula/Prayer/Song/Scripture" form's Section picker.
// `itemType`, when given, keeps only Sections whose item_types whitelist
// actually allows that kind of item -- same gating SectionCard.tsx's own
// "Add X" buttons and getLiturgySections.ts already use, just applied here
// too (previously this returned every Section name from every template with
// no filtering at all, so e.g. a brand-new Song could be "created into"
// Pastoral Prayer). A missing item_types on a Section means "allow every
// type," the same defensive default used everywhere else. Sorted by the
// Order of Worship's own sequence (SECTION_ORDER) instead of alphabetical,
// which read as arbitrary against the actual service.
export async function getSectionNames(itemType?: Item["type"]): Promise<string[]> {
  const { data, error } = await supabase.from("templates").select("sections");

  if (error || !data) {
    console.error("[lib/liturgy/getSectionNames]", error?.message);
    return [];
  }

  const names = new Set<string>();
  for (const row of data) {
    for (const section of row.sections as TemplateSection[]) {
      if (itemType && section.item_types && !section.item_types.includes(itemType)) continue;
      names.add(section.name);
    }
  }

  return Array.from(names).sort((a, b) => getSectionOrderIndex(a) - getSectionOrderIndex(b));
}
