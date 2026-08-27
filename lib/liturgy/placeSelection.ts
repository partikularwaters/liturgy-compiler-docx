import "server-only";

import { supabase } from "@/lib/db/supabase";
import { isDuplicateCitation } from "@/lib/liturgy/dedup";
import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import { insertSectionItem } from "@/lib/liturgy/sectionItems";
import { formatCitation } from "@/lib/liturgy/formatCitation";
import { normalizeCitationForTranslation } from "@/lib/bible/bookNamesTagalog";
import { normalizeTypography } from "@/lib/text/typographic";
import { saveCompanionTranslation } from "@/lib/selections/companionTranslation";
import type { SelectionItem, TextMark } from "@/types/liturgy";

// Feature 22: these Sections are long, whole-passage readings meant to be
// read aloud in full rather than reproduced -- redesign-plan-v1.1.md §M
// approves storing only the citation for them (SelectionItem.text may be
// blank), reusing Selection's existing citation/dedup/hover-preview
// machinery instead of a parallel item type for what's really the same
// content, just displayed differently.
export const REFERENCE_ONLY_SECTIONS = [
  "The Lord’s Discourses",
  "Words of Institution",
  "Closing of the Table",
  "The Great Commission",
];

// Extracted from addSelectionAction.ts's addSelection() -- everything past
// its getCurrentUser() gate. This is the shared placement logic both the
// human-facing Server Action (still auth-gated) and the automation's
// ensureWeek()/liturgyDefaults.ts auto-assignment (never client-reachable,
// authorized by a different mechanism entirely) call. Not "use server":
// this file must never become directly client-invocable, since it has no
// auth check of its own -- the caller is responsible for authorization.
export async function placeSelection(
  liturgyId: string,
  sectionIndex: number,
  citation: string,
  text: string,
  amenExpected: boolean = false,
  marks: TextMark[] = [],
  trinitarianSeal: "en" | "fil" | null = null,
  translation: "fil" | "en" = "fil"
): Promise<{ success: boolean; error?: string; companionSaved?: boolean }> {
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

  const formattedCitation = normalizeCitationForTranslation(formatCitation(citation), translation);

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
    translation,
    ...(trinitarianSeal ? { trinitarianSeal } : {}),
  };

  const { success, error: updateError } = await insertSectionItem(section.id, newItem);

  if (!success) {
    console.error("[lib/liturgy/placeSelection]", updateError);
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
      { section_name: section.sectionName, citation: formattedCitation, text: newItem.text, translation, marks },
      { onConflict: "section_name,citation", ignoreDuplicates: true }
    );
  if (libraryError) {
    console.error("[lib/liturgy/placeSelection] scripture_selections upsert", libraryError.message);
  }

  // v2 (BSB): silently save the other language's unmodified companion text
  // too, if it doesn't already exist for this passage/Section.
  const companionSaved = await saveCompanionTranslation(section.sectionName, formattedCitation, translation);

  return { success: true, companionSaved };
}
