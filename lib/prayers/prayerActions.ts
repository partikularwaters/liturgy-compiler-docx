"use server";

import { supabase } from "@/lib/db/supabase";
import { normalizeTypography } from "@/lib/text/typographic";
import { setTranslationPair } from "@/lib/liturgy/translationPairing";
import type { TextMark } from "@/types/liturgy";

export async function createPrayer(
  sectionName: string,
  text: string,
  kind: "corporate" | "leader" = "leader",
  marks: TextMark[] = [],
  isGuide: boolean = false,
  translation: "fil" | "en" | null = null,
  pairedId: string | null = null
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  if (!text.trim()) {
    return { success: false, error: "Prayer text is required." };
  }

  const { data, error } = await supabase
    .from("prayers")
    .insert({ section_name: sectionName, text: normalizeTypography(text), kind, marks, is_guide: isGuide, translation })
    .select("id")
    .single();

  if (error) {
    console.error("[lib/prayers/prayerActions/createPrayer]", error.message);
    return { success: false, error: "Unable to save this Prayer right now." };
  }

  if (pairedId) {
    await setTranslationPair("prayers", data.id, pairedId);
  }

  return { success: true, data: { id: data.id } };
}

export async function updatePrayer(
  id: string,
  sectionName: string,
  text: string,
  kind?: "corporate" | "leader",
  marks: TextMark[] = [],
  isGuide?: boolean,
  translation?: "fil" | "en" | null,
  pairedId?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!sectionName.trim() || !text.trim()) {
    return { success: false, error: "Section and text are required." };
  }

  const { error } = await supabase
    .from("prayers")
    .update({
      section_name: sectionName,
      text: normalizeTypography(text),
      marks,
      ...(kind ? { kind } : {}),
      ...(isGuide !== undefined ? { is_guide: isGuide } : {}),
      ...(translation !== undefined ? { translation } : {}),
    })
    .eq("id", id);

  if (error) {
    console.error("[lib/prayers/prayerActions/updatePrayer]", error.message);
    return { success: false, error: "Unable to update this Prayer right now." };
  }

  if (pairedId !== undefined) {
    const pairResult = await setTranslationPair("prayers", id, pairedId);
    if (!pairResult.success) return pairResult;
  }

  return { success: true };
}

// v2 Phase A follow-up: Prayer had no delete path either, the same gap
// Formula had before deleteFormula() -- covers both kind='prayer' and
// kind='guide' rows, since PrayerListRow is shared by both. No usage check
// against placed PrayerItem instances, matching the same defensive-fallback
// pattern as deleteFormula/deleteSong.
export async function deletePrayer(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("prayers").delete().eq("id", id);

  if (error) {
    console.error("[lib/prayers/prayerActions/deletePrayer]", error.message);
    return { success: false, error: "Unable to delete this Prayer right now." };
  }

  return { success: true };
}
