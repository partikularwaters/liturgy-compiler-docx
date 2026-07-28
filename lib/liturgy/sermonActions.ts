"use server";

import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import { insertSectionItem, updateSectionItem } from "@/lib/liturgy/sectionItems";
import { normalizeTypography } from "@/lib/text/typographic";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
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

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to save the Sermon passage." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  if (section.sectionName !== "Sermon") {
    return { success: false, error: "Sermon can only be added to the Sermon Section." };
  }

  const normalizedPassage = normalizeTypography(passage);
  const existing = section.items.find((item): item is SermonItem => item.type === "sermon");

  const { success, error } = existing
    ? await updateSectionItem({ ...existing, passage: normalizedPassage })
    : await insertSectionItem(section.id, {
        id: crypto.randomUUID(),
        type: "sermon",
        passage: normalizedPassage,
      });

  if (!success) {
    console.error("[lib/liturgy/sermonActions/saveSermonPassage]", error);
    return { success: false, error: "Unable to save the Sermon passage right now." };
  }
  return { success: true };
}
