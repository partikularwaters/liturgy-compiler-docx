"use server";

import { supabase } from "@/lib/db/supabase";
import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import { normalizeTypography } from "@/lib/text/typographic";
import type { FormulaItem } from "@/types/liturgy";

export async function addFormula(
  liturgyId: string,
  sectionIndex: number,
  formulaId: string,
  overrideText: string | null,
  visibility: "both" | "leader_only"
): Promise<{ success: boolean; error?: string }> {
  if (!formulaId.trim()) {
    return { success: false, error: "A Formula must be selected." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  const { data: formula, error: formulaError } = await supabase
    .from("formulas")
    .select("section_name")
    .eq("id", formulaId)
    .single();

  if (formulaError || !formula) {
    console.error("[lib/liturgy/addFormulaAction]", formulaError?.message);
    return { success: false, error: "That Formula could not be found." };
  }

  if (formula.section_name !== section.sectionName) {
    console.error(
      "[lib/liturgy/addFormulaAction] section mismatch:",
      formula.section_name,
      "!=",
      section.sectionName
    );
    return { success: false, error: "That Formula does not belong to this Section." };
  }

  const newItem: FormulaItem = {
    id: crypto.randomUUID(),
    type: "formula",
    formulaId,
    overrideText: overrideText ? normalizeTypography(overrideText) : null,
    visibility,
  };

  const { error: updateError } = await supabase
    .from("sections")
    .update({ items: [...section.items, newItem] })
    .eq("id", section.id);

  if (updateError) {
    console.error("[lib/liturgy/addFormulaAction]", updateError.message);
    return { success: false, error: "Unable to place this Formula right now." };
  }

  return { success: true };
}
