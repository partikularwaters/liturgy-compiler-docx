"use server";

import { supabase } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Per-liturgy toggle for the trailing
// "~ End of [Service] ~" note in the docx export (see CompiledLiturgy.showEndNote).
export async function setShowEndNote(
  liturgyId: string,
  showEndNote: boolean
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to change this setting." };
  }

  const { error } = await supabase.from("liturgies").update({ show_end_note: showEndNote }).eq("id", liturgyId);

  if (error) {
    console.error("[lib/liturgy/setShowEndNoteAction]", error.message);
    return { success: false, error: "Unable to update this setting right now." };
  }
  return { success: true };
}
