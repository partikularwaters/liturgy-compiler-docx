"use server";

import { supabase } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getLiturgy } from "@/lib/liturgy/getLiturgy";
import { computeProgress } from "@/lib/liturgy/readiness";
import { markDraft } from "@/lib/liturgy/markDraft";

// Re-exported so callers only need this one file for both halves of the
// readiness lifecycle -- markDraft's own implementation lives in
// markDraft.ts to avoid a circular import (see that file's comment).
export { markDraft };

// The only path that transitions a Liturgy to 'ready'. Always re-validates
// completion server-side via computeProgress() -- never trusts a client's
// cached progress bar, since another edit could have changed the answer
// since that bar was last rendered.
export async function markReady(liturgyId: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to mark this liturgy ready for publication." };
  }

  const liturgy = await getLiturgy(liturgyId);
  if (!liturgy) {
    return { success: false, error: "Unable to find that liturgy right now." };
  }

  const progress = computeProgress(liturgy);
  if (progress.missing.length > 0) {
    return { success: false, error: `Still missing: ${progress.missing.join(", ")}.` };
  }

  const { error } = await supabase
    .from("liturgies")
    .update({ status: "ready", ready_by: currentUser.id, ready_at: new Date().toISOString() })
    .eq("id", liturgyId);

  if (error) {
    console.error("[lib/liturgy/liturgyReadinessActions/markReady]", error.message);
    return { success: false, error: "Unable to mark this liturgy ready right now." };
  }

  return { success: true };
}
