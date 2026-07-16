"use server";

import { supabase } from "@/lib/db/supabase";
import { normalizeTypography } from "@/lib/text/typographic";

export async function createPrayer(
  sectionName: string,
  text: string
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  if (!text.trim()) {
    return { success: false, error: "Prayer text is required." };
  }

  const { data, error } = await supabase
    .from("prayers")
    .insert({ section_name: sectionName, text: normalizeTypography(text) })
    .select("id")
    .single();

  if (error) {
    console.error("[lib/prayers/prayerActions/createPrayer]", error.message);
    return { success: false, error: "Unable to save this Prayer right now." };
  }

  return { success: true, data: { id: data.id } };
}

export async function updatePrayer(
  id: string,
  sectionName: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  if (!sectionName.trim() || !text.trim()) {
    return { success: false, error: "Section and text are required." };
  }

  const { error } = await supabase
    .from("prayers")
    .update({ section_name: sectionName, text: normalizeTypography(text) })
    .eq("id", id);

  if (error) {
    console.error("[lib/prayers/prayerActions/updatePrayer]", error.message);
    return { success: false, error: "Unable to update this Prayer right now." };
  }

  return { success: true };
}
