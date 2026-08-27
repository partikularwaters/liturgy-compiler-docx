import { supabase } from "@/lib/db/supabase";

// The only place that writes liturgies.status back to 'draft'. Kept in its
// own file, separate from liturgyReadinessActions.ts's markReady(), so that
// sectionItems.ts -- which calls this after every write -- never has to
// depend on getLiturgy.ts's import chain. getLiturgy.ts itself imports from
// sectionItems.ts, and markReady() needs getLiturgy(), so keeping markDraft
// here (with no dependency on either) avoids a circular import between
// sectionItems.ts and whatever module exports markReady().
//
// Idempotent: the `.eq("status", "ready")` guard makes this a no-op write
// (zero rows affected, still success) when the Liturgy is already Draft --
// callers never need to check status first. `ready_by`/`ready_at` are
// cleared rather than preserved: `liturgy_publications` is the durable
// delivery history, not the `liturgies` row itself, so there's no reason to
// keep a stale "last approved" timestamp on a Liturgy that's no longer
// approved.
export async function markDraft(liturgyId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("liturgies")
    .update({ status: "draft", ready_by: null, ready_at: null })
    .eq("id", liturgyId)
    .eq("status", "ready");

  if (error) {
    console.error("[lib/liturgy/markDraft]", error.message);
    return { success: false, error: "Unable to update this liturgy's status right now." };
  }

  return { success: true };
}
