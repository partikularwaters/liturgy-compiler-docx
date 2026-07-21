"use server";

import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import { addSelection, updateSelectionItem } from "@/lib/liturgy/addSelectionAction";

// Feature-request (2026-07-21): lets the Compiler pick a different reading
// than vesperTableRotation.ts's automated pick, from that Section's own
// fixed list (see VesperReadingPanel.tsx) -- these three Sections
// (VESPER_TABLE_SECTIONS) only ever carry a single Selection at a time, so
// "choose a reading" means replace that one Selection's citation, not add a
// second item alongside it. Reuses addSelection/updateSelectionItem as-is
// (dedup, typography, library upsert are all already correct there) rather
// than duplicating that logic here.
export async function chooseVesperReading(
  liturgyId: string,
  sectionIndex: number,
  citation: string
): Promise<{ success: boolean; error?: string }> {
  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  const existing = section.items.find((item) => item.type === "selection");

  const result = existing
    ? await updateSelectionItem(
        liturgyId,
        sectionIndex,
        existing.id,
        citation,
        "",
        false,
        existing.type === "selection" ? (existing.marks ?? []) : [],
        existing.type === "selection" ? (existing.trinitarianSeal ?? null) : null
      )
    : await addSelection(liturgyId, sectionIndex, citation, "");

  return { success: result.success, error: result.error };
}
