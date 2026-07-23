"use server";

import { supabase } from "@/lib/db/supabase";
import { formatCitation } from "@/lib/liturgy/formatCitation";
import { normalizeCitationForTranslation } from "@/lib/bible/bookNamesTagalog";
import { normalizeTypography } from "@/lib/text/typographic";
import { saveCompanionTranslation } from "@/lib/selections/companionTranslation";
import type { TextMark } from "@/types/liturgy";

// v2 Phase A: the Scripture Text Library (scripture_selections) was
// browse-only, auto-populated exclusively by addSelectionAction.ts whenever a
// Selection is placed via the Reader. These two actions let it be managed
// directly from /library instead -- text may be blank (citation-only,
// matching SelectionItem.text's existing optionality for reference-only
// Sections), only citation is required.

export async function createScriptureSelection(
  sectionName: string,
  citation: string,
  text: string,
  translation: "fil" | "en" = "fil",
  marks: TextMark[] = []
): Promise<{ success: boolean; error?: string; companionSaved?: boolean }> {
  if (!sectionName.trim() || !citation.trim()) {
    return { success: false, error: "Section and citation are required." };
  }

  const formattedCitation = normalizeCitationForTranslation(formatCitation(citation), translation);

  const { error } = await supabase.from("scripture_selections").insert({
    section_name: sectionName,
    citation: formattedCitation,
    text: normalizeTypography(text),
    translation,
    marks,
  });

  if (error) {
    console.error("[lib/selections/scriptureSelectionActions/createScriptureSelection]", error.message);
    if (error.code === "23505") {
      return { success: false, error: "This citation already exists in this Section." };
    }
    return { success: false, error: "Unable to add this Scripture item right now." };
  }

  // v2 (BSB): silently save the other language's unmodified companion too.
  const companionSaved = await saveCompanionTranslation(sectionName, formattedCitation, translation);

  return { success: true, companionSaved };
}

export async function updateScriptureSelection(
  id: string,
  sectionName: string,
  citation: string,
  text: string,
  translation: "fil" | "en" = "fil",
  marks: TextMark[] = []
): Promise<{ success: boolean; error?: string; companionSaved?: boolean }> {
  if (!citation.trim()) {
    return { success: false, error: "Citation is required." };
  }

  const formattedCitation = normalizeCitationForTranslation(formatCitation(citation), translation);

  const { error } = await supabase
    .from("scripture_selections")
    .update({ citation: formattedCitation, text: normalizeTypography(text), marks })
    .eq("id", id);

  if (error) {
    console.error("[lib/selections/scriptureSelectionActions/updateScriptureSelection]", error.message);
    if (error.code === "23505") {
      return { success: false, error: "This citation already exists in this Section." };
    }
    return { success: false, error: "Unable to update this Scripture item right now." };
  }

  const companionSaved = await saveCompanionTranslation(sectionName, formattedCitation, translation);

  return { success: true, companionSaved };
}

// The Scripture Library had no delete path at
// all, unlike every other library type (Formula/Prayer/Song).
export async function deleteScriptureSelection(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("scripture_selections").delete().eq("id", id);

  if (error) {
    console.error("[lib/selections/scriptureSelectionActions/deleteScriptureSelection]", error.message);
    return { success: false, error: "Unable to delete this Scripture item right now." };
  }
  return { success: true };
}
