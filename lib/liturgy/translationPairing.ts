"use server";

import { supabase } from "@/lib/db/supabase";

type PairableTable = "formulas" | "prayers" | "songs";

// Sets (or clears, when newPairedId is null) a translation pairing
// symmetrically -- both rows point at each other, so either side finds its
// companion with a single lookup. Shared by formulaActions/prayerActions/
// songActions rather than tripling this logic, since all three tables use
// the exact same pairing shape. Unlike Scripture's citation-based
// auto-matching, this is always a real link the user set explicitly --
// there's no canonical key to auto-match a Formula/Prayer/Song translation
// pair against.
//
// Re-pairing never leaves a stale one-way pointer: if `id` already pointed
// at some other row, that row's own pointer is cleared first; if the new
// target already pointed at a different row, that link is cleared too --
// a row can only be paired with one other row at a time.
export async function setTranslationPair(
  table: PairableTable,
  id: string,
  newPairedId: string | null
): Promise<{ success: boolean; error?: string }> {
  const { data: current, error: readError } = await supabase.from(table).select("paired_id").eq("id", id).single();

  if (readError) {
    console.error(`[lib/liturgy/translationPairing/${table}]`, readError.message);
    return { success: false, error: "Unable to update this pairing right now." };
  }

  const oldPairedId = (current?.paired_id as string | null) ?? null;

  if (oldPairedId && oldPairedId !== newPairedId) {
    await supabase.from(table).update({ paired_id: null }).eq("id", oldPairedId);
  }

  if (newPairedId) {
    const { data: target } = await supabase.from(table).select("paired_id").eq("id", newPairedId).single();
    const targetOldPairedId = (target?.paired_id as string | null) ?? null;
    if (targetOldPairedId && targetOldPairedId !== id) {
      await supabase.from(table).update({ paired_id: null }).eq("id", targetOldPairedId);
    }
  }

  const { error: updateError } = await supabase.from(table).update({ paired_id: newPairedId }).eq("id", id);
  if (updateError) {
    console.error(`[lib/liturgy/translationPairing/${table}]`, updateError.message);
    return { success: false, error: "Unable to update this pairing right now." };
  }

  if (newPairedId) {
    const { error: reciprocalError } = await supabase.from(table).update({ paired_id: id }).eq("id", newPairedId);
    if (reciprocalError) {
      console.error(`[lib/liturgy/translationPairing/${table}]`, reciprocalError.message);
      return { success: false, error: "Unable to update this pairing right now." };
    }
  }

  return { success: true };
}
