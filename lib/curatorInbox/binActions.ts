"use server";

import { supabase } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

async function requireCurator(): Promise<{ ok: true } | { ok: false; error: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "curator") {
    return { ok: false, error: "Only a Curator can do that." };
  }
  return { ok: true };
}

// Restoring adopts a binned item into the shared Library -- owner_id is
// already null (set by the FK's own "on delete set null" when the account
// was deleted), so unsetting is_binned is the only change needed; it now
// reads exactly like any other shared/canonical entry.
export async function restoreFromBin(table: "prayers" | "songs" | "formulas", id: string): Promise<{ success: boolean; error?: string }> {
  const check = await requireCurator();
  if (!check.ok) return { success: false, error: check.error };

  const { error } = await supabase.from(table).update({ is_binned: false, status: "draft" }).eq("id", id);
  if (error) {
    console.error("[lib/curatorInbox/binActions/restoreFromBin]", error.message);
    return { success: false, error: "Unable to restore this item right now." };
  }

  return { success: true };
}

export async function deletePermanently(table: "prayers" | "songs" | "formulas", id: string): Promise<{ success: boolean; error?: string }> {
  const check = await requireCurator();
  if (!check.ok) return { success: false, error: check.error };

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) {
    console.error("[lib/curatorInbox/binActions/deletePermanently]", error.message);
    return { success: false, error: "Unable to delete this item right now." };
  }

  return { success: true };
}
