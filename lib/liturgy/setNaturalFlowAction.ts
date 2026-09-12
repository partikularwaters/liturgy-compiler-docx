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

  // .select("id") so a zero-row match is detectable -- see
  // setSilentConfessionLanguageAction.ts's identical comment and
  // context/incidents/0002 for the real report this class of gap caused.
  const { data, error } = await supabase
    .from("sections")
    .update({ merge_selections: mergeSelections })
    .eq("liturgy_id", liturgyId)
    .eq("template_section_index", sectionIndex)
    .select("id");

  if (error) {
    console.error("[lib/liturgy/setNaturalFlowAction]", error.message);
    return { success: false, error: "Unable to update this setting right now." };
  }
  if (!data || data.length === 0) {
    console.error("[lib/liturgy/setNaturalFlowAction] no matching Section row", { liturgyId, sectionIndex });
    return { success: false, error: "Couldn't find that Section -- try reloading the page." };
  }
  return { success: true };
}
