"use server";

import { supabase } from "@/lib/db/supabase";
import { isDuplicateCitation } from "@/lib/liturgy/dedup";
import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import { formatCitation } from "@/lib/liturgy/formatCitation";
import { normalizeCitationForTranslation } from "@/lib/bible/bookNamesTagalog";
import { normalizeTypography } from "@/lib/text/typographic";
import { saveCompanionTranslation } from "@/lib/selections/companionTranslation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
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
  trinitarianSeal: "en" | "fil" | null = null,
  translation: "fil" | "en" = "fil"
): Promise<{ success: boolean; error?: string; companionSaved?: boolean }> {
  if (!citation.trim()) {
    return { success: false, error: "Citation is required." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to add this Scripture item." };
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
      { section_name: section.sectionName, citation: formattedCitation, text: newItem.text, translation, marks },
      { onConflict: "section_name,citation", ignoreDuplicates: true }
    );
  if (libraryError) {
    console.error("[lib/liturgy/addSelectionAction] scripture_selections upsert", libraryError.message);
  }

  // v2 (BSB): silently save the other language's unmodified companion text
  // too, if it doesn't already exist for this passage/Section.
  const companionSaved = await saveCompanionTranslation(section.sectionName, formattedCitation, translation);

  return { success: true, companionSaved };
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
