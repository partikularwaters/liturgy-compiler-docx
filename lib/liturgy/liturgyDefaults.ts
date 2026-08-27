import "server-only";

import { getVesperTableReadings } from "@/lib/liturgy/vesperTableRotation";
import { placeSelection } from "@/lib/liturgy/placeSelection";
import { placeVerbalCue } from "@/lib/liturgy/placeVerbalCue";
import { MORNING_VERBAL_CUE_TEMPLATES } from "@/lib/liturgy/verbalCueTemplates";
import type { TemplateSection } from "@/types/liturgy";

// Extracted from createLiturgyAction.ts so both the human "Create Liturgy"
// button and the n8n automation's ensureWeek() apply the exact same
// defaults to a brand-new Liturgy -- a Vesper/Morning liturgy created by
// either path must start identically, never a lesser, auto-assignment-free
// version. Calls placeSelection/placeVerbalCue directly (not
// addSelection/addVerbalCue) since those Server Actions require a signed-in
// human session that doesn't exist in the automation's call path -- see
// context/architecture.md's Invariants on "use server" vs. server-only.

// Each cue targets a different Section -- a separate row in `sections`
// keyed by (liturgy_id, template_section_index) -- so these are
// independent writes with no shared state to race on.
export async function seedMorningVerbalCues(liturgyId: string, sections: TemplateSection[]): Promise<void> {
  await Promise.all(
    Object.entries(MORNING_VERBAL_CUE_TEMPLATES).map(async ([sectionName, text]) => {
      const sectionIndex = sections.findIndex((s) => s.name === sectionName);
      if (sectionIndex === -1) {
        console.error("[lib/liturgy/liturgyDefaults] verbal cue seed: Section not found in template:", sectionName);
        return;
      }
      const result = await placeVerbalCue(liturgyId, sectionIndex, text, "leader_only");
      if (!result.success) {
        console.error("[lib/liturgy/liturgyDefaults] verbal cue seed failed:", sectionName, result.error);
      }
    })
  );
}

export async function autoAssignVesperTableReadings(
  liturgyId: string,
  serviceDate: string,
  sections: TemplateSection[]
): Promise<void> {
  const readings = getVesperTableReadings(serviceDate);
  // 2026-08-26: Great Commission Text gets the same auto-assignment as
  // Words of Institution (both are fixed purely by Sunday-of-month, same
  // 4-week shape).
  const targets: [string, string][] = [
    ["The Lord’s Discourses", readings.discourse.citation],
    ["Words of Institution", readings.wordsOfInstitution],
    ["Closing of the Table", readings.closingOfTable],
    ["The Great Commission", readings.greatCommission],
  ];

  // Same independent-rows reasoning as seedMorningVerbalCues above --
  // parallelized for the same reason.
  await Promise.all(
    targets.map(async ([sectionName, citation]) => {
      const sectionIndex = sections.findIndex((s) => s.name === sectionName);
      if (sectionIndex === -1) {
        console.error("[lib/liturgy/liturgyDefaults] auto-assign: Section not found in template:", sectionName);
        return;
      }
      const result = await placeSelection(liturgyId, sectionIndex, citation, "");
      if (!result.success) {
        console.error("[lib/liturgy/liturgyDefaults] auto-assign failed:", sectionName, result.error);
      }
    })
  );
}
