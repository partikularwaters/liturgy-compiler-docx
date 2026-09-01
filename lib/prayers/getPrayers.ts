import { supabase } from "@/lib/db/supabase";
import { getSectionOrderIndex } from "@/lib/liturgy/canonicalOrder";
import type { Prayer, TextMark } from "@/types/liturgy";

// `null` means the read failed -- distinct from `[]`, a genuinely empty
// library -- so a caller that must not silently proceed on missing Prayer
// data (the export route) can fail closed instead of treating the two the
// same, matching getItemsForSection's contract (BA-004).
export async function getPrayers(sectionName?: string): Promise<Prayer[] | null> {
  let query = supabase
    .from("prayers")
    .select("id, section_name, text, kind, marks, is_guide, translation, paired_id, owner_id");

  if (sectionName) {
    query = query.eq("section_name", sectionName);
  }

  let { data, error } = await query;

  // Graceful fallback if `translation`/`paired_id` aren't present yet --
  // migrations are applied manually, not automatically.
  if (error?.message.includes("translation") || error?.message.includes("paired_id")) {
    let fallbackQuery = supabase.from("prayers").select("id, section_name, text, kind, marks, is_guide, owner_id");
    if (sectionName) fallbackQuery = fallbackQuery.eq("section_name", sectionName);
    const fallback = await fallbackQuery;
    data = fallback.data?.map((row) => ({ ...row, translation: null, paired_id: null })) ?? null;
    error = fallback.error;
  }

  // Graceful fallback if `is_guide` isn't present yet -- migrations are
  // applied manually, not automatically, so the whole Library's Prayer list
  // shouldn't go down over a missing column. Falls back to the old
  // `kind === 'guide'` reading so behavior is unchanged until it exists.
  if (error?.message.includes("is_guide")) {
    let fallbackQuery = supabase.from("prayers").select("id, section_name, text, kind, marks, owner_id");
    if (sectionName) fallbackQuery = fallbackQuery.eq("section_name", sectionName);
    const fallback = await fallbackQuery;
    data = fallback.data?.map((row) => ({ ...row, is_guide: row.kind === "guide", translation: null, paired_id: null })) ?? null;
    error = fallback.error;
  }

  // Same graceful missing-column fallback as getLiturgy.ts, so the whole
  // Library's Prayer list doesn't go down over a missing column.
  if (error?.message.includes("marks")) {
    let fallbackQuery = supabase.from("prayers").select("id, section_name, text, kind, owner_id");
    if (sectionName) fallbackQuery = fallbackQuery.eq("section_name", sectionName);
    const fallback = await fallbackQuery;
    data =
      fallback.data?.map((row) => ({ ...row, marks: [], is_guide: row.kind === "guide", translation: null, paired_id: null })) ??
      null;
    error = fallback.error;
  }

  if (error) {
    console.error("[lib/prayers/getPrayers]", error.message);
    return null;
  }

  const prayers = (data ?? []).map((row) => ({
    id: row.id,
    sectionName: row.section_name,
    text: row.text,
    marks: (row.marks as TextMark[] | undefined) ?? [],
    isGuide: Boolean((row as { is_guide?: boolean }).is_guide),
    translation: (row as { translation?: "fil" | "en" | null }).translation ?? null,
    pairedId: (row as { paired_id?: string | null }).paired_id ?? null,
    ownerId: (row as { owner_id?: string | null }).owner_id ?? null,
  }));

  // Order of Worship sequence for actual
  // Prayers; Guides stay in whatever order they came back in -- alphabetical-ish
  // grouping is more sensible for reference material than a strict
  // service sequence -- so this only reorders the non-guide rows.
  return prayers.sort((a, b) => {
    if (a.isGuide !== b.isGuide) return 0;
    if (a.isGuide) return 0;
    return getSectionOrderIndex(a.sectionName) - getSectionOrderIndex(b.sectionName);
  });
}
