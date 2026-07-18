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
export function getSelectionMarks(sectionName: string): TextMark["type"][] {
  return DIALOGUE_MARK_SECTIONS.includes(sectionName) ? ["congregation", "small_caps"] : ["small_caps"];
}
