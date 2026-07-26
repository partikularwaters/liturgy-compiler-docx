import { supabase } from "@/lib/db/supabase";

export interface BinnedItem {
  table: "prayers" | "songs" | "formulas";
  id: string;
  sectionName: string;
  display: string;
}

// Items whose owning account was deleted (is_binned=true) -- sit here
// indefinitely until a Curator explicitly restores (adopts into the shared
// Library) or permanently deletes, same as decision #9's chosen "normal
// Recycle Bin" behavior.
export async function getBinnedItems(): Promise<BinnedItem[]> {
  const [prayers, songs, formulas] = await Promise.all([
    supabase.from("prayers").select("id, section_name, text").eq("is_binned", true),
    supabase.from("songs").select("id, section_name, title, attribution").eq("is_binned", true),
    supabase.from("formulas").select("id, section_name, name, default_text").eq("is_binned", true),
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
