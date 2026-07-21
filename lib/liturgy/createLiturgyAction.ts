"use server";

import { supabase } from "@/lib/db/supabase";
import { LITURGY_TEMPLATES } from "@/lib/liturgy/templates";
import { getLordsDayNumber, parseLocalDate } from "@/lib/liturgy/lordsDay";
import { getVesperTableReadings } from "@/lib/liturgy/vesperTableRotation";
import { addSelection } from "@/lib/liturgy/addSelectionAction";
import type { CreatedLiturgy, LiturgyTemplateId, TemplateSection } from "@/types/liturgy";

export async function createLiturgy(
  templateId: LiturgyTemplateId,
  serviceDate: string
): Promise<{ success: boolean; data?: CreatedLiturgy; error?: string }> {
  const template = LITURGY_TEMPLATES.find((t) => t.id === templateId);
  if (!template || !/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) {
    return { success: false, error: "Invalid template or date." };
  }

  const { data: templateRow, error: templateError } = await supabase
    .from("templates")
    .select("id, sections")
    .eq("name", template.name)
    .single();

  if (templateError || !templateRow) {
    console.error("[lib/liturgy/createLiturgyAction]", templateError?.message);
    return { success: false, error: "Unable to find that template right now." };
  }

  const lordsDayNumber = getLordsDayNumber(parseLocalDate(serviceDate));

  const { data: liturgyId, error: rpcError } = await supabase.rpc("create_liturgy", {
    p_template_id: templateRow.id,
    p_service_date: serviceDate,
    p_lords_day_number: lordsDayNumber,
  });

  if (rpcError || !liturgyId) {
    console.error("[lib/liturgy/createLiturgyAction]", rpcError?.message);
    return { success: false, error: "Unable to start this liturgy right now." };
  }

  // v2 item 4: automated rotation-cycle assignment (lib/liturgy/
  // vesperTableRotation.ts) -- replaces Madrid manually cross-referencing
  // the Handbook's printed table by hand for every new Vesper liturgy.
  // Best-effort: a failure here shouldn't fail liturgy creation, since
  // every Section is still editable by hand afterward exactly as before
  // this feature existed.
  if (templateId === "vesper") {
    await autoAssignVesperTableReadings(liturgyId, serviceDate, templateRow.sections as TemplateSection[]);
  }

  return {
    success: true,
    data: { id: liturgyId, serviceDate, lordsDayNumber },
  };
}

async function autoAssignVesperTableReadings(
  liturgyId: string,
  serviceDate: string,
  sections: TemplateSection[]
): Promise<void> {
  const readings = getVesperTableReadings(serviceDate);
  // Great Commission is deliberately excluded here even though the
  // Handbook's table gives it its own 4-week rotation too -- "The Great
  // Commission" Section is currently a Formula (fixed text), not a
  // Selection, so it can't hold a rotating citation without a scope
  // decision (convert the Section to Selection, or something else) that
  // wasn't part of what was asked for this pass. Flagged, not silently
  // built.
  const targets: [string, string][] = [
    ["The Lord's Discourses", readings.discourse.citation],
    ["Words of Institution", readings.wordsOfInstitution],
    ["Closing of the Table", readings.closingOfTable],
  ];

  for (const [sectionName, citation] of targets) {
    const sectionIndex = sections.findIndex((s) => s.name === sectionName);
    if (sectionIndex === -1) {
      console.error("[lib/liturgy/createLiturgyAction] auto-assign: Section not found in template:", sectionName);
      continue;
    }
    const result = await addSelection(liturgyId, sectionIndex, citation, "");
    if (!result.success) {
      console.error("[lib/liturgy/createLiturgyAction] auto-assign failed:", sectionName, result.error);
    }
  }
}
