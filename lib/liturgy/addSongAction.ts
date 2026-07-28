"use server";

import { supabase } from "@/lib/db/supabase";
import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import { insertSectionItem, updateSectionItem } from "@/lib/liturgy/sectionItems";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { SongItem } from "@/types/liturgy";

export async function addSong(
  liturgyId: string,
  sectionIndex: number,
  songId: string
): Promise<{ success: boolean; error?: string }> {
  if (!songId.trim()) {
    return { success: false, error: "A Song must be selected." };
  }

  const requester = await getCurrentUser();
  if (!requester) {
    return { success: false, error: "Sign in to place a Song." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  const { data: song, error: songError } = await supabase
    .from("songs")
    .select("section_name, title, kind, attribution, year_published, notes")
    .eq("id", songId)
    .single();

  if (songError || !song) {
    console.error("[lib/liturgy/addSongAction]", songError?.message);
    return { success: false, error: "That Song could not be found." };
  }

  if (song.section_name !== section.sectionName) {
    console.error(
      "[lib/liturgy/addSongAction] section mismatch:",
      song.section_name,
      "!=",
      section.sectionName
    );
    return { success: false, error: "That Song does not belong to this Section." };
  }

  // Snapshot the Song's metadata now -- see SongItem's own comment for why
  // this can no longer be a live lookup at render/export time.
  const newItem: SongItem = {
    id: crypto.randomUUID(),
    type: "song",
    songId,
    title: song.title,
    kind: song.kind,
    attribution: song.attribution,
    yearPublished: song.year_published,
    notes: song.notes,
  };

  const { success, error: updateError } = await insertSectionItem(section.id, newItem);

  if (!success) {
    console.error("[lib/liturgy/addSongAction]", updateError);
    return { success: false, error: "Unable to place this Song right now." };
  }

  return { success: true };
}

// Edits an already-placed Song item's OWN snapshot -- Song had no
// edit-in-place path at all until now (only add/remove). Mirrors
// updatePrayerItem's shape exactly, including the same v3 Personal Library
// opt-in fork -- see that function's comment for the full reasoning.
export async function updateSongItem(
  liturgyId: string,
  sectionIndex: number,
  itemId: string,
  title: string,
  attribution: string,
  yearPublished: string,
  notes: string,
  saveToPersonalLibrary: boolean = false
): Promise<{ success: boolean; error?: string; savedToPersonalLibrary?: boolean }> {
  const requester = await getCurrentUser();
  if (!requester) {
    return { success: false, error: "Sign in to update this Song." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  const existingItem = section.items.find((item) => item.id === itemId && item.type === "song");
  if (!existingItem || existingItem.type !== "song") {
    return { success: false, error: "Unable to find that Song right now." };
  }
  const attributionValue = attribution.trim() || null;
  const yearPublishedValue = yearPublished.trim() || null;
  const notesValue = notes.trim() || null;

  const { success, error } = await updateSectionItem({
    ...existingItem,
    title,
    attribution: attributionValue,
    yearPublished: yearPublishedValue,
    notes: notesValue,
  });

  if (!success) {
    console.error("[lib/liturgy/addSongAction/updateSongItem]", error);
    return { success: false, error: "Unable to update this Song right now." };
  }

  let savedToPersonalLibrary = false;
  if (saveToPersonalLibrary && existingItem?.type === "song" && requester.role === "compiler") {
    const { data: existingFork } = await supabase
      .from("songs")
      .select("id")
      .eq("owner_id", requester.id)
      .eq("forked_from_id", existingItem.songId)
      .maybeSingle();

    if (existingFork) {
      const { error: forkError } = await supabase
        .from("songs")
        .update({ title, attribution: attributionValue, year_published: yearPublishedValue, notes: notesValue })
        .eq("id", existingFork.id);
      savedToPersonalLibrary = !forkError;
    } else {
      const { data: original } = await supabase
        .from("songs")
        .select("section_name, kind")
        .eq("id", existingItem.songId)
        .single();
      if (original) {
        const { error: forkError } = await supabase.from("songs").insert({
          section_name: original.section_name,
          kind: original.kind,
          title,
          attribution: attributionValue,
          year_published: yearPublishedValue,
          notes: notesValue,
          owner_id: requester.id,
          forked_from_id: existingItem.songId,
        });
        savedToPersonalLibrary = !forkError;
      }
    }
  }

  return { success: true, savedToPersonalLibrary };
}
