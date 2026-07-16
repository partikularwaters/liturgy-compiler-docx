"use server";

import { supabase } from "@/lib/db/supabase";
import { normalizeTypography } from "@/lib/text/typographic";

export async function createFormula(
  sectionName: string,
  name: string,
  defaultText: string
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

  return { success: true, data: { id: data.id } };
}

export async function updateFormula(
  id: string,
  sectionName: string,
  name: string,
  defaultText: string
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
    })
    .eq("id", id);

  if (error) {
    console.error("[lib/formulas/formulaActions/updateFormula]", error.message);
    if (error.code === "23505") {
      return { success: false, error: "A Formula with this name already exists in this Section." };
    }
    return { success: false, error: "Unable to update this Formula right now." };
  }

  return { success: true };
}
