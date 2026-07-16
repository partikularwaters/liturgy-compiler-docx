import { supabase } from "@/lib/db/supabase";
import type { HighlightColor, VerseHighlights } from "@/types/bible";

export async function getHighlights(book: string, chapter: number): Promise<VerseHighlights> {
  const { data, error } = await supabase
    .from("verse_highlights")
    .select("verse, color")
    .eq("book", book)
    .eq("chapter", chapter);

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
