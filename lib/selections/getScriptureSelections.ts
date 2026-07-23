import { supabase } from "@/lib/db/supabase";
import { compareCitations, getSectionOrderIndex } from "@/lib/liturgy/canonicalOrder";
import type { ScriptureSelection, TextMark } from "@/types/liturgy";

export async function getScriptureSelections(sectionName?: string): Promise<ScriptureSelection[]> {
  let query = supabase
    .from("scripture_selections")
    .select("id, section_name, citation, text, translation, marks");

  if (sectionName) {
    query = query.eq("section_name", sectionName);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[lib/selections/getScriptureSelections]", error.message);
    return [];
  }

  const selections = data.map((row) => ({
    id: row.id,
    sectionName: row.section_name,
    citation: row.citation,
    text: row.text,
    translation: (row.translation as "fil" | "en" | null) ?? "fil",
    marks: (row.marks as TextMark[] | null) ?? [],
  }));

  // Order of Worship sequence for Section,
  // then real OT/NT canonical order for citation within a Section (not
  // alphabetical, which scattered e.g. "1 Peter" before "Genesis"). A
  // Filipino/English translation pair for the same passage now sorts
  // adjacent to each other too, since compareCitations normalizes both to
  // the same canonical position before comparing.
  return selections.sort((a, b) => {
    const sectionDelta = getSectionOrderIndex(a.sectionName) - getSectionOrderIndex(b.sectionName);
    if (sectionDelta !== 0) return sectionDelta;
    return compareCitations(a.citation, b.citation);
  });
}
