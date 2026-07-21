"use server";

import { supabase } from "@/lib/db/supabase";

// v3 groundwork (2026-07-22): unrestricted for now -- every user can delete
// any liturgy. Access is meant to be gated once Supabase Auth + role-based
// access lands (v3 item 6, formulas.access_level's original reservation);
// this is the mechanism prepared ahead of that, not the final access model.
// Deletes `sections` explicitly before `liturgies` rather than assuming an
// ON DELETE CASCADE is set up -- safe either way, and doesn't depend on a
// schema detail this file can't see.
export async function deleteLiturgy(liturgyId: string): Promise<{ success: boolean; error?: string }> {
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
