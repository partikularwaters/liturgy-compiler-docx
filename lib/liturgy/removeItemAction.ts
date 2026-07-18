"use server";

import { supabase } from "@/lib/db/supabase";
import { getSectionContext } from "@/lib/liturgy/getSectionContext";

// One generic delete path for every item type -- Selection, Formula, Verbal
// Cue, Prayer, Sermon, Song all live in the same `items` jsonb array, so
// removing one is always the same operation regardless of type. Real gap
// this closes: every item type had an edit/add path, but none had a way to
// remove a placed item at all (e.g. Benediction ending up with two
// Trinitarian-formula placements and no way to delete the stray one).
export async function removeItem(
  liturgyId: string,
  sectionIndex: number,
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  const items = section.items.filter((item) => item.id !== itemId);

  const { error } = await supabase.from("sections").update({ items }).eq("id", section.id);

  if (error) {
    console.error("[lib/liturgy/removeItemAction]", error.message);
    return { success: false, error: "Unable to remove this item right now." };
  }

  return { success: true };
}
