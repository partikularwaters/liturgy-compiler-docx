"use server";

import { supabase } from "@/lib/db/supabase";
import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import { updateSectionItem } from "@/lib/liturgy/sectionItems";
import { formatCitation } from "@/lib/liturgy/formatCitation";
import { normalizeCitationForTranslation } from "@/lib/bible/bookNamesTagalog";
import { normalizeTypography } from "@/lib/text/typographic";
import { saveCompanionTranslation } from "@/lib/selections/companionTranslation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { placeSelection, REFERENCE_ONLY_SECTIONS } from "@/lib/liturgy/placeSelection";
import type { TextMark } from "@/types/liturgy";

export async function addSelection(
  liturgyId: string,
  sectionIndex: number,
  citation: string,
  text: string,
  amenExpected: boolean = false,
  marks: TextMark[] = [],
  trinitarianSeal: "en" | "fil" | null = null,
  translation: "fil" | "en" = "fil"
): Promise<{ success: boolean; error?: string; companionSaved?: boolean }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to add this Scripture item." };
  }

  return placeSelection(liturgyId, sectionIndex, citation, text, amenExpected, marks, trinitarianSeal, translation);
}

// Edits a Selection item already placed into a
// Section -- Selection is the one item type whose marking toolbar needs to
// stay reachable after the initial save, same as Formula/Prayer/Verbal
// Cue/Sermon. Mirrors updateFormulaItem's shape. Re-upserts the
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
): Promise<{ success: boolean; error?: string; companionSaved?: boolean }> {
  if (!citation.trim()) {
    return { success: false, error: "Citation is required." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to update this Scripture item." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  if (!text.trim() && !REFERENCE_ONLY_SECTIONS.includes(section.sectionName)) {
    return { success: false, error: "Citation and text are required." };
  }

  const normalizedText = normalizeTypography(text);
  // Translation never changes on edit -- carried forward from the existing
  // item (absent means "fil", same default the type itself documents).
  const existingItem = section.items.find((item) => item.id === itemId);
  const translation: "fil" | "en" =
    existingItem && existingItem.type === "selection" ? (existingItem.translation ?? "fil") : "fil";
  const formattedCitation = normalizeCitationForTranslation(formatCitation(citation), translation);

  if (!existingItem || existingItem.type !== "selection") {
    return { success: false, error: "Unable to find that Scripture item right now." };
  }

  const { success, error } = await updateSectionItem({
    ...existingItem,
    citation: formattedCitation,
    text: normalizedText,
    amenExpected,
    marks,
    trinitarianSeal: trinitarianSeal ?? undefined,
  });

  if (!success) {
    console.error("[lib/liturgy/addSelectionAction/updateSelectionItem]", error);
    return { success: false, error: "Unable to update this Scripture item right now." };
  }

  // task 10: this MUST actually overwrite on conflict (ignoreDuplicates was
  // a silent no-op for every citation that already existed in the Library --
  // which is the common case, since you're usually editing something
  // already placed) and MUST include marks -- the previous version omitted
  // marks entirely, so even a brand-new citation lost its marks on the way
  // into the Library. Unlike Prayer/Song, Scripture has no owner_id/fork
  // model (its FIL/ENG pairing is keyed by citation itself, per the v3 RBAC
  // decisions), so writing straight into the shared row here is correct,
  // not a lockdown violation.
  const { error: libraryError } = await supabase
    .from("scripture_selections")
    .upsert(
      { section_name: section.sectionName, citation: formattedCitation, text: normalizedText, translation, marks },
      { onConflict: "section_name,citation" }
    );
  if (libraryError) {
    console.error("[lib/liturgy/addSelectionAction/updateSelectionItem] scripture_selections upsert", libraryError.message);
  }

  const companionSaved = await saveCompanionTranslation(section.sectionName, formattedCitation, translation);

  return { success: true, companionSaved };
}
