"use server";

import { supabase } from "@/lib/db/supabase";
import type { TemplateSection } from "@/types/liturgy";

export interface SelectableSection {
  index: number;
  name: string;
}

// Powers the Reader's own liturgy/Section picker -- for someone who
// free-browsed in via the top nav (no liturgyId/sectionIndex in the URL
// yet), this lets them choose a target without having to go back to the
// Compile View first. Only Sections whose item_types whitelist actually
// allows a Selection are offered, matching the same gating "+ Scripture"
// itself uses in SectionCard.tsx.
export async function getLiturgySections(liturgyId: string): Promise<SelectableSection[]> {
  const { data, error } = await supabase.from("liturgies").select("templates(sections)").eq("id", liturgyId).single();
  if (error || !data) return [];

  const template = data.templates as unknown as { sections: TemplateSection[] };
  return template.sections
    .map((section, index) => ({ index, name: section.name, item_types: section.item_types }))
    .filter((s) => !s.item_types || s.item_types.includes("selection"))
    .map(({ index, name }) => ({ index, name }));
}
