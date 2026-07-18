"use server";

import { supabase } from "@/lib/db/supabase";
import { normalizeTypography } from "@/lib/text/typographic";

export async function createSong(
  sectionName: string,
  kind: "psalm" | "hymn",
  title: string,
  attribution: string,
  yearPublished: string,
  notes: string
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
    })
    .select("id")
    .single();

  if (error) {
    console.error("[lib/songs/songActions/createSong]", error.message);
    return { success: false, error: "Unable to save this Song right now." };
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
  notes: string
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
    })
    .eq("id", id);

  if (error) {
    console.error("[lib/songs/songActions/updateSong]", error.message);
    return { success: false, error: "Unable to update this Song right now." };
  }

  return { success: true };
}
