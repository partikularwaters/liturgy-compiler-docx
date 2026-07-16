"use server";

import { supabase } from "@/lib/db/supabase";
import type { HighlightColor } from "@/types/bible";

export async function setHighlight(
  book: string,
  chapter: number,
  verse: number,
  color: HighlightColor | null
): Promise<{ success: boolean; error?: string }> {
  if (color === null) {
    const { error } = await supabase
      .from("verse_highlights")
      .delete()
      .eq("book", book)
      .eq("chapter", chapter)
      .eq("verse", verse);

    if (error) {
      console.error("[lib/bible/highlightActions/setHighlight]", error.message);
      return { success: false, error: "Unable to remove this highlight right now." };
    }
    return { success: true };
  }

  const { error } = await supabase
    .from("verse_highlights")
    .upsert(
      { book, chapter, verse, color, updated_at: new Date().toISOString() },
      { onConflict: "book,chapter,verse" }
    );

  if (error) {
    console.error("[lib/bible/highlightActions/setHighlight]", error.message);
    return { success: false, error: "Unable to save this highlight right now." };
  }
  return { success: true };
}
