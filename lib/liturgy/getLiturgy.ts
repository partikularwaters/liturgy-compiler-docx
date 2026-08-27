import { supabase } from "@/lib/db/supabase";
import { getItemsForSections } from "@/lib/liturgy/sectionItems";
import type { CompiledLiturgy, CompiledSection, TemplateSection } from "@/types/liturgy";

export async function getLiturgy(id: string): Promise<CompiledLiturgy | null> {
  // Same missing-column safety as the sections query below --
  // 20260722010000_end_note_and_cue_language.sql is a DDL migration applied
  // manually (no direct Postgres connection in this environment); until
  // then, fall back to the true default rather than failing the whole query.
  let liturgy: {
    id: string;
    service_date: string;
    lords_day_number: number;
    templates: unknown;
    show_end_note?: boolean;
    status?: "draft" | "ready";
    ready_at?: string | null;
  } | null = null;
  {
    const { data, error } = await supabase
      .from("liturgies")
      .select("id, service_date, lords_day_number, show_end_note, status, ready_at, templates(name, sections)")
      .eq("id", id)
      .single();

    if (error?.message.includes("show_end_note")) {
      const fallback = await supabase
        .from("liturgies")
        .select("id, service_date, lords_day_number, status, ready_at, templates(name, sections)")
        .eq("id", id)
        .single();
      if (fallback.error || !fallback.data) {
        console.error("[lib/liturgy/getLiturgy]", fallback.error?.message);
        return null;
      }
      liturgy = fallback.data;
    } else if (error || !data) {
      console.error("[lib/liturgy/getLiturgy]", error?.message);
      return null;
    } else {
      liturgy = data;
    }
  }

  // 20260721030000_column_break_before.sql and 20260722020000_
  // show_prayer_guide.sql are DDL migrations applied manually (this
  // project has no direct Postgres connection -- see those files' own
  // notes); until applied, selecting either new column outright would fail
  // this entire query (a missing-column error, not a per-row gap), taking
  // the whole Compile View and both exports down with it -- unacceptable
  // given PDF export must stay working/untouched in the meantime. Try with
  // both new columns first; on exactly that failure, retry without them and
  // default every Section to "no break" / "show the guide," identical to
  // every liturgy's current behavior.
  let sectionRows:
    | { id: string; template_section_index: number; column_break_before?: boolean; show_prayer_guide?: boolean }[]
    | null = null;
  {
    const { data, error } = await supabase
      .from("sections")
      .select("id, template_section_index, column_break_before, show_prayer_guide")
      .eq("liturgy_id", id)
      .order("template_section_index");

    if (error?.message.includes("column_break_before") || error?.message.includes("show_prayer_guide")) {
      const fallback = await supabase
        .from("sections")
        .select("id, template_section_index")
        .eq("liturgy_id", id)
        .order("template_section_index");
      if (fallback.error || !fallback.data) {
        console.error("[lib/liturgy/getLiturgy]", fallback.error?.message);
        return null;
      }
      sectionRows = fallback.data as { id: string; template_section_index: number }[];
    } else if (error || !data) {
      console.error("[lib/liturgy/getLiturgy]", error?.message);
      return null;
    } else {
      sectionRows = data;
    }
  }

  const itemsBySection = await getItemsForSections(sectionRows.map((row) => row.id));

  // BA-004: fail closed rather than silently compiling (and exporting) a
  // liturgy that's missing items because their read failed, not because
  // those Sections are genuinely empty -- see sectionItems.ts's comment.
  if (itemsBySection === null) {
    console.error("[lib/liturgy/getLiturgy] failed to load items for liturgy", id);
    return null;
  }

  const template = liturgy.templates as unknown as { name: string; sections: TemplateSection[] };
  const sections: CompiledSection[] = sectionRows.map((row) => ({
    ...template.sections[row.template_section_index],
    items: itemsBySection.get(row.id) ?? [],
    columnBreakBefore: row.column_break_before ?? false,
    showPrayerGuide: row.show_prayer_guide ?? true,
  }));

  return {
    id: liturgy.id,
    templateName: template.name,
    serviceDate: liturgy.service_date,
    lordsDayNumber: liturgy.lords_day_number,
    sections,
    showEndNote: liturgy.show_end_note ?? true,
    status: liturgy.status ?? "draft",
    readyAt: liturgy.ready_at ?? null,
  };
}
