// Track B (2026-08-31): Sections where 2+ Selections merging into one
// flowing paragraph is opt-in (CompiledSection.mergeSelections) rather than
// automatic. The Lord's Discourses is forward-looking -- it currently only
// ever holds its single rotation-assigned reading, but the toggle is ready
// if that ever changes. Every other Section (Assurance of Pardon included)
// keeps its old, unconditional "2+ Selections always merge" behavior,
// untouched -- shared by SectionCard.tsx and prepareSectionRender.ts so the
// two can't drift (same reasoning as this file's sibling constants).
export const NATURAL_FLOW_TOGGLE_SECTIONS = ["Righteousness of God", "Call to Confession", "The Lord’s Discourses"];
