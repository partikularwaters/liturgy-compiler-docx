"use server";

import { supabase } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Per-liturgy "merge 2+ Selections into one flowing paragraph" toggle --
// mirrors setShowPrayerGuideAction.ts's pattern exactly (update by
// liturgy_id + template_section_index). Exposed only on Righteousness of
// God, Call to Confession, and The Lord's Discourses (see
// NATURAL_FLOW_TOGGLE_SECTIONS in SectionCard.tsx) -- Assurance of Pardon's
// own unconditional merge behavior never calls this.
export async function setNaturalFlow(
  liturgyId: string,
  sectionIndex: number,
  mergeSelections: boolean
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to change this setting." };
  }

  const { error } = await supabase
    .from("sections")
    .update({ merge_selections: mergeSelections })
    .eq("liturgy_id", liturgyId)
    .eq("template_section_index", sectionIndex);

  if (error) {
    console.error("[lib/liturgy/setNaturalFlowAction]", error.message);
    return { success: false, error: "Unable to update this setting right now." };
  }
  return { success: true };
}
