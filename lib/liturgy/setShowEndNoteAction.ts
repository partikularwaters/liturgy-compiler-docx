"use server";

import { supabase } from "@/lib/db/supabase";

// Per-liturgy toggle for the trailing
// "~ End of [Service] ~" note in the docx export (see CompiledLiturgy.showEndNote).
export async function setShowEndNote(
  liturgyId: string,
  showEndNote: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("liturgies").update({ show_end_note: showEndNote }).eq("id", liturgyId);

  if (error) {
    console.error("[lib/liturgy/setShowEndNoteAction]", error.message);
    return { success: false, error: "Unable to update this setting right now." };
  }
  return { success: true };
}
