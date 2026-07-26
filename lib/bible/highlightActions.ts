"use server";

import { supabase } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { HighlightColor } from "@/types/bible";

// User-scoped (2026-07-27) -- highlights previously had no owner at all, so
// every visitor shared the exact same highlight state for every verse.
// Requires login, same as every other mutation in the app.
export async function setHighlight(
  book: string,
  chapter: number,
  verse: number,
  color: HighlightColor | null
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to highlight verses." };
  }

  if (color === null) {
    const { error } = await supabase
      .from("verse_highlights")
      .delete()
      .eq("user_id", currentUser.id)
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
      { user_id: currentUser.id, book, chapter, verse, color, updated_at: new Date().toISOString() },
      { onConflict: "user_id,book,chapter,verse" }
    );

  if (error) {
    console.error("[lib/bible/highlightActions/setHighlight]", error.message);
    return { success: false, error: "Unable to save this highlight right now." };
  }
  return { success: true };
}
