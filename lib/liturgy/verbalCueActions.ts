"use server";

import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import { updateSectionItem } from "@/lib/liturgy/sectionItems";
import { normalizeTypography } from "@/lib/text/typographic";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { placeVerbalCue } from "@/lib/liturgy/placeVerbalCue";

export async function addVerbalCue(
  liturgyId: string,
  sectionIndex: number,
  text: string,
  visibility: "both" | "leader_only",
  rubric: boolean = false,
  textAlternate: string = "",
  showAlternate: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to add a Verbal Cue." };
  }

  return placeVerbalCue(liturgyId, sectionIndex, text, visibility, rubric, textAlternate, showAlternate);
}

export async function updateVerbalCue(
  liturgyId: string,
  sectionIndex: number,
  itemId: string,
  text: string,
  visibility: "both" | "leader_only",
  rubric: boolean = false,
  textAlternate: string = "",
  showAlternate: boolean = false
): Promise<{ success: boolean; error?: string }> {
  if (!text.trim()) {
    return { success: false, error: "Verbal Cue text is required." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to update a Verbal Cue." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  const normalizedText = normalizeTypography(text);
  const normalizedAlternate = textAlternate.trim() ? normalizeTypography(textAlternate) : undefined;
  const existingItem = section.items.find((item) => item.id === itemId && item.type === "verbal_cue");
  if (!existingItem || existingItem.type !== "verbal_cue") {
    return { success: false, error: "Unable to find that Verbal Cue right now." };
  }

  const { success, error } = await updateSectionItem({
    ...existingItem,
    text: normalizedText,
    visibility,
    rubric,
    textAlternate: normalizedAlternate,
    showAlternate,
  });

  if (!success) {
    console.error("[lib/liturgy/verbalCueActions/updateVerbalCue]", error);
    return { success: false, error: "Unable to update this Verbal Cue right now." };
  }
  return { success: true };
}
