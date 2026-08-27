"use server";

import { supabase } from "@/lib/db/supabase";
import { LITURGY_TEMPLATES } from "@/lib/liturgy/templates";
import { getLordsDayNumber, parseLocalDate } from "@/lib/liturgy/lordsDay";
import { autoAssignVesperTableReadings, seedMorningVerbalCues } from "@/lib/liturgy/liturgyDefaults";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { CreatedLiturgy, LiturgyTemplateId, TemplateSection } from "@/types/liturgy";

export async function createLiturgy(
  templateId: LiturgyTemplateId,
  serviceDate: string
): Promise<{ success: boolean; data?: CreatedLiturgy; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to create a liturgy." };
  }

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

  // Automated rotation-cycle assignment (lib/liturgy/
  // vesperTableRotation.ts) -- replaces manually cross-referencing
  // the Handbook's printed table by hand for every new Vesper liturgy.
  // Best-effort: a failure here shouldn't fail liturgy creation, since
  // every Section is still editable by hand afterward exactly as before
  // this feature existed.
  if (templateId === "vesper") {
    await autoAssignVesperTableReadings(liturgyId, serviceDate, templateRow.sections as TemplateSection[]);
  }

  // Default Verbal Cue seeding -- gives a new Morning liturgy a starting cue in every
  // Section that has one, instead of every Section starting silent.
  // Best-effort, same discipline as the Vesper auto-assign above: a failure
  // here shouldn't fail liturgy creation, and every cue stays freely
  // editable afterward exactly like a hand-typed one.
  if (templateId === "morning") {
    await seedMorningVerbalCues(liturgyId, templateRow.sections as TemplateSection[]);
  }

  return {
    success: true,
    data: { id: liturgyId, serviceDate, lordsDayNumber },
  };
}
