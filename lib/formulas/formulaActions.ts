"use server";

import { supabase } from "@/lib/db/supabase";
import { normalizeTypography } from "@/lib/text/typographic";
import { setTranslationPair } from "@/lib/liturgy/translationPairing";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { TextMark } from "@/types/liturgy";

// v3 Curator/Compiler RBAC (2026-07-25): Formula is the one Library type
// locked down completely -- "Formulas should never be edited except by the
// Curator" (Madrid's own words). This uses the service-role client (see
// lib/db/supabase.ts), which bypasses RLS entirely, so the real enforcement
// has to happen here, not just in the database policies -- those are
// defense-in-depth against someone bypassing the app, not the primary gate.
//
// A Compiler CAN still create a brand-new Formula (owner_id = themself) --
// that's a *proposal*, not an edit of anything curated, e.g. applying a
// Creed variant nobody has curated yet. It only becomes part of the shared,
// canonical set (owner_id null) once a Curator promotes it -- see the
// promotion workflow (task 5).
export async function createFormula(
  sectionName: string,
  name: string,
  defaultText: string,
  marks: TextMark[] = [],
  translation: "fil" | "en" | null = null,
  pairedId: string | null = null
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  if (!sectionName.trim() || !name.trim() || !defaultText.trim()) {
    return { success: false, error: "Section, name, and default text are required." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to create a Formula." };
  }

  // A Curator creates directly into the shared set; a Compiler's new
  // Formula starts as their own unpromoted proposal.
  const ownerId = currentUser.role === "curator" ? null : currentUser.id;

  const { data, error } = await supabase
    .from("formulas")
    .insert({
      section_name: sectionName,
      name: normalizeTypography(name),
      default_text: normalizeTypography(defaultText),
      marks,
      translation,
      owner_id: ownerId,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[lib/formulas/formulaActions/createFormula]", error.message);
    if (error.code === "23505") {
      return { success: false, error: "A Formula with this name already exists in this Section." };
    }
    return { success: false, error: "Unable to create this Formula right now." };
  }

  if (pairedId) {
    await setTranslationPair("formulas", data.id, pairedId);
  }

  return { success: true, data: { id: data.id } };
}

export async function updateFormula(
  id: string,
  sectionName: string,
  name: string,
  defaultText: string,
  marks: TextMark[] = [],
  translation?: "fil" | "en" | null,
  pairedId?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!sectionName.trim() || !name.trim() || !defaultText.trim()) {
    return { success: false, error: "Section, name, and default text are required." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to edit a Formula." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("formulas")
    .select("owner_id")
    .eq("id", id)
    .single();
  if (fetchError || !existing) {
    return { success: false, error: "That Formula could not be found." };
  }

  // Shared (owner_id null) rows are Curator-only, full stop -- a Compiler
  // can only edit a proposal they own themselves.
  const canEdit =
    existing.owner_id === null ? currentUser.role === "curator" : existing.owner_id === currentUser.id;
  if (!canEdit) {
    return { success: false, error: "Only a Curator can edit this Formula." };
  }

  const { error } = await supabase
    .from("formulas")
    .update({
      section_name: sectionName,
      name: normalizeTypography(name),
      default_text: normalizeTypography(defaultText),
      marks,
      ...(translation !== undefined ? { translation } : {}),
    })
    .eq("id", id);

  if (error) {
    console.error("[lib/formulas/formulaActions/updateFormula]", error.message);
    if (error.code === "23505") {
      return { success: false, error: "A Formula with this name already exists in this Section." };
    }
    return { success: false, error: "Unable to update this Formula right now." };
  }

  if (pairedId !== undefined) {
    const pairResult = await setTranslationPair("formulas", id, pairedId);
    if (!pairResult.success) return pairResult;
  }

  return { success: true };
}

// v2 Phase A: the one item type with no delete path at all until now (every
// placed item type has removeItemAction.ts; this deletes the library entry
// itself). No usage check against placed FormulaItem instances -- deleting a
// Formula still in use leaves resolveItemText.ts's existing
// "(Formula not found)" fallback to handle it gracefully, the same defensive
// lookup already relied on for a dangling formulaId/prayerId/songId today.
//
// v3: same Curator-only-for-shared-rows gate as updateFormula above.
export async function deleteFormula(id: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to delete a Formula." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("formulas")
    .select("owner_id")
    .eq("id", id)
    .single();
  if (fetchError || !existing) {
    return { success: false, error: "That Formula could not be found." };
  }

  const canDelete =
    existing.owner_id === null ? currentUser.role === "curator" : existing.owner_id === currentUser.id;
  if (!canDelete) {
    return { success: false, error: "Only a Curator can delete this Formula." };
  }

  const { error } = await supabase.from("formulas").delete().eq("id", id);

  if (error) {
    console.error("[lib/formulas/formulaActions/deleteFormula]", error.message);
    return { success: false, error: "Unable to delete this Formula right now." };
  }

  return { success: true };
}
