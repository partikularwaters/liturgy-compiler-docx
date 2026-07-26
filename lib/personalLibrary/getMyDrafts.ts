import { supabase } from "@/lib/db/supabase";

export interface MyDraft {
  table: "prayers" | "songs" | "formulas";
  id: string;
  sectionName: string;
  display: string;
}

// A Compiler's own drafts -- Prayer/Song forks created via the Personal
// Library checkbox (addPrayerAction.ts/addSongAction.ts) and any new
// Formula proposals, all still status "draft" (not yet submitted for
// Curator review). This is the minimal surface needed to submit a draft --
// full Shared/My Library picker tabs inside Compile View is its own,
// separate, not-yet-built task.
export async function getMyDrafts(userId: string): Promise<MyDraft[]> {
  const [prayers, songs, formulas] = await Promise.all([
    supabase.from("prayers").select("id, section_name, text").eq("owner_id", userId).eq("status", "draft"),
    supabase.from("songs").select("id, section_name, title, attribution").eq("owner_id", userId).eq("status", "draft"),
    supabase.from("formulas").select("id, section_name, name, default_text").eq("owner_id", userId).eq("status", "draft"),
  ]);

  return [
    ...(prayers.data ?? []).map((p) => ({ table: "prayers" as const, id: p.id, sectionName: p.section_name, display: p.text })),
    ...(songs.data ?? []).map((s) => ({
      table: "songs" as const,
      id: s.id,
      sectionName: s.section_name,
      display: s.attribution ? `${s.title} (${s.attribution})` : s.title,
    })),
    ...(formulas.data ?? []).map((f) => ({ table: "formulas" as const, id: f.id, sectionName: f.section_name, display: `${f.name}: ${f.default_text}` })),
  ];
}
