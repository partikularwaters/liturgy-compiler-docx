// Cross-template Scripture Library sharing, without restructuring either
// template's Sections. Morning's "Offertory & Thanksgiving" was split into
// "Offertory Call" (Selection/Verbal Cue) + "Psalm of Thanksgiving" (Song)
// back in Feature 28; Vesper never got the same split and still uses one
// combined "Offertory & Thanksgiving" Section. `scripture_selections` is
// scoped by exact Section name (one column, no tags table -- unlike Song's
// song_section_tags), so a Scripture Selection saved under Morning's
// "Offertory Call" was invisible to Vesper's "Offertory & Thanksgiving"
// picker and vice versa -- the same real content, duplicated across two
// Section names. Direct product decision (2026-09-05): bridge this with a
// shared "library group" instead of reshaping Vesper's Sections to match
// Morning's. (Song does NOT have this problem -- song_section_tags already
// lets a Song carry more than one Section tag directly, confirmed with the
// project owner, so this module is scoped to Scripture Selections only.)
//
// A group is scoped to Scripture-Library-sharing only -- it has no effect
// on item_types whitelisting, canonicalOrder, readiness predicates, or
// anything else that reasons about a Section by its own real name.
const LIBRARY_SECTION_GROUPS: Record<string, string> = {
  "Offertory Call": "Offertory",
  "Offertory & Thanksgiving": "Offertory",
};

export function getLibraryGroup(sectionName: string): string {
  return LIBRARY_SECTION_GROUPS[sectionName] ?? sectionName;
}

export function sectionsShareLibrary(a: string, b: string): boolean {
  return getLibraryGroup(a) === getLibraryGroup(b);
}
