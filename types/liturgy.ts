export type LiturgyTemplateId = "morning" | "vesper";

export interface LiturgyTemplate {
  id: LiturgyTemplateId;
  name: string;
}

export interface CreatedLiturgy {
  id: string;
  serviceDate: string;
  lordsDayNumber: number;
}

export interface TemplateSection {
  name: string;
  posture: "standing" | "seated";
  dynamic_naming: boolean;
  // Feature 17: 2-page/3-column Compile View placement. Optional because
  // only Morning Worship has a defined Section->column assignment so far
  // (redesign-plan-v1.1.md §F) -- Vesper's is deferred to Feature 18, so its
  // Sections omit these and fall back to the flat single-column layout.
  page?: number;
  column?: number;
  // Feature 23: which "Add X" buttons this Section offers, per
  // redesign-plan-v1.1.md §Y. Optional/defensive -- a missing item_types
  // means "show every Add button" (the pre-Feature-23 behavior), so a
  // Section that somehow lacks this field never silently loses its Add
  // buttons. Values match Item['type']; an empty array means no Add buttons
  // at all (e.g. Vesper's heading-only Sections). Governs adding new items
  // only -- an already-placed item never disappears just because its type
  // isn't in the current whitelist.
  item_types?: Item["type"][];
}

// Feature 25: Leader/Congregation/Minister/Small-Caps span tagging
// (redesign-plan-v1.1.md §U) -- structured spans over an item's own `text`,
// never baked into the raw saved string, so un-marking is lossless. `start`/
// `end` are character offsets into that item's `text` (0-indexed,
// end-exclusive, same convention as String.slice). Assumed non-overlapping
// and sorted by `start` -- lib/text/marks.ts's applyMarks() depends on this.
export interface TextMark {
  start: number;
  end: number;
  type: "leader" | "congregation" | "minister" | "small_caps";
}

// Trinitarian Seal -- appends a fixed, bolded closing line ("In the name of
// the Father...") immediately after an item's own displayed text, instead of
// requiring it to be typed/retyped by hand. Not tied to any one item type --
// Benediction seals a Selection, Assurance of Pardon seals the Absolution
// Formula -- any item type that can meaningfully end a Section may `extends`
// this. See lib/liturgy/trinitarianSeal.ts's TRINITARIAN_SEAL_SECTIONS for
// which Sections allow it; resolveItemText.ts appends it generically for
// whichever item type actually carries the field.
export interface TrinitarianSealable {
  trinitarianSeal?: "en" | "fil";
}

export interface SelectionItem extends TrinitarianSealable {
  id: string;
  type: "selection";
  text: string;
  citation: string;
  // Feature 27: Amen Rule -- does this song-slot piece customarily end in a
  // sung Amen. Only meaningful for Selections placed into a dynamic-naming
  // ("Psalm/Hymn of ...") Section; Leader Guide only, never the Bulletin
  // (redesign-plan-v1.1.md §X). Optional/defensive, same pattern as
  // item_types -- a missing value means "no," the common case for non-song
  // Selections.
  amenExpected?: boolean;
  // Feature 25: only meaningful on Call to Worship / Prayer of Invocation
  // Selections (redesign-plan-v1.1.md §U) -- absent/empty means "render
  // exactly as before," so every pre-existing Selection is unaffected.
  marks?: TextMark[];
  // v2 (BSB): which language this Selection's citation/text is actually in
  // -- "fil" (AB1905) or "en" (BSB). Absent means "fil", the correct default
  // for every Selection saved before this field existed. Display logic
  // (resolveItemText.ts, SectionCard.tsx, prepareSectionRender.ts) keys off
  // this instead of blanket Filipino-izing every citation, since an "en"
  // Selection's citation must stay in English.
  translation?: "fil" | "en";
}

export interface Formula {
  id: string;
  sectionName: string;
  name: string;
  defaultText: string;
  // v2: library-level marking -- pre-marking a Formula here (e.g. Assurance
  // of Pardon's Absolution dialogue) carries these marks onto every future
  // placement as a starting point (see addFormulaAction.ts), instead of
  // remarking from scratch each time. Offsets into `defaultText`, same
  // convention as FormulaItem.marks. Absent/empty means "no marks," the
  // correct default for every Formula saved before this field existed.
  marks?: TextMark[];
}

export interface FormulaItem extends TrinitarianSealable {
  id: string;
  type: "formula";
  formulaId: string;
  overrideText: string | null;
  visibility: "both" | "leader_only";
  // Feature 25: Minister piece + Vesper's Church Covenant portion --
  // offsets into the *displayed* text (overrideText ?? the library
  // Formula's defaultText), same convention as SelectionItem.marks.
  marks?: TextMark[];
}

export interface VerbalCueItem {
  id: string;
  type: "verbal_cue";
  text: string;
  visibility: "both" | "leader_only";
  // Feature 26: "Rubric style" (redesign-plan-v1.1.md §N-T/§V) -- an
  // instructional aside rather than spoken narration, e.g. Confession of
  // Sin's (Morning) closing cue. Rendered Sentence case + italic instead of
  // the default treatment. Optional/defensive, same pattern as item_types --
  // a missing value means "not a rubric," the common case.
  rubric?: boolean;
}

export interface Prayer {
  id: string;
  sectionName: string;
  text: string;
  // Feature 27: Prayer Guides -- 'guide' entries are structural reference
  // material (per redesign-plan-v1.1.md §W's checklists) shown next to
  // "Add Prayer" on the Sections that need one, never placeable as an
  // actual liturgy item themselves. Defaults to 'prayer' at the DB level
  // (migration 20260716010000_prayer_guides.sql), so every pre-existing row
  // keeps its current meaning.
  kind: "prayer" | "guide";
}

export interface PrayerItem {
  id: string;
  type: "prayer";
  prayerId: string;
}

export interface SermonItem {
  id: string;
  type: "sermon";
  passage: string;
}

// Feature 21: shared "Songs" library (redesign-plan-v1.1.md §L), tagged by
// kind like Prayer's Feature 27 addition. Replaces Selection entirely in
// the 5 dynamic song Sections. `attribution` means versification for a
// psalm, author for a hymn -- one field, meaning depends on `kind`.
export interface Song {
  id: string;
  sectionName: string;
  kind: "psalm" | "hymn";
  title: string;
  attribution: string | null;
  yearPublished: string | null;
  notes: string | null;
}

export interface SongItem {
  id: string;
  type: "song";
  songId: string;
}

// Feature 20: "Existing Selections" library -- auto-populated by
// addSelectionAction whenever a Selection is placed into a Section,
// independent of whether the parent liturgy is ever saved. Browsable on
// /library, not editable there (it's a reference cache, not a source of
// truth the way Formula/Prayer are).
export interface ScriptureSelection {
  id: string;
  sectionName: string;
  citation: string;
  text: string;
  // v2 (BSB): "fil" (AB1905) or "en" (BSB) -- a Filipino and English entry
  // for the same passage are a linked pair (matched by canonical verse
  // reference, not a foreign key), not duplicates.
  translation: "fil" | "en";
  // v2: library-level marking -- see Formula.marks; offsets into `text`.
  marks?: TextMark[];
}

export type Item = SelectionItem | FormulaItem | VerbalCueItem | PrayerItem | SermonItem | SongItem;

export interface CompiledSection extends TemplateSection {
  items: Item[];
}

export interface LiturgySummary {
  id: string;
  templateName: string;
  serviceDate: string;
  lordsDayNumber: number;
  sermonPassage: string | null;
}

export interface CompiledLiturgy {
  id: string;
  templateName: string;
  serviceDate: string;
  lordsDayNumber: number;
  sections: CompiledSection[];
}
