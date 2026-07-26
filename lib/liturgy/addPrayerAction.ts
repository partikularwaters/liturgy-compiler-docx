"use server";

import { supabase } from "@/lib/db/supabase";
import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import { normalizeTypography } from "@/lib/text/typographic";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { PrayerItem, TextMark } from "@/types/liturgy";

export async function addPrayer(
  liturgyId: string,
  sectionIndex: number,
  prayerId: string
): Promise<{ success: boolean; error?: string }> {
  if (!prayerId.trim()) {
    return { success: false, error: "A Prayer must be selected." };
  }

  const requester = await getCurrentUser();
  if (!requester) {
    return { success: false, error: "Sign in to place a Prayer." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  const { data: prayer, error: prayerError } = await supabase
    .from("prayers")
    .select("section_name, text, marks, kind")
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

  // Snapshot text/marks/leaderOnly now -- see PrayerItem's own comment for
  // why this can no longer be a live lookup at render/export time.
  const newItem: PrayerItem = {
    id: crypto.randomUUID(),
    type: "prayer",
    prayerId,
    text: prayer.text,
    marks: prayer.marks ?? [],
    leaderOnly: prayer.kind === "leader",
  };

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

// Edits an already-placed Prayer item's OWN snapshot -- previously
// SectionCard.tsx's "Edit" on a placed Prayer called updatePrayer() against
// the shared Library row directly, which (a) silently rewrote every other
// liturgy that ever placed that same Prayer, and (b), once the snapshot fix
// above shipped, wouldn't even affect this placement's own display anymore
// (resolveItemText.ts now prefers item.text over a live lookup). Mirrors
// updateSelectionItem's shape -- edits the sections.items jsonb array only,
// never the prayers table by default.
//
// v3 Personal Library (task 4): a Compiler can opt in (saveToPersonalLibrary)
// to also keep this edit as a reusable entry in their own Library, separate
// from this one placement's frozen snapshot -- "override per-instance and
// save to their Personal Library," per Madrid's own framing. Repeat edits of
// the same original Prayer update the same fork (matched by
// owner_id + forked_from_id) rather than piling up duplicates. A Curator
// editing a placement never forks -- they have direct write access to the
// shared master via the Library's own edit UI when they want a durable
// change, so this checkbox is Compiler-only (enforced by the caller not
// showing it, and harmless here even if somehow set for a Curator).
export async function updatePrayerItem(
  liturgyId: string,
  sectionIndex: number,
  itemId: string,
  text: string,
  marks: TextMark[],
  saveToPersonalLibrary: boolean = false
): Promise<{ success: boolean; error?: string; savedToPersonalLibrary?: boolean }> {
  const requester = await getCurrentUser();
  if (!requester) {
    return { success: false, error: "Sign in to update this Prayer." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  const normalizedText = normalizeTypography(text);
  const existingItem = section.items.find((item) => item.id === itemId && item.type === "prayer");
  const items = section.items.map((item) =>
    item.id === itemId && item.type === "prayer" ? { ...item, text: normalizedText, marks } : item
  );

  const { error } = await supabase.from("sections").update({ items }).eq("id", section.id);

  if (error) {
    console.error("[lib/liturgy/addPrayerAction/updatePrayerItem]", error.message);
    return { success: false, error: "Unable to update this Prayer right now." };
  }

  let savedToPersonalLibrary = false;
  if (saveToPersonalLibrary && existingItem?.type === "prayer" && requester.role === "compiler") {
    const { data: existingFork } = await supabase
      .from("prayers")
      .select("id")
      .eq("owner_id", requester.id)
      .eq("forked_from_id", existingItem.prayerId)
      .maybeSingle();

    if (existingFork) {
      const { error: forkError } = await supabase
        .from("prayers")
        .update({ text: normalizedText, marks })
        .eq("id", existingFork.id);
      savedToPersonalLibrary = !forkError;
    } else {
      const { data: original } = await supabase
        .from("prayers")
        .select("section_name, kind")
        .eq("id", existingItem.prayerId)
        .single();
      if (original) {
        const { error: forkError } = await supabase.from("prayers").insert({
          section_name: original.section_name,
          kind: original.kind,
          text: normalizedText,
          marks,
          owner_id: requester.id,
          forked_from_id: existingItem.prayerId,
        });
        savedToPersonalLibrary = !forkError;
      }
    }
  }

  return { success: true, savedToPersonalLibrary };
}
