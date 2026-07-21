import { supabase } from "@/lib/db/supabase";
import { getSectionOrderIndex } from "@/lib/liturgy/canonicalOrder";
import type { Prayer } from "@/types/liturgy";

export async function getPrayers(sectionName?: string): Promise<Prayer[]> {
  let query = supabase.from("prayers").select("id, section_name, text, kind");

  if (sectionName) {
    query = query.eq("section_name", sectionName);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[lib/prayers/getPrayers]", error.message);
    return [];
  }

  const prayers = data.map((row) => ({
    id: row.id,
    sectionName: row.section_name,
    text: row.text,
    kind: row.kind as "prayer" | "guide",
  }));

  // Direct feedback (2026-07-22): Order of Worship sequence for actual
  // Prayers; Guides stay in whatever order they came back in (Madrid: more
  // sensible alphabetical-ish grouping for reference material, not a strict
  // service sequence) -- so this only reorders the "prayer"-kind rows.
  return prayers.sort((a, b) => {
    if (a.kind !== b.kind) return 0;
    if (a.kind === "guide") return 0;
    return getSectionOrderIndex(a.sectionName) - getSectionOrderIndex(b.sectionName);
  });
}
