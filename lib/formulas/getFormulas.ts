import { supabase } from "@/lib/db/supabase";
import { getSectionOrderIndex } from "@/lib/liturgy/canonicalOrder";
import type { Formula, TextMark } from "@/types/liturgy";

export async function getFormulas(sectionName?: string): Promise<Formula[]> {
  let query = supabase
    .from("formulas")
    .select("id, section_name, name, default_text, marks, translation, paired_id, owner_id, kind");

  if (sectionName) {
    query = query.eq("section_name", sectionName);
  }

  let { data, error } = await query.order("name");

  // Graceful fallback if `translation`/`paired_id` aren't present yet --
  // migrations are applied manually, not automatically.
  if (error?.message.includes("translation") || error?.message.includes("paired_id")) {
    let fallbackQuery = supabase.from("formulas").select("id, section_name, name, default_text, marks, owner_id, kind");
    if (sectionName) fallbackQuery = fallbackQuery.eq("section_name", sectionName);
    const fallback = await fallbackQuery.order("name");
    data = fallback.data?.map((row) => ({ ...row, translation: null, paired_id: null })) ?? null;
    error = fallback.error;
  }

  if (error || !data) {
    console.error("[lib/formulas/getFormulas]", error?.message);
    return [];
  }

  const formulas = data.map((row) => ({
    id: row.id,
    sectionName: row.section_name,
    name: row.name,
    defaultText: row.default_text,
    marks: (row.marks as TextMark[] | null) ?? [],
    translation: (row as { translation?: "fil" | "en" | null }).translation ?? null,
    pairedId: (row as { paired_id?: string | null }).paired_id ?? null,
    ownerId: (row as { owner_id?: string | null }).owner_id ?? null,
    kind: (row as { kind?: "affirmation" | "covenant" | null }).kind ?? null,
  }));

  // Order of Worship sequence instead of
  // alphabetical by Section name.
  return formulas.sort((a, b) => getSectionOrderIndex(a.sectionName) - getSectionOrderIndex(b.sectionName));
}
