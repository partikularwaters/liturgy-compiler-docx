// v2 item 2: continuous-flow authoring. Word's native multi-column section
// layout already fills column 1 top-to-bottom, spills into column 2, then
// column 3, then automatically overflows onto a fresh page's column 1 --
// genuine continuous flow, no custom pagination engine. That replaces the
// old fixed per-Section page/column assignment (templates.sections[].page/
// .column, retained but no longer read here) entirely: a template only
// needs a single column-count constant, and each Section optionally forces
// an early jump to the next column via CompiledSection.columnBreakBefore
// (see setColumnBreakAction.ts).
//
// Both Morning and Vesper target 3 columns -- Morning's is the confirmed
// real layout (redesign-plan-v1.1.md §F); Vesper's is stated directly in
// build-plan.md's v2 item 2 ("this also resolves Vesper's 3-column
// layout"). Flagging this as the source for that number rather than a
// fresh guess -- worth re-checking once a real Vesper docx is produced.
export const TEMPLATE_COLUMN_COUNT: Record<string, number> = {
  "Morning Worship": 3,
  "Vesper Worship": 3,
};

export function getColumnCount(templateName: string): number {
  return TEMPLATE_COLUMN_COUNT[templateName] ?? 1;
}
