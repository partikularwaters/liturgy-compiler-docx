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

  // .select("id") so a zero-row match is detectable -- Supabase/PostgREST
  // reports success (no `error`) even when the filter matches nothing, so
  // without this a stale/misaligned sectionIndex silently writes to no row
  // at all while the caller sees {success: true}. See context/incidents/
  // 0002 for the real report this closes.
  const { data, error } = await supabase
    .from("sections")
    .update({ silent_confession_language: language })
    .eq("liturgy_id", liturgyId)
    .eq("template_section_index", sectionIndex)
    .select("id");

  if (error) {
    console.error("[lib/liturgy/setSilentConfessionLanguageAction]", error.message);
    return { success: false, error: "Unable to update this setting right now." };
  }
  if (!data || data.length === 0) {
    console.error("[lib/liturgy/setSilentConfessionLanguageAction] no matching Section row", { liturgyId, sectionIndex });
    return { success: false, error: "Couldn't find that Section -- try reloading the page." };
  }
  return { success: true };
}
