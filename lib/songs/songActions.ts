"use server";

import { supabase } from "@/lib/db/supabase";
import { normalizeTypography } from "@/lib/text/typographic";
import { reconcileTranslationPair, setTranslationPair } from "@/lib/liturgy/translationPairing";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Same v3 RBAC gate as lib/prayers/prayerActions.ts -- see that file's
// comment for the full reasoning (this direct Library CRUD path had no auth
// check at all until the task 8 anonymous-read-only audit).
// Track B (2026-08-31): sectionNames is now a real multi-select (Ticket 26's
// Library add-modal) -- a Song can be tagged for every Section it's
// actually used in, not just one. `songs.section_name` (the legacy single
// column, kept for display -- see Song's own type comment) is set to the
// first selected name; song_section_tags carries the full set and is the
// real source of truth for placement (getSongs.ts).
export async function createSong(
  sectionNames: string[],
  kind: "psalm" | "hymn",
  title: string,
  attribution: string,
  yearPublished: string,
  notes: string,
  translation: "fil" | "en" | null = null,
  pairedId: string | null = null
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  if (sectionNames.length === 0 || !title.trim()) {
    return { success: false, error: "At least one Section and a title are required." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to create a Song." };
  }

  const ownerId = currentUser.role === "curator" ? null : currentUser.id;

  const { data, error } = await supabase.rpc("create_song_with_tags", {
    p_section_names: sectionNames,
    p_kind: kind,
    p_title: normalizeTypography(title),
    p_attribution: attribution.trim() ? normalizeTypography(attribution) : "",
    p_year_published: yearPublished.trim(),
    p_notes: notes.trim() ? normalizeTypography(notes) : "",
    p_translation: translation,
    p_owner_id: ownerId,
  });

  if (error) {
    console.error("[lib/songs/songActions/createSong]", error.message);
    return { success: false, error: "Unable to save this Song right now." };
  }

  if (pairedId) {
    const pairResult = await setTranslationPair("songs", data, pairedId);
    if (!pairResult.success) {
      return {
        success: false,
        data: { id: data },
        error: "Song was created, but its translation pairing could not be saved. Close this form and edit the saved Song to retry.",
      };
    }
  }

  return { success: true, data: { id: data } };
}

export async function updateSong(
  id: string,
  sectionNames: string[],
  kind: "psalm" | "hymn",
  title: string,
  attribution: string,
  yearPublished: string,
  notes: string,
  translation?: "fil" | "en" | null,
  pairedId?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (sectionNames.length === 0 || !title.trim()) {
    return { success: false, error: "At least one Section and a title are required." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to edit a Song." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("songs")
    .select("owner_id, translation")
    .eq("id", id)
    .single();
  if (fetchError || !existing) {
    return { success: false, error: "That Song could not be found." };
  }

  const canEdit = existing.owner_id === null ? currentUser.role === "curator" : existing.owner_id === currentUser.id;
  if (!canEdit) {
    return { success: false, error: "Only a Curator can edit this Song." };
  }

  const { error } = await supabase.rpc("update_song_with_tags", {
    p_song_id: id,
    p_section_names: sectionNames,
    p_kind: kind,
    p_title: normalizeTypography(title),
    p_attribution: attribution.trim() ? normalizeTypography(attribution) : "",
    p_year_published: yearPublished.trim(),
    p_notes: notes.trim() ? normalizeTypography(notes) : "",
    // AddSongPanel's incidental metadata edit does not send a translation,
    // so preserve the existing value rather than treating "undefined" as a
    // request to clear it. Library-form edits pass an explicit value.
    p_translation: translation === undefined ? existing.translation : translation,
  });

  if (error) {
    console.error("[lib/songs/songActions/updateSong]", error.message);
    return { success: false, error: "Unable to update this Song right now." };
  }

  const pairResult =
    pairedId !== undefined ? await setTranslationPair("songs", id, pairedId) : await reconcileTranslationPair("songs", id);
  if (!pairResult.success) return pairResult;

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
