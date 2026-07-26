"use server";

import { supabase } from "@/lib/db/supabase";
import { normalizeTypography } from "@/lib/text/typographic";
import { setTranslationPair } from "@/lib/liturgy/translationPairing";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Same v3 RBAC gate as lib/prayers/prayerActions.ts -- see that file's
// comment for the full reasoning (this direct Library CRUD path had no auth
// check at all until the task 8 anonymous-read-only audit).
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

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to create a Song." };
  }

  const ownerId = currentUser.role === "curator" ? null : currentUser.id;

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
      owner_id: ownerId,
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

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to edit a Song." };
  }

  const { data: existing, error: fetchError } = await supabase.from("songs").select("owner_id").eq("id", id).single();
  if (fetchError || !existing) {
    return { success: false, error: "That Song could not be found." };
  }

  const canEdit = existing.owner_id === null ? currentUser.role === "curator" : existing.owner_id === currentUser.id;
  if (!canEdit) {
    return { success: false, error: "Only a Curator can edit this Song." };
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
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to delete a Song." };
  }

  const { data: existing, error: fetchError } = await supabase.from("songs").select("owner_id").eq("id", id).single();
  if (fetchError || !existing) {
    return { success: false, error: "That Song could not be found." };
  }

  const canDelete = existing.owner_id === null ? currentUser.role === "curator" : existing.owner_id === currentUser.id;
  if (!canDelete) {
    return { success: false, error: "Only a Curator can delete this Song." };
  }

  const { error } = await supabase.from("songs").delete().eq("id", id);

  if (error) {
    console.error("[lib/songs/songActions/deleteSong]", error.message);
    return { success: false, error: "Unable to delete this Song right now." };
  }

  return { success: true };
}
