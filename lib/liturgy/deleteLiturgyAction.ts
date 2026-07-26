"use server";

import { supabase } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Deletes `sections` explicitly before `liturgies` rather than assuming an
// ON DELETE CASCADE is set up -- safe either way, and doesn't depend on a
// schema detail this file can't see.
export async function deleteLiturgy(liturgyId: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to delete a liturgy." };
  }

  const { error: sectionsError } = await supabase.from("sections").delete().eq("liturgy_id", liturgyId);
  if (sectionsError) {
    console.error("[lib/liturgy/deleteLiturgyAction]", sectionsError.message);
    return { success: false, error: "Unable to delete this liturgy right now." };
  }

  const { error: liturgyError } = await supabase.from("liturgies").delete().eq("id", liturgyId);
  if (liturgyError) {
    console.error("[lib/liturgy/deleteLiturgyAction]", liturgyError.message);
    return { success: false, error: "Unable to delete this liturgy right now." };
  }

  return { success: true };
}
