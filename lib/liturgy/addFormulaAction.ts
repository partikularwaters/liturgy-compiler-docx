"use server";

import { supabase } from "@/lib/db/supabase";
import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import { insertSectionItem, updateSectionItem } from "@/lib/liturgy/sectionItems";
import { normalizeTypography } from "@/lib/text/typographic";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { FormulaItem, TextMark } from "@/types/liturgy";

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

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to place a Formula." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  const { data: formula, error: formulaError } = await supabase
    .from("formulas")
    .select("section_name, marks")
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

  // v2: library-level marking toolbar -- a Formula pre-marked in the library
  // (e.g. Absolution's Minister/Congregation dialogue) carries those marks
  // onto this new placed instance as a starting point, same freeze-on-
  // placement convention overrideText already follows (editing the placed
  // instance afterward never reaches back to the library row). Only makes
  // sense when the instance uses the library's own defaultText -- an
  // override supplies different text the library's marks weren't offset for.
  const newItem: FormulaItem = {
    id: crypto.randomUUID(),
    type: "formula",
    formulaId,
    overrideText: overrideText ? normalizeTypography(overrideText) : null,
    visibility,
    ...(overrideText ? {} : { marks: (formula.marks as TextMark[] | null) ?? [] }),
  };

  const { success, error: updateError } = await insertSectionItem(section.id, newItem);

  if (!success) {
    console.error("[lib/liturgy/addFormulaAction]", updateError);
    return { success: false, error: "Unable to place this Formula right now." };
  }

  return { success: true };
}

// Feature 25: edits a Formula item already placed into a Section -- Minister
// labeling and Vesper's Church Covenant span-tagging both need to mark up
// this specific instance's displayed text, and until now no edit path
// existed for FormulaItem at all (it was placed once via addFormula and
// never touched again). Mirrors updateVerbalCue/updatePrayer's shape.
export async function updateFormulaItem(
  liturgyId: string,
  sectionIndex: number,
  itemId: string,
  overrideText: string | null,
  visibility: "both" | "leader_only",
  marks: TextMark[] = [],
  trinitarianSeal: "en" | "fil" | null = null
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to update this Formula." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  const existingItem = section.items.find((item) => item.id === itemId && item.type === "formula");
  if (!existingItem || existingItem.type !== "formula") {
    return { success: false, error: "Unable to find that Formula right now." };
  }

  const { success, error } = await updateSectionItem({
    ...existingItem,
    overrideText: overrideText ? normalizeTypography(overrideText) : null,
    visibility,
    marks,
    trinitarianSeal: trinitarianSeal ?? undefined,
  });

  if (!success) {
    console.error("[lib/liturgy/addFormulaAction/updateFormulaItem]", error);
    return { success: false, error: "Unable to update this Formula right now." };
  }

  return { success: true };
}
