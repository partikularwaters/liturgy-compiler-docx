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

export interface SelectionItem {
  id: string;
  type: "selection";
  text: string;
  citation: string;
}

export interface Formula {
  id: string;
  sectionName: string;
  name: string;
  defaultText: string;
}

export interface FormulaItem {
  id: string;
  type: "formula";
  formulaId: string;
  overrideText: string | null;
  visibility: "both" | "leader_only";
}

export interface VerbalCueItem {
  id: string;
  type: "verbal_cue";
  text: string;
  visibility: "both" | "leader_only";
}

export interface Prayer {
  id: string;
  sectionName: string;
  text: string;
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
}

export type Item = SelectionItem | FormulaItem | VerbalCueItem | PrayerItem | SermonItem;

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
