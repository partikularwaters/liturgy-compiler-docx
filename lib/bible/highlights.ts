import { supabase } from "@/lib/db/supabase";
import type { HighlightColor, VerseHighlights } from "@/types/bible";

// User-scoped (2026-07-27) -- a signed-out visitor has no highlights of
// their own to show, so this returns empty rather than querying at all.
export async function getHighlights(book: string, chapter: number, userId: string | null): Promise<VerseHighlights> {
  if (!userId) return {};

  const { data, error } = await supabase
    .from("verse_highlights")
    .select("verse, color")
    .eq("book", book)
    .eq("chapter", chapter)
    .eq("user_id", userId);

  if (error) {
    console.error("[lib/bible/highlights/getHighlights]", error.message);
    return {};
  }

  const highlights: VerseHighlights = {};
  for (const row of data) {
    highlights[row.verse] = row.color as HighlightColor;
  }
  return highlights;
}
