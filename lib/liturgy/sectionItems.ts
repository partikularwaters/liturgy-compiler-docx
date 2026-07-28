import { supabase } from "@/lib/db/supabase";
import type { Item } from "@/types/liturgy";

interface SectionItemRow {
  id: string;
  type: Item["type"];
  data: Record<string, unknown>;
  position: number;
}

// The one place that converts a section_items row back into the same Item
// shape every renderer/action already expects -- id/type are real columns,
// everything else lives in `data`. Called by every read chokepoint so the
// conversion exists exactly once (see architecture.md's Shared Helpers rule).
function reconstructItems(rows: SectionItemRow[]): Item[] {
  return [...rows]
    .sort((a, b) => a.position - b.position)
    .map((row) => ({ id: row.id, type: row.type, ...row.data }) as Item);
}

export async function getItemsForSection(sectionId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from("section_items")
    .select("id, type, data, position")
    .eq("section_id", sectionId);

  if (error) {
    console.error("[lib/liturgy/sectionItems/getItemsForSection]", error.message);
    return [];
  }

  return reconstructItems(data ?? []);
}

// Bulk variant for getLiturgy.ts/getLiturgies.ts, which already fetch every
// Section row for one liturgy in one query -- avoids one round trip per
// Section on top of that.
export async function getItemsForSections(sectionIds: string[]): Promise<Map<string, Item[]>> {
  const bySection = new Map<string, Item[]>();
  if (sectionIds.length === 0) return bySection;

  const { data, error } = await supabase
    .from("section_items")
    .select("id, type, data, position, section_id")
    .in("section_id", sectionIds);

  if (error) {
    console.error("[lib/liturgy/sectionItems/getItemsForSections]", error.message);
    return bySection;
  }

  const rowsBySection = new Map<string, SectionItemRow[]>();
  for (const row of data ?? []) {
    const rows = rowsBySection.get(row.section_id) ?? [];
    rows.push(row);
    rowsBySection.set(row.section_id, rows);
  }

  for (const sectionId of sectionIds) {
    bySection.set(sectionId, reconstructItems(rowsBySection.get(sectionId) ?? []));
  }

  return bySection;
}

// New item goes at the end of its Section -- position is just "how many
// items are already there," not a value the caller picks.
export async function insertSectionItem(
  sectionId: string,
  item: Item
): Promise<{ success: boolean; error?: string }> {
  const { count, error: countError } = await supabase
    .from("section_items")
    .select("id", { count: "exact", head: true })
    .eq("section_id", sectionId);

  if (countError) {
    console.error("[lib/liturgy/sectionItems/insertSectionItem]", countError.message);
    return { success: false, error: "Unable to place this item right now." };
  }

  const { id, type, ...data } = item;
  const { error } = await supabase
    .from("section_items")
    .insert({ id, section_id: sectionId, position: count ?? 0, type, data });

  if (error) {
    console.error("[lib/liturgy/sectionItems/insertSectionItem]", error.message);
    return { success: false, error: "Unable to place this item right now." };
  }

  return { success: true };
}

export async function updateSectionItem(item: Item): Promise<{ success: boolean; error?: string }> {
  const { id, type, ...data } = item;
  void type;
  const { error } = await supabase.from("section_items").update({ data }).eq("id", id);

  if (error) {
    console.error("[lib/liturgy/sectionItems/updateSectionItem]", error.message);
    return { success: false, error: "Unable to update this item right now." };
  }

  return { success: true };
}

export async function deleteSectionItem(itemId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("section_items").delete().eq("id", itemId);

  if (error) {
    console.error("[lib/liturgy/sectionItems/deleteSectionItem]", error.message);
    return { success: false, error: "Unable to remove this item right now." };
  }

  return { success: true };
}
