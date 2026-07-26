import { supabase } from "@/lib/db/supabase";

export interface PrayerSongSubmission {
  kind: "prayer" | "song";
  id: string;
  sectionName: string;
  forkedFromId: string | null;
  // Display strings only -- the diff/review screen doesn't need every raw
  // column, just a human-readable "before" and "after" per entry.
  originalDisplay: string | null;
  submittedDisplay: string;
}

export interface FormulaSubmission {
  id: string;
  sectionName: string;
  name: string;
  display: string;
}

export interface LibrarySubmissions {
  prayersAndSongs: PrayerSongSubmission[];
  formulas: FormulaSubmission[];
}

// Formula proposals never have a forked_from_id (Formula submissions are
// always brand-new proposals, never edits of a curated entry -- see
// formulaActions.ts's own comment) so they never get a diff, only Prayer/
// Song do.
export async function getLibrarySubmissions(): Promise<LibrarySubmissions> {
  const [prayersResult, songsResult, formulasResult] = await Promise.all([
    supabase.from("prayers").select("id, section_name, text, forked_from_id").eq("status", "submitted"),
    supabase.from("songs").select("id, section_name, title, attribution, year_published, notes, forked_from_id").eq("status", "submitted"),
    supabase.from("formulas").select("id, section_name, name, default_text").eq("status", "submitted"),
  ]);

  if (prayersResult.error) console.error("[lib/curatorInbox/getLibrarySubmissions]", prayersResult.error.message);
  if (songsResult.error) console.error("[lib/curatorInbox/getLibrarySubmissions]", songsResult.error.message);
  if (formulasResult.error) console.error("[lib/curatorInbox/getLibrarySubmissions]", formulasResult.error.message);

  const prayerRows = prayersResult.data ?? [];
  const originalPrayerIds = prayerRows.map((r) => r.forked_from_id).filter((id): id is string => !!id);
  const { data: originalPrayers } = originalPrayerIds.length
    ? await supabase.from("prayers").select("id, text").in("id", originalPrayerIds)
    : { data: [] as { id: string; text: string }[] };
  const originalPrayerById = new Map((originalPrayers ?? []).map((p) => [p.id, p.text]));

  const songRows = songsResult.data ?? [];
  const originalSongIds = songRows.map((r) => r.forked_from_id).filter((id): id is string => !!id);
  const { data: originalSongs } = originalSongIds.length
    ? await supabase.from("songs").select("id, title, attribution, year_published, notes").in("id", originalSongIds)
    : { data: [] as { id: string; title: string; attribution: string | null; year_published: string | null; notes: string | null }[] };
  const originalSongById = new Map((originalSongs ?? []).map((s) => [s.id, s]));

  const songDisplay = (s: { title: string; attribution: string | null; year_published: string | null; notes: string | null }): string =>
    [`Title: ${s.title}`, s.attribution && `Attribution: ${s.attribution}`, s.year_published && `Year: ${s.year_published}`, s.notes && `Notes: ${s.notes}`]
      .filter(Boolean)
      .join("\n");

  const prayersAndSongs: PrayerSongSubmission[] = [
    ...prayerRows.map((r) => ({
      kind: "prayer" as const,
      id: r.id,
      sectionName: r.section_name,
      forkedFromId: r.forked_from_id,
      originalDisplay: r.forked_from_id ? originalPrayerById.get(r.forked_from_id) ?? null : null,
      submittedDisplay: r.text,
    })),
    ...songRows.map((r) => ({
      kind: "song" as const,
      id: r.id,
      sectionName: r.section_name,
      forkedFromId: r.forked_from_id,
      originalDisplay: r.forked_from_id
        ? (() => {
            const original = originalSongById.get(r.forked_from_id);
            return original ? songDisplay(original) : null;
          })()
        : null,
      submittedDisplay: songDisplay(r),
    })),
  ];

  const formulas: FormulaSubmission[] = (formulasResult.data ?? []).map((f) => ({
    id: f.id,
    sectionName: f.section_name,
    name: f.name,
    display: f.default_text,
  }));

  return { prayersAndSongs, formulas };
}
