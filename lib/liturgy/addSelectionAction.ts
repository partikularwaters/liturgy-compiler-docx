"use server";

import { supabase } from "@/lib/db/supabase";
import { isDuplicateCitation } from "@/lib/liturgy/dedup";
import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import { formatCitation } from "@/lib/liturgy/formatCitation";
import { normalizeTypography } from "@/lib/text/typographic";
import type { SelectionItem, TextMark } from "@/types/liturgy";

// Feature 22: these Sections are long, whole-passage readings meant to be
// read aloud in full rather than reproduced -- redesign-plan-v1.1.md §M
// approves storing only the citation for them (SelectionItem.text may be
// blank), reusing Selection's existing citation/dedup/hover-preview
// machinery instead of a parallel item type for what's really the same
// content, just displayed differently.
const REFERENCE_ONLY_SECTIONS = ["The Lord's Discourses", "Words of Institution", "Closing of the Table"];

export async function addSelection(
  liturgyId: string,
  sectionIndex: number,
  citation: string,
  text: string,
  amenExpected: boolean = false,
  marks: TextMark[] = [],
  trinitarianSeal: "en" | "fil" | null = null
): Promise<{ success: boolean; error?: string }> {
  if (!citation.trim()) {
    return { success: false, error: "Citation is required." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  if (!text.trim() && !REFERENCE_ONLY_SECTIONS.includes(section.sectionName)) {
    return { success: false, error: "Citation and text are required." };
  }

  const formattedCitation = formatCitation(citation);

  if (isDuplicateCitation(section.items, formattedCitation)) {
    return { success: false, error: "This citation is already saved to this Section." };
  }

  const newItem: SelectionItem = {
    id: crypto.randomUUID(),
    type: "selection",
    text: normalizeTypography(text),
    citation: formattedCitation,
    amenExpected,
    marks,
    ...(trinitarianSeal ? { trinitarianSeal } : {}),
  };

  const { error: updateError } = await supabase
    .from("sections")
    .update({ items: [...section.items, newItem] })
    .eq("id", section.id);

  if (updateError) {
    console.error("[lib/liturgy/addSelectionAction]", updateError.message);
    return { success: false, error: "Unable to save this Scripture item right now." };
  }

  // Feature 20: auto-save into the Scripture Text Library, independent of
  // whether this liturgy is ever saved. Best-effort -- the Selection is
  // already placed in the Section either way, so a library-cache failure
  // here shouldn't fail the whole action. on-conflict-do-nothing via the
  // unique(section_name, citation) constraint handles reuse silently.
  const { error: libraryError } = await supabase
    .from("scripture_selections")
    .upsert(
      { section_name: section.sectionName, citation: formattedCitation, text: newItem.text },
      { onConflict: "section_name,citation", ignoreDuplicates: true }
    );
  if (libraryError) {
    console.error("[lib/liturgy/addSelectionAction] scripture_selections upsert", libraryError.message);
  }

  return { success: true };
}

// Feature-request (2026-07-18): edits a Selection item already placed into a
// Section -- until now Selection was the one item type with no edit path at
// all once saved (Formula/Prayer/Verbal Cue/Sermon all gained one earlier),
// which was the actual root cause behind "I can't apply Small Caps after
// using Congregation" -- there was no way back into a saved Selection's
// marking toolbar. Mirrors updateFormulaItem's shape. Re-upserts the
// scripture_selections library row too, same as the initial add, so a text
// edit here doesn't leave the library cache stale.
export async function updateSelectionItem(
  liturgyId: string,
  sectionIndex: number,
  itemId: string,
  citation: string,
  text: string,
  amenExpected: boolean,
  marks: TextMark[],
  trinitarianSeal: "en" | "fil" | null = null
): Promise<{ success: boolean; error?: string }> {
  if (!citation.trim()) {
    return { success: false, error: "Citation is required." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  if (!text.trim() && !REFERENCE_ONLY_SECTIONS.includes(section.sectionName)) {
    return { success: false, error: "Citation and text are required." };
  }

  const normalizedText = normalizeTypography(text);
  const formattedCitation = formatCitation(citation);

  const items = section.items.map((item) =>
    item.id === itemId && item.type === "selection"
      ? {
          ...item,
          citation: formattedCitation,
          text: normalizedText,
          amenExpected,
          marks,
          trinitarianSeal: trinitarianSeal ?? undefined,
        }
      : item
  );

  const { error } = await supabase.from("sections").update({ items }).eq("id", section.id);

  if (error) {
    console.error("[lib/liturgy/addSelectionAction/updateSelectionItem]", error.message);
    return { success: false, error: "Unable to update this Scripture item right now." };
  }

  const { error: libraryError } = await supabase
    .from("scripture_selections")
    .upsert(
      { section_name: section.sectionName, citation: formattedCitation, text: normalizedText },
      { onConflict: "section_name,citation", ignoreDuplicates: true }
    );
  if (libraryError) {
    console.error("[lib/liturgy/addSelectionAction/updateSelectionItem] scripture_selections upsert", libraryError.message);
  }

  return { success: true };
}
