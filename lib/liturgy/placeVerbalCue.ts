import "server-only";

import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import { insertSectionItem } from "@/lib/liturgy/sectionItems";
import { normalizeTypography } from "@/lib/text/typographic";
import type { VerbalCueItem } from "@/types/liturgy";

// Extracted from verbalCueActions.ts's addVerbalCue() -- everything past
// its getCurrentUser() gate. Same reasoning as placeSelection.ts: shared by
// the human-facing Server Action (still auth-gated) and the automation's
// liturgyDefaults.ts seeding (never client-reachable). Not "use server" --
// this file has no auth check of its own, so it must never become directly
// client-invocable.
export async function placeVerbalCue(
  liturgyId: string,
  sectionIndex: number,
  text: string,
  visibility: "both" | "leader_only",
  rubric: boolean = false,
  textAlternate: string = "",
  showAlternate: boolean = false
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
    rubric,
    ...(textAlternate.trim() ? { textAlternate: normalizeTypography(textAlternate) } : {}),
    showAlternate,
  };

  const { success, error } = await insertSectionItem(section.id, newItem);

  if (!success) {
    console.error("[lib/liturgy/placeVerbalCue]", error);
    return { success: false, error: "Unable to add this Verbal Cue right now." };
  }
  return { success: true };
}
