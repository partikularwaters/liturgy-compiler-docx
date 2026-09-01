"use server";

import { getSectionContext } from "@/lib/liturgy/getSectionContext";
import { insertSectionItem, updateSectionItem } from "@/lib/liturgy/sectionItems";
import { normalizeTypography } from "@/lib/text/typographic";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { SermonItem } from "@/types/liturgy";

interface SermonFields {
  title: string;
  series: string;
  passage: string;
  preacher: string;
}

// Sermon is a single set of fields per liturgy, not a list — saving replaces
// the existing sermon item in this Section if one is already there. Title/
// Series is optional; title, passage, and preacher are the minimum useful
// identity for a compiled Sermon.
export async function saveSermon(
  liturgyId: string,
  sectionIndex: number,
  fields: SermonFields
): Promise<{ success: boolean; error?: string }> {
  if (!fields.title.trim() || !fields.passage.trim() || !fields.preacher.trim()) {
    return { success: false, error: "Sermon title, passage, and preacher are required." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to save the Sermon." };
  }

  const section = await getSectionContext(liturgyId, sectionIndex);
  if (!section) {
    return { success: false, error: "Unable to find that Section right now." };
  }

  if (section.sectionName !== "Sermon") {
    return { success: false, error: "Sermon can only be added to the Sermon Section." };
  }

  const title = fields.title.trim();
  const series = fields.series.trim();
  const preacher = fields.preacher.trim();
  const normalized: Omit<SermonItem, "id" | "type"> = {
    passage: normalizeTypography(fields.passage),
    title: normalizeTypography(title),
    series: series ? normalizeTypography(series) : undefined,
    preacher: normalizeTypography(preacher),
  };

  const existing = section.items.find((item): item is SermonItem => item.type === "sermon");

  const { success, error } = existing
    ? await updateSectionItem({ ...existing, ...normalized })
    : await insertSectionItem(section.id, {
        id: crypto.randomUUID(),
        type: "sermon",
        ...normalized,
      });

  if (!success) {
    console.error("[lib/liturgy/sermonActions/saveSermon]", error);
    return { success: false, error: "Unable to save the Sermon right now." };
  }
  return { success: true };
}
