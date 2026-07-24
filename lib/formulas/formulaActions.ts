"use server";

import { supabase } from "@/lib/db/supabase";
import { normalizeTypography } from "@/lib/text/typographic";
import { setTranslationPair } from "@/lib/liturgy/translationPairing";
import type { TextMark } from "@/types/liturgy";

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

  const { data, error } = await supabase
    .from("formulas")
    .insert({
      section_name: sectionName,
      name: normalizeTypography(name),
      default_text: normalizeTypography(defaultText),
      marks,
      translation,
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
export async function deleteFormula(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("formulas").delete().eq("id", id);

  if (error) {
    console.error("[lib/formulas/formulaActions/deleteFormula]", error.message);
    return { success: false, error: "Unable to delete this Formula right now." };
  }

  return { success: true };
}
