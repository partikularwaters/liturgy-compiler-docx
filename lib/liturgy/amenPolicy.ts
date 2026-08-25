// Amen Rule policy (2026-08-25 revision) -- replaces Feature 27's original
// `isSongSlot` (a blunt pass-through of a Section's `dynamic_naming` flag,
// meaning "show the checkbox, default unchecked, everywhere dynamic naming
// happens to be true"). That conflated two unrelated things: "Affirmation
// of Faith" got the checkbox purely as a side effect of `dynamic_naming`
// being reused there for an unrelated Formula-identity toggle (see
// 20260726020000_split_affirmation_covenant_dynamic.sql), not because it's
// a real song slot, and the handbook (`Handbook for Leading Worship.docx`,
// verified against its own literal "The Amen Rule:" text per Section) shows
// the real rule isn't a uniform "off by default" -- some Sections default
// to expecting a sung Amen, some don't, and two genuinely have no Amen
// concept at all and should show no control whatsoever.
//
// Keyed by Section name so it applies identically regardless of which
// template the Section belongs to, or which item type (Song, or a Scripture
// Selection standing in for one) actually occupies the slot -- confirmed
// with Madrid that the question is "is there a song here, should it end in
// Amen," not "which add-flow was used" or "which item type is this."
export type AmenPolicy = "default-on" | "default-off" | "none";

const AMEN_POLICY: Record<string, AmenPolicy> = {
  // "Only if the Hymn or Psalm setting explicitly demands it; otherwise,
  // end without an Amen." -- handbook, Psalm of Adoration/Hymn of
  // Propitiation (identical wording for both; Vesper's Psalm of Adoration
  // explicitly defers to the same rule via "See page 9").
  "Psalm of Adoration": "default-off",
  "Hymn of Propitiation": "default-off",
  // "...must always end in 'Amen,' sung by the Congregation." -- handbook,
  // Psalm of Proclamation/Hymn of Dedication (Vesper's Psalm of Proclamation
  // defers to the same rule via "See page 18"). Still overridable: real
  // hymns/settings in the same slot genuinely differ (Feature 27's original
  // rationale for making this per-item, not a hardcoded lookup).
  "Psalm of Proclamation": "default-on",
  "Hymn of Dedication": "default-on",
  // Handbook states no rule at all for Vesper's Hymn of Communion --
  // Madrid's call: defaults off, same as the other unforced song slots.
  "Hymn of Communion": "default-off",
  // Every other Section name, including "Psalm of Thanksgiving" ("...
  // executed entirely without an Amen at the conclusion" -- a strict
  // exclusion, not just a default-off that could be turned on) and
  // "Affirmation of Faith" (not a real song slot at all -- the handbook has
  // no Amen Rule for it whatsoever), falls through to "none" below: no
  // checkbox rendered anywhere, on any placement or edit path.
};

export function getAmenPolicy(sectionName: string): AmenPolicy {
  return AMEN_POLICY[sectionName] ?? "none";
}
