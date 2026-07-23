import { supabase } from "@/lib/db/supabase";
import { getSectionOrderIndex } from "@/lib/liturgy/canonicalOrder";
import type { Prayer, TextMark } from "@/types/liturgy";

export async function getPrayers(sectionName?: string): Promise<Prayer[]> {
  let query = supabase.from("prayers").select("id, section_name, text, kind, marks");

  if (sectionName) {
    query = query.eq("section_name", sectionName);
  }

  let { data, error } = await query;

  // 2026-07-23: `marks` (20260723010000_prayer_marks.sql) may not be run yet
  // -- same graceful missing-column fallback as getLiturgy.ts, so the whole
  // Library's Prayer list doesn't go down while Madrid gets to the migration.
  if (error?.message.includes("marks")) {
    let fallbackQuery = supabase.from("prayers").select("id, section_name, text, kind");
    if (sectionName) fallbackQuery = fallbackQuery.eq("section_name", sectionName);
    const fallback = await fallbackQuery;
    data = fallback.data?.map((row) => ({ ...row, marks: [] })) ?? null;
    error = fallback.error;
  }

  if (error || !data) {
    console.error("[lib/prayers/getPrayers]", error?.message);
    return [];
  }

  const prayers = data.map((row) => ({
    id: row.id,
    sectionName: row.section_name,
    text: row.text,
    kind: row.kind as "prayer" | "guide",
    marks: (row.marks as TextMark[] | undefined) ?? [],
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
