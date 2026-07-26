"use server";

import { supabase } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Every action here is Curator-only, checked explicitly (not just relied on
// via RLS) since the service-role client bypasses RLS entirely -- this
// function's own getCurrentUser() check IS the enforcement layer, same
// pattern as lib/formulas/formulaActions.ts.
async function requireCurator(): Promise<{ ok: true } | { ok: false; error: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "curator") {
    return { ok: false, error: "Only a Curator can do that." };
  }
  return { ok: true };
}

export async function grantRole(userId: string, role: "curator" | "compiler"): Promise<{ success: boolean; error?: string }> {
  const check = await requireCurator();
  if (!check.ok) return { success: false, error: check.error };

  const { error } = await supabase.from("user_roles").update({ role }).eq("user_id", userId).eq("role", "pending");

  if (error) {
    console.error("[lib/curatorInbox/accountRequestActions/grantRole]", error.message);
    return { success: false, error: "Unable to grant that role right now." };
  }

  return { success: true };
}

// Decision #1 (progress-tracker.md): rejecting a pending Account Request
// deletes the auth account outright, not just a status flag -- a pending
// account owns nothing yet, so there's no data-loss risk, and it avoids
// leaving someone with valid login credentials stuck in permanent limbo.
export async function rejectAccountRequest(userId: string): Promise<{ success: boolean; error?: string }> {
  const check = await requireCurator();
  if (!check.ok) return { success: false, error: check.error };

  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteUserError) {
    console.error("[lib/curatorInbox/accountRequestActions/rejectAccountRequest]", deleteUserError.message);
    return { success: false, error: "Unable to reject that request right now." };
  }

  // user_roles' own FK is "on delete cascade" (20260725030000_user_roles.sql)
  // so deleting the auth.users row already removed this row too -- no
  // separate delete needed here.

  return { success: true };
}

// Deleting an ACTIVE (already-approved) account -- unlike rejecting a
// pending request, this person may own real Library drafts/forks. Every
// owned row must be flagged is_binned=true BEFORE the auth user is deleted,
// because owner_id's own FK is "on delete set null" -- if is_binned weren't
// set first, the orphan would land at owner_id=null with no way to tell it
// apart from a real shared/canonical entry (the whole reason the Bin design
// exists -- see 20260726010000's migration comment).
export async function deleteAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  const check = await requireCurator();
  if (!check.ok) return { success: false, error: check.error };

  for (const table of ["formulas", "prayers", "songs"] as const) {
    const { error: binError } = await supabase.from(table).update({ is_binned: true }).eq("owner_id", userId);
    if (binError) {
      console.error("[lib/curatorInbox/accountRequestActions/deleteAccount]", binError.message);
      return { success: false, error: "Unable to bin this account's Library items right now." };
    }
  }

  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteUserError) {
    console.error("[lib/curatorInbox/accountRequestActions/deleteAccount]", deleteUserError.message);
    return { success: false, error: "Library items were binned, but the account itself could not be deleted." };
  }

  return { success: true };
}
