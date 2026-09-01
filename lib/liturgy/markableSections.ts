import type { TextMark } from "@/types/liturgy";

// Feature 25 (redesign-plan-v1.1.md §U): the Leader/Congregation dialogue
// treatment (indent + label) is scoped to the Sections that actually alternate
// speaking parts -- unlike Small Caps, which is a per-word typesetting
// convention (reverential capitalization of a divine name like "the LORD")
// that's meaningful on any Scripture text, not just these two Sections.
const DIALOGUE_MARK_SECTIONS = ["Call to Worship", "Prayer of Invocation", "Words of Thanksgiving"];

// Every Section that can hold a Selection at all gets Small Caps; dialogue
// Sections additionally get Congregation. Shared between the Reader (add
// time) and the Compile View (edit time) so the two can't drift.
export function getSelectionMarks(sectionName: string): Exclude<TextMark["type"], "bold">[] {
  return DIALOGUE_MARK_SECTIONS.includes(sectionName) ? ["congregation", "small_caps"] : ["small_caps"];
}

// Shared between the Compile View's edit-time toolbar and the library-edit
// forms (FormulaForm) so the two lookups can't drift apart.
// Every other Section's Formula gets no Congregation/Minister/Small-Caps
// toolbar at all -- Bold is still available everywhere via MarkEditor's
// Bold-only mode, since it's a real mark type, not scoped like these.
// Track B (2026-08-31): Charge/The Great Commission/Benediction removed --
// Formula was removed from those Sections' item_types entirely (see
// 20260831020000_section_item_types.sql), so they no longer need an entry
// here at all. Words of Thanksgiving added (Congregation only).
const FORMULA_MARK_SECTIONS: Record<string, Exclude<TextMark["type"], "bold">[]> = {
  "Assurance of Pardon": ["minister", "congregation"],
  "Words of Thanksgiving": ["congregation"],
};

// "Affirmation of Faith" now covers two identities sharing one Section name
// (2026-07-26 split -- see sectionTitle.ts) -- the Apostles' Creed (plain
// prose) and Vesper's Church Covenant (call-and-response). Both kinds get
// the same Congregation/Small-Caps toolbar as of Track B (2026-08-31,
// direct decision) -- marking is intentional even for the Apostles' Creed
// identity, even though it's rarely used there, rather than assuming plain
// prose never needs it.
export function getFormulaMarks(
  sectionName: string,
  kind?: "affirmation" | "covenant" | null
): Exclude<TextMark["type"], "bold">[] {
  if (sectionName === "Affirmation of Faith") {
    return ["congregation", "small_caps"];
  }
  return FORMULA_MARK_SECTIONS[sectionName] ?? [];
}
