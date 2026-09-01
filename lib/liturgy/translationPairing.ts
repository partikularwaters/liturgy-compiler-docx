import "server-only";

import { supabase } from "@/lib/db/supabase";
import { isValidTranslationPair, type PairableTable, type PairingRow } from "@/lib/liturgy/translationPairingRules";

export { isValidTranslationPair } from "@/lib/liturgy/translationPairingRules";

const PAIRING_COLUMNS: Record<PairableTable, string> = {
  formulas: "id, paired_id, translation, section_name, kind",
  prayers: "id, paired_id, translation, section_name, is_guide",
  songs: "id, paired_id, translation, kind",
};

type PairingResult = { success: boolean; error?: string };

function pairingFailure(table: PairableTable, error: { message: string } | null): PairingResult {
  console.error(`[lib/liturgy/translationPairing/${table}]`, error?.message);
  return { success: false, error: "Unable to update this pairing right now." };
}

async function updatePairedId(
  table: PairableTable,
  id: string,
  pairedId: string | null,
  expectedPairedId?: string
): Promise<PairingResult> {
  let query = supabase.from(table).update({ paired_id: pairedId }).eq("id", id);
  if (expectedPairedId !== undefined) query = query.eq("paired_id", expectedPairedId);
  const { error } = await query;
  return error ? pairingFailure(table, error) : { success: true };
}

async function clearPair(table: PairableTable, id: string, pairedId: string | null): Promise<PairingResult> {
  if (pairedId) {
    const counterpartResult = await updatePairedId(table, pairedId, null, id);
    if (!counterpartResult.success) return counterpartResult;
  }
  return updatePairedId(table, id, null);
}

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
): Promise<PairingResult> {
  const { data: current, error: readError } = await supabase
    .from(table)
    .select(PAIRING_COLUMNS[table])
    .eq("id", id)
    .single();

  if (readError) {
    return pairingFailure(table, readError);
  }

  const currentRow = current as unknown as PairingRow;
  const oldPairedId = currentRow.paired_id ?? null;

  if (newPairedId) {
    const { data: target, error: targetError } = await supabase
      .from(table)
      .select(PAIRING_COLUMNS[table])
      .eq("id", newPairedId)
      .single();
    if (targetError || !target) {
      return pairingFailure(table, targetError);
    }
    if (!isValidTranslationPair(table, currentRow, target as unknown as PairingRow)) {
      return clearPair(table, id, oldPairedId);
    }

    const targetOldPairedId = (target as unknown as PairingRow).paired_id ?? null;
    if (oldPairedId && oldPairedId !== newPairedId) {
      const oldPairResult = await updatePairedId(table, oldPairedId, null, id);
      if (!oldPairResult.success) return oldPairResult;
    }
    if (targetOldPairedId && targetOldPairedId !== id) {
      const targetOldPairResult = await updatePairedId(table, targetOldPairedId, null, newPairedId);
      if (!targetOldPairResult.success) return targetOldPairResult;
    }
  } else if (oldPairedId) {
    const oldPairResult = await updatePairedId(table, oldPairedId, null, id);
    if (!oldPairResult.success) return oldPairResult;
  }

  const currentPairResult = await updatePairedId(table, id, newPairedId);
  if (!currentPairResult.success) return currentPairResult;

  if (newPairedId) {
    const reciprocalResult = await updatePairedId(table, newPairedId, id);
    if (!reciprocalResult.success) return reciprocalResult;
  }

  return { success: true };
}

export async function reconcileTranslationPair(
  table: PairableTable,
  id: string
): Promise<PairingResult> {
  const { data, error } = await supabase.from(table).select("paired_id").eq("id", id).single();
  if (error || !data) {
    console.error(`[lib/liturgy/translationPairing/${table}/reconcile]`, error?.message);
    return { success: false, error: "Unable to update this pairing right now." };
  }
  return setTranslationPair(table, id, (data as { paired_id: string | null }).paired_id);
}
