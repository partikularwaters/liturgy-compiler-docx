import { supabase } from "@/lib/db/supabase";
import { markDraft } from "@/lib/liturgy/markDraft";
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

// BA-004: a read failure here used to be swallowed into an empty result,
// which let a caller like getLiturgy() carry on and hand back a liturgy
// that *looks* complete but is silently missing every item in the Sections
// that failed to load -- an export built from that renders as a successful,
// blank-looking DOCX/PDF instead of a visible failure. `null` means "this
// read failed," distinct from "these Sections genuinely have no items yet"
// (`[]`/an empty Map), so every caller can choose to fail closed instead of
// treating the two as the same thing.
export async function getItemsForSection(sectionId: string): Promise<Item[] | null> {
  const { data, error } = await supabase
    .from("section_items")
    .select("id, type, data, position")
    .eq("section_id", sectionId);

  if (error) {
    console.error("[lib/liturgy/sectionItems/getItemsForSection]", error.message);
    return null;
  }

  return reconstructItems(data ?? []);
}

// Bulk variant for getLiturgy.ts/getLiturgies.ts, which already fetch every
// Section row for one liturgy in one query -- avoids one round trip per
// Section on top of that. Same null-on-failure contract as
// getItemsForSection above.
export async function getItemsForSections(sectionIds: string[]): Promise<Map<string, Item[]> | null> {
  const bySection = new Map<string, Item[]>();
  if (sectionIds.length === 0) return bySection;

  const { data, error } = await supabase
    .from("section_items")
    .select("id, type, data, position, section_id")
    .in("section_id", sectionIds);

  if (error) {
    console.error("[lib/liturgy/sectionItems/getItemsForSections]", error.message);
    return null;
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

// Any successful write below must return its Liturgy to Draft if it was
// Ready -- a placed/edited/removed item can invalidate an already-approved
// Liturgy (the n8n automation charter's auto-draft rule). Resolving the
// Liturgy id and flipping its status is best-effort: a failure here must
// never fail the content write that already succeeded, only be logged --
// same discipline as createLiturgyAction.ts's best-effort auto-assignment.
async function resolveLiturgyIdForSection(sectionId: string): Promise<string | null> {
  const { data, error } = await supabase.from("sections").select("liturgy_id").eq("id", sectionId).single();
  if (error || !data) {
    console.error("[lib/liturgy/sectionItems] could not resolve liturgy for section", sectionId, error?.message);
    return null;
  }
  return data.liturgy_id;
}

async function resolveLiturgyIdForItem(itemId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("section_items")
    .select("sections(liturgy_id)")
    .eq("id", itemId)
    .single();
  if (error || !data) {
    console.error("[lib/liturgy/sectionItems] could not resolve liturgy for item", itemId, error?.message);
    return null;
  }
  const section = data.sections as unknown as { liturgy_id: string } | null;
  return section?.liturgy_id ?? null;
}

async function invalidateReadiness(liturgyId: string | null): Promise<void> {
  if (!liturgyId) return;
  const { success, error } = await markDraft(liturgyId);
  if (!success) {
    console.error("[lib/liturgy/sectionItems] markDraft failed", liturgyId, error);
  }
}

// New item goes at the end of its Section. Position is computed server-side
// by the section_items_set_position trigger (20260824010000), not read here
// and passed along -- a client-side "count, then insert" round trip left a
// window for two concurrent placements into the same Section to read the
// same count and collide (BA-003). The trigger serializes concurrent
// inserts per Section with a transaction-scoped advisory lock, so whatever
// this call omits/sends for position is overwritten there.
export async function insertSectionItem(
  sectionId: string,
  item: Item
): Promise<{ success: boolean; error?: string }> {
  const { id, type, ...data } = item;
  const { error } = await supabase
    .from("section_items")
    .insert({ id, section_id: sectionId, type, data });

  if (error) {
    console.error("[lib/liturgy/sectionItems/insertSectionItem]", error.message);
    return { success: false, error: "Unable to place this item right now." };
  }

  await invalidateReadiness(await resolveLiturgyIdForSection(sectionId));

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

  await invalidateReadiness(await resolveLiturgyIdForItem(id));

  return { success: true };
}

export async function deleteSectionItem(itemId: string): Promise<{ success: boolean; error?: string }> {
  // Resolve before deleting -- the section_items row (and its section_id)
  // won't exist to look up anymore once the delete succeeds.
  const liturgyId = await resolveLiturgyIdForItem(itemId);

  const { error } = await supabase.from("section_items").delete().eq("id", itemId);

  if (error) {
    console.error("[lib/liturgy/sectionItems/deleteSectionItem]", error.message);
    return { success: false, error: "Unable to remove this item right now." };
  }

  await invalidateReadiness(liturgyId);

  return { success: true };
}
