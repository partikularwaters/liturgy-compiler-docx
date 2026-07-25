"use server";

import { supabase } from "@/lib/db/supabase";
import { getSectionContext } from "@/lib/liturgy/getSectionContext";
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

  const { error: updateError } = await supabase
    .from("sections")
    .update({ items: [...section.items, newItem] })
    .eq("id", section.id);

  if (updateError) {
    console.error("[lib/liturgy/addSongAction]", updateError.message);
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
  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  const existingItem = section.items.find((item) => item.id === itemId && item.type === "song");
  const attributionValue = attribution.trim() || null;
  const yearPublishedValue = yearPublished.trim() || null;
  const notesValue = notes.trim() || null;

  const items = section.items.map((item) =>
    item.id === itemId && item.type === "song"
      ? { ...item, title, attribution: attributionValue, yearPublished: yearPublishedValue, notes: notesValue }
      : item
  );

  const { error } = await supabase.from("sections").update({ items }).eq("id", section.id);

  if (error) {
    console.error("[lib/liturgy/addSongAction/updateSongItem]", error.message);
    return { success: false, error: "Unable to update this Song right now." };
  }

  let savedToPersonalLibrary = false;
  if (saveToPersonalLibrary && existingItem?.type === "song") {
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.role === "compiler") {
      const { data: existingFork } = await supabase
        .from("songs")
        .select("id")
        .eq("owner_id", currentUser.id)
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
            owner_id: currentUser.id,
            forked_from_id: existingItem.songId,
          });
          savedToPersonalLibrary = !forkError;
        }
      }
    }
  }

  return { success: true, savedToPersonalLibrary };
}
