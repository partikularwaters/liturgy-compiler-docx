"use server";

import { supabase } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getCurrentUserName } from "@/lib/auth/getCurrentUserName";

// Deletion is never gated behind approval -- any signed-in Compiler or
// Curator can delete a liturgy immediately, same as before. What changed is
// accountability: the delete and its permanent audit record
// (liturgy_deletions) now happen atomically in one Postgres function, and a
// Compiler must have typed their own name back exactly (GitHub's
// type-the-repo-name pattern) before this is ever called -- verified here,
// server-side, against the account's real name, not trusted from the
// client. A Curator's confirm has no typing gate (see
// ConfirmDeleteLiturgyDialog.tsx) since they're already the trust boundary
// this record exists to inform; `typedConfirmation` is simply omitted for
// that path.
export async function deleteLiturgy(
  liturgyId: string,
  typedConfirmation?: string
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to delete a liturgy." };
  }

  const currentUserName = await getCurrentUserName();
  if (!currentUserName) {
    return { success: false, error: "Unable to confirm your account name right now." };
  }

  if (currentUser.role === "compiler" && typedConfirmation !== currentUserName) {
    return { success: false, error: "Please type your name exactly as shown to confirm." };
  }

  const { error } = await supabase.rpc("delete_liturgy_with_log", {
    p_liturgy_id: liturgyId,
    p_deleted_by: currentUser.id,
    p_deleted_by_name: currentUserName,
    p_deleted_role: currentUser.role,
  });

  if (error) {
    console.error("[lib/liturgy/deleteLiturgyAction]", error.message);
    return { success: false, error: "Unable to delete this liturgy right now." };
  }

  return { success: true };
}
