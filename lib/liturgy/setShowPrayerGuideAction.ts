"use server";

import { supabase } from "@/lib/db/supabase";

// Per-liturgy "add this Prayer Guide to the
// Leader's Guide" toggle -- mirrors setColumnBreakAction.ts's pattern
// exactly (update by liturgy_id + template_section_index, not a fetched row
// id, matching every other per-Section instance-level action in this file's
// siblings).
export async function setShowPrayerGuide(
  liturgyId: string,
  sectionIndex: number,
  showPrayerGuide: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("sections")
    .update({ show_prayer_guide: showPrayerGuide })
    .eq("liturgy_id", liturgyId)
    .eq("template_section_index", sectionIndex);

  if (error) {
    console.error("[lib/liturgy/setShowPrayerGuideAction]", error.message);
    return { success: false, error: "Unable to update this setting right now." };
  }
  return { success: true };
}
