"use server";

import { supabase } from "@/lib/db/supabase";
import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import type { PrayerItem } from "@/types/liturgy";

export async function addPrayer(
  liturgyId: string,
  sectionIndex: number,
  prayerId: string
): Promise<{ success: boolean; error?: string }> {
  if (!prayerId.trim()) {
    return { success: false, error: "A Prayer must be selected." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  const { data: prayer, error: prayerError } = await supabase
    .from("prayers")
    .select("section_name")
    .eq("id", prayerId)
    .single();

  if (prayerError || !prayer) {
    console.error("[lib/liturgy/addPrayerAction]", prayerError?.message);
    return { success: false, error: "That Prayer could not be found." };
  }

  if (prayer.section_name !== section.sectionName) {
    console.error(
      "[lib/liturgy/addPrayerAction] section mismatch:",
      prayer.section_name,
      "!=",
      section.sectionName
    );
    return { success: false, error: "That Prayer does not belong to this Section." };
  }

  const newItem: PrayerItem = { id: crypto.randomUUID(), type: "prayer", prayerId };

  const { error: updateError } = await supabase
    .from("sections")
    .update({ items: [...section.items, newItem] })
    .eq("id", section.id);

  if (updateError) {
    console.error("[lib/liturgy/addPrayerAction]", updateError.message);
    return { success: false, error: "Unable to place this Prayer right now." };
  }

  return { success: true };
}
