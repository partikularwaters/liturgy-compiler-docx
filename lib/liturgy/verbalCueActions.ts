"use server";

import { supabase } from "@/lib/db/supabase";
import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import { normalizeTypography } from "@/lib/text/typographic";
import type { VerbalCueItem } from "@/types/liturgy";

export async function addVerbalCue(
  liturgyId: string,
  sectionIndex: number,
  text: string,
  visibility: "both" | "leader_only"
): Promise<{ success: boolean; error?: string }> {
  if (!text.trim()) {
    return { success: false, error: "Verbal Cue text is required." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  const newItem: VerbalCueItem = {
    id: crypto.randomUUID(),
    type: "verbal_cue",
    text: normalizeTypography(text),
    visibility,
  };

  const { error } = await supabase
    .from("sections")
    .update({ items: [...section.items, newItem] })
    .eq("id", section.id);

  if (error) {
    console.error("[lib/liturgy/verbalCueActions/addVerbalCue]", error.message);
    return { success: false, error: "Unable to add this Verbal Cue right now." };
  }
  return { success: true };
}

export async function updateVerbalCue(
  liturgyId: string,
  sectionIndex: number,
  itemId: string,
  text: string,
  visibility: "both" | "leader_only"
): Promise<{ success: boolean; error?: string }> {
  if (!text.trim()) {
    return { success: false, error: "Verbal Cue text is required." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  const normalizedText = normalizeTypography(text);
  const items = section.items.map((item) =>
    item.id === itemId && item.type === "verbal_cue"
      ? { ...item, text: normalizedText, visibility }
      : item
  );

  const { error } = await supabase.from("sections").update({ items }).eq("id", section.id);

  if (error) {
    console.error("[lib/liturgy/verbalCueActions/updateVerbalCue]", error.message);
    return { success: false, error: "Unable to update this Verbal Cue right now." };
  }
  return { success: true };
}
