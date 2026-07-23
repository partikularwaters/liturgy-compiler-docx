import { supabase } from "@/lib/db/supabase";
import { getSectionOrderIndex } from "@/lib/liturgy/canonicalOrder";
import type { Prayer, TextMark } from "@/types/liturgy";

export async function getPrayers(sectionName?: string): Promise<Prayer[]> {
  let query = supabase.from("prayers").select("id, section_name, text, kind, marks, is_guide");

  if (sectionName) {
    query = query.eq("section_name", sectionName);
  }

  let { data, error } = await query;

  // 2026-07-23: `is_guide` (20260723020000_prayer_kind_redesign.sql) may not
  // be run yet -- same graceful missing-column fallback as `marks` below, so
  // the whole Library's Prayer list doesn't go down while Madrid gets to the
  // migration. Falls back to the old `kind === 'guide'` reading so behavior
  // is unchanged until the column exists.
  if (error?.message.includes("is_guide")) {
    let fallbackQuery = supabase.from("prayers").select("id, section_name, text, kind, marks");
    if (sectionName) fallbackQuery = fallbackQuery.eq("section_name", sectionName);
    const fallback = await fallbackQuery;
    data = fallback.data?.map((row) => ({ ...row, is_guide: row.kind === "guide" })) ?? null;
    error = fallback.error;
  }

  // 2026-07-23: `marks` (20260723010000_prayer_marks.sql) may not be run yet
  // -- same graceful missing-column fallback as getLiturgy.ts, so the whole
  // Library's Prayer list doesn't go down while Madrid gets to the migration.
  if (error?.message.includes("marks")) {
    let fallbackQuery = supabase.from("prayers").select("id, section_name, text, kind");
    if (sectionName) fallbackQuery = fallbackQuery.eq("section_name", sectionName);
    const fallback = await fallbackQuery;
    data = fallback.data?.map((row) => ({ ...row, marks: [], is_guide: row.kind === "guide" })) ?? null;
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
    kind: row.kind as "corporate" | "leader",
    marks: (row.marks as TextMark[] | undefined) ?? [],
    isGuide: Boolean((row as { is_guide?: boolean }).is_guide),
  }));

  // Direct feedback (2026-07-22): Order of Worship sequence for actual
  // Prayers; Guides stay in whatever order they came back in (Madrid: more
  // sensible alphabetical-ish grouping for reference material, not a strict
  // service sequence) -- so this only reorders the non-guide rows.
  return prayers.sort((a, b) => {
    if (a.isGuide !== b.isGuide) return 0;
    if (a.isGuide) return 0;
    return getSectionOrderIndex(a.sectionName) - getSectionOrderIndex(b.sectionName);
  });
}
