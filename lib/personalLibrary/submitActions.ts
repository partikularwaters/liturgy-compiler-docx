"use server";

import { supabase } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Moves a Compiler's own draft into "submitted" -- the only thing that
// makes it appear in the Curator Inbox's Library Submissions tab. Gated to
// the row's own owner, not just "any Compiler" -- editing a fork you don't
// own is never allowed anywhere else in the app either.
export async function submitForReview(table: "prayers" | "songs" | "formulas", id: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to submit for review." };
  }

  const { data: existing, error: fetchError } = await supabase.from(table).select("owner_id, status").eq("id", id).single();
  if (fetchError || !existing) {
    return { success: false, error: "That entry could not be found." };
  }
  if (existing.owner_id !== currentUser.id) {
    return { success: false, error: "You can only submit your own drafts." };
  }
  if (existing.status !== "draft") {
    return { success: false, error: "Only a draft can be submitted for review." };
  }

  const { error } = await supabase.from(table).update({ status: "submitted" }).eq("id", id);
  if (error) {
    console.error("[lib/personalLibrary/submitActions/submitForReview]", error.message);
    return { success: false, error: "Unable to submit this right now." };
  }

  return { success: true };
}
