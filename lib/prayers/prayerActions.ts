"use server";

import { supabase } from "@/lib/db/supabase";
import { normalizeTypography } from "@/lib/text/typographic";
import { setTranslationPair } from "@/lib/liturgy/translationPairing";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { TextMark } from "@/types/liturgy";

// v3 Curator/Compiler RBAC gate, added alongside the anonymous-read-only
// audit (task 8) -- these three actions had NO auth check at all until now,
// even though prayers already got an `owner_id` column and matching RLS
// policies back when Formula was locked down (20260725040000). RLS alone
// doesn't help here: every write in this app goes through the service-role
// client (lib/db/supabase.ts), which bypasses RLS entirely, so the real gate
// has to live here -- same pattern as lib/formulas/formulaActions.ts. A
// Compiler creating a brand-new Prayer starts an unpromoted proposal
// (owner_id = themself); editing/deleting a shared (owner_id null) row
// stays Curator-only. This is the DIRECT Library CRUD path -- editing an
// already-placed Prayer instead forks into the Compiler's Personal Library
// (see lib/liturgy/addPrayerAction.ts's updatePrayerItem), a separate flow.
export async function createPrayer(
  sectionName: string,
  text: string,
  kind: "corporate" | "leader" = "leader",
  marks: TextMark[] = [],
  isGuide: boolean = false,
  translation: "fil" | "en" | null = null,
  pairedId: string | null = null
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  if (!text.trim()) {
    return { success: false, error: "Prayer text is required." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to create a Prayer." };
  }

  const ownerId = currentUser.role === "curator" ? null : currentUser.id;

  const { data, error } = await supabase
    .from("prayers")
    .insert({
      section_name: sectionName,
      text: normalizeTypography(text),
      kind,
      marks,
      is_guide: isGuide,
      translation,
      owner_id: ownerId,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[lib/prayers/prayerActions/createPrayer]", error.message);
    return { success: false, error: "Unable to save this Prayer right now." };
  }

  if (pairedId) {
    await setTranslationPair("prayers", data.id, pairedId);
  }

  return { success: true, data: { id: data.id } };
}

export async function updatePrayer(
  id: string,
  sectionName: string,
  text: string,
  kind?: "corporate" | "leader",
  marks: TextMark[] = [],
  isGuide?: boolean,
  translation?: "fil" | "en" | null,
  pairedId?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!sectionName.trim() || !text.trim()) {
    return { success: false, error: "Section and text are required." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to edit a Prayer." };
  }

  const { data: existing, error: fetchError } = await supabase.from("prayers").select("owner_id").eq("id", id).single();
  if (fetchError || !existing) {
    return { success: false, error: "That Prayer could not be found." };
  }

  const canEdit = existing.owner_id === null ? currentUser.role === "curator" : existing.owner_id === currentUser.id;
  if (!canEdit) {
    return { success: false, error: "Only a Curator can edit this Prayer." };
  }

  const { error } = await supabase
    .from("prayers")
    .update({
      section_name: sectionName,
      text: normalizeTypography(text),
      marks,
      ...(kind ? { kind } : {}),
      ...(isGuide !== undefined ? { is_guide: isGuide } : {}),
      ...(translation !== undefined ? { translation } : {}),
    })
    .eq("id", id);

  if (error) {
    console.error("[lib/prayers/prayerActions/updatePrayer]", error.message);
    return { success: false, error: "Unable to update this Prayer right now." };
  }

  if (pairedId !== undefined) {
    const pairResult = await setTranslationPair("prayers", id, pairedId);
    if (!pairResult.success) return pairResult;
  }

  return { success: true };
}

// v2 Phase A follow-up: Prayer had no delete path either, the same gap
// Formula had before deleteFormula() -- covers both kind='prayer' and
// kind='guide' rows, since PrayerListRow is shared by both. No usage check
// against placed PrayerItem instances, matching the same defensive-fallback
// pattern as deleteFormula/deleteSong.
export async function deletePrayer(id: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to delete a Prayer." };
  }

  const { data: existing, error: fetchError } = await supabase.from("prayers").select("owner_id").eq("id", id).single();
  if (fetchError || !existing) {
    return { success: false, error: "That Prayer could not be found." };
  }

  const canDelete = existing.owner_id === null ? currentUser.role === "curator" : existing.owner_id === currentUser.id;
  if (!canDelete) {
    return { success: false, error: "Only a Curator can delete this Prayer." };
  }

  const { error } = await supabase.from("prayers").delete().eq("id", id);

  if (error) {
    console.error("[lib/prayers/prayerActions/deletePrayer]", error.message);
    return { success: false, error: "Unable to delete this Prayer right now." };
  }

  return { success: true };
}
