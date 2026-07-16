"use server";

import { supabase } from "@/lib/db/supabase";
import { LITURGY_TEMPLATES } from "@/lib/liturgy/templates";
import { getLordsDayNumber, parseLocalDate } from "@/lib/liturgy/lordsDay";
import type { CreatedLiturgy, LiturgyTemplateId } from "@/types/liturgy";

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
    .select("id")
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

  return {
    success: true,
    data: { id: liturgyId, serviceDate, lordsDayNumber },
  };
}
