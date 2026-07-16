"use server";

import { supabase } from "@/lib/db/supabase";
import { isDuplicateCitation } from "@/lib/liturgy/dedup";
import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import { normalizeTypography } from "@/lib/text/typographic";
import type { SelectionItem } from "@/types/liturgy";

export async function addSelection(
  liturgyId: string,
  sectionIndex: number,
  citation: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  if (!citation.trim() || !text.trim()) {
    return { success: false, error: "Citation and text are required." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  if (isDuplicateCitation(section.items, citation)) {
    return { success: false, error: "This citation is already saved to this Section." };
  }

  const newItem: SelectionItem = {
    id: crypto.randomUUID(),
    type: "selection",
    text: normalizeTypography(text),
    citation,
  };

  const { error: updateError } = await supabase
    .from("sections")
    .update({ items: [...section.items, newItem] })
    .eq("id", section.id);

  if (updateError) {
    console.error("[lib/liturgy/addSelectionAction]", updateError.message);
    return { success: false, error: "Unable to save this Selection right now." };
  }

  // Feature 20: auto-save into the Scripture Text Library, independent of
  // whether this liturgy is ever saved. Best-effort -- the Selection is
  // already placed in the Section either way, so a library-cache failure
  // here shouldn't fail the whole action. on-conflict-do-nothing via the
  // unique(section_name, citation) constraint handles reuse silently.
  const { error: libraryError } = await supabase
    .from("scripture_selections")
    .upsert(
      { section_name: section.sectionName, citation, text: newItem.text },
      { onConflict: "section_name,citation", ignoreDuplicates: true }
    );
  if (libraryError) {
    console.error("[lib/liturgy/addSelectionAction] scripture_selections upsert", libraryError.message);
  }

  return { success: true };
}
