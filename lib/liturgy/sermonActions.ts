"use server";

import { supabase } from "@/lib/db/supabase";
import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import { normalizeTypography } from "@/lib/text/typographic";
import type { SermonItem } from "@/types/liturgy";

// Sermon is a single passage-reference field per liturgy, not a list — saving
// replaces the existing sermon item in this Section if one is already there.
export async function saveSermonPassage(
  liturgyId: string,
  sectionIndex: number,
  passage: string
): Promise<{ success: boolean; error?: string }> {
  if (!passage.trim()) {
    return { success: false, error: "Sermon passage is required." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  if (section.sectionName !== "Sermon") {
    return { success: false, error: "Sermon can only be added to the Sermon Section." };
  }

  const normalizedPassage = normalizeTypography(passage);
  const existing = section.items.find((item) => item.type === "sermon");

  const items = existing
    ? section.items.map((item) =>
        item.id === existing.id ? { ...item, passage: normalizedPassage } : item
      )
    : [
        ...section.items,
        { id: crypto.randomUUID(), type: "sermon", passage: normalizedPassage } as SermonItem,
      ];

  const { error } = await supabase.from("sections").update({ items }).eq("id", section.id);

  if (error) {
    console.error("[lib/liturgy/sermonActions/saveSermonPassage]", error.message);
    return { success: false, error: "Unable to save the Sermon passage right now." };
  }
  return { success: true };
}
