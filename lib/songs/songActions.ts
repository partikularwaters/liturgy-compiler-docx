"use server";

import { supabase } from "@/lib/db/supabase";
import { normalizeTypography } from "@/lib/text/typographic";
import { setTranslationPair } from "@/lib/liturgy/translationPairing";

export async function createSong(
  sectionName: string,
  kind: "psalm" | "hymn",
  title: string,
  attribution: string,
  yearPublished: string,
  notes: string,
  translation: "fil" | "en" | null = null,
  pairedId: string | null = null
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  if (!sectionName.trim() || !title.trim()) {
    return { success: false, error: "Section and title are required." };
  }

  const { data, error } = await supabase
    .from("songs")
    .insert({
      section_name: sectionName,
      kind,
      title: normalizeTypography(title),
      attribution: attribution.trim() ? normalizeTypography(attribution) : null,
      year_published: yearPublished.trim() || null,
      notes: notes.trim() ? normalizeTypography(notes) : null,
      translation,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[lib/songs/songActions/createSong]", error.message);
    return { success: false, error: "Unable to save this Song right now." };
  }

  if (pairedId) {
    await setTranslationPair("songs", data.id, pairedId);
  }

  return { success: true, data: { id: data.id } };
}

export async function updateSong(
  id: string,
  sectionName: string,
  kind: "psalm" | "hymn",
  title: string,
  attribution: string,
  yearPublished: string,
  notes: string,
  translation?: "fil" | "en" | null,
  pairedId?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!sectionName.trim() || !title.trim()) {
    return { success: false, error: "Section and title are required." };
  }

  const { error } = await supabase
    .from("songs")
    .update({
      section_name: sectionName,
      kind,
      title: normalizeTypography(title),
      attribution: attribution.trim() ? normalizeTypography(attribution) : null,
      year_published: yearPublished.trim() || null,
      notes: notes.trim() ? normalizeTypography(notes) : null,
      ...(translation !== undefined ? { translation } : {}),
    })
    .eq("id", id);

  if (error) {
    console.error("[lib/songs/songActions/updateSong]", error.message);
    return { success: false, error: "Unable to update this Song right now." };
  }

  if (pairedId !== undefined) {
    const pairResult = await setTranslationPair("songs", id, pairedId);
    if (!pairResult.success) return pairResult;
  }

  return { success: true };
}

// v2 Phase A: Songs previously had no delete path at all (only createSong,
// used both for standalone library entries and while placing one into a
// Section via AddSongPanel). No usage check against placed SongItem
// instances -- resolveItemText.ts's song case already falls back to
// "(Song not found)" for a dangling songId, the same defensive pattern
// Formula/Prayer's lookups rely on.
export async function deleteSong(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("songs").delete().eq("id", id);

  if (error) {
    console.error("[lib/songs/songActions/deleteSong]", error.message);
    return { success: false, error: "Unable to delete this Song right now." };
  }

  return { success: true };
}
