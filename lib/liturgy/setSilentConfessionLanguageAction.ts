"use server";

import { supabase } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Per-liturgy "which language is the Silent Confession rubric in" choice --
// mirrors setShowPrayerGuideAction.ts's pattern exactly (update by
// liturgy_id + template_section_index, not a fetched row id). English
// carries equal authority to Tagalog, so this is a real stored choice, not
// a client-side display toggle -- the Web View and DOCX export both just
// render whatever is stored here.
export async function setSilentConfessionLanguage(
  liturgyId: string,
  sectionIndex: number,
  language: "fil" | "en"
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to change this rubric's language." };
  }

  const { error } = await supabase
    .from("sections")
    .update({ silent_confession_language: language })
    .eq("liturgy_id", liturgyId)
    .eq("template_section_index", sectionIndex);

  if (error) {
    console.error("[lib/liturgy/setSilentConfessionLanguageAction]", error.message);
    return { success: false, error: "Unable to update this setting right now." };
  }
  return { success: true };
}
