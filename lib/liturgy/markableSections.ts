import type { TextMark } from "@/types/liturgy";

// Feature 25 (redesign-plan-v1.1.md §U): the Leader/Congregation dialogue
// treatment (indent + label) is scoped to the Sections that actually alternate
// speaking parts -- unlike Small Caps, which is a per-word typesetting
// convention (reverential capitalization of a divine name like "the LORD")
// that's meaningful on any Scripture text, not just these two Sections.
const DIALOGUE_MARK_SECTIONS = ["Call to Worship", "Prayer of Invocation"];

// Every Section that can hold a Selection at all gets Small Caps; dialogue
// Sections additionally get Congregation. Shared between the Reader (add
// time) and the Compile View (edit time) so the two can't drift.
export function getSelectionMarks(sectionName: string): Exclude<TextMark["type"], "bold">[] {
  return DIALOGUE_MARK_SECTIONS.includes(sectionName) ? ["congregation", "small_caps"] : ["small_caps"];
}

// Feature 25 (redesign-plan-v1.1.md §U's Minister piece) -- moved here
// 2026-07-21 (v2, library-level marking toolbar) from a SectionCard.tsx-local
// constant so the library-edit forms (FormulaForm) can share the exact same
// lookup instead of Compile-View-edit-time and library-edit-time drifting.
// Every other Section's Formula gets no marking toolbar at all --
// `**bold**` markdown remains the live option there, unchanged.
const FORMULA_MARK_SECTIONS: Record<string, Exclude<TextMark["type"], "bold">[]> = {
  "Assurance of Pardon": ["minister", "congregation"],
  Charge: ["minister"],
  "The Great Commission": ["minister"],
  Benediction: ["minister"],
  "Affirmation of Faith / Church Covenant": ["congregation", "small_caps"],
};

export function getFormulaMarks(sectionName: string): Exclude<TextMark["type"], "bold">[] {
  return FORMULA_MARK_SECTIONS[sectionName] ?? [];
}
