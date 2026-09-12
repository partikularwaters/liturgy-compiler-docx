"use server";

import { supabase } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

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
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to change this Prayer Guide setting." };
  }

  // .select("id") so a zero-row match is detectable -- see
  // setSilentConfessionLanguageAction.ts's identical comment and
  // context/incidents/0002 for the real report this class of gap caused.
  const { data, error } = await supabase
    .from("sections")
    .update({ show_prayer_guide: showPrayerGuide })
    .eq("liturgy_id", liturgyId)
    .eq("template_section_index", sectionIndex)
    .select("id");

  if (error) {
    console.error("[lib/liturgy/setShowPrayerGuideAction]", error.message);
    return { success: false, error: "Unable to update this setting right now." };
  }
  if (!data || data.length === 0) {
    console.error("[lib/liturgy/setShowPrayerGuideAction] no matching Section row", { liturgyId, sectionIndex });
    return { success: false, error: "Couldn't find that Section -- try reloading the page." };
  }
  return { success: true };
}
