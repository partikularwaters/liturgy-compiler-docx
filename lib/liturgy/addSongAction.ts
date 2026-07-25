"use server";

import { supabase } from "@/lib/db/supabase";
import { getSectionContext } from "@/lib/liturgy/getSectionContext";
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
