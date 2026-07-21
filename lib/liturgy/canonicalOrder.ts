import { canon } from "@/lib/bible/canon";
import { parseCitationReference, toEnglishCitation } from "@/lib/bible/bookNamesTagalog";

// Direct feedback (2026-07-22): Library lists (Formulas, Prayers, Existing
// Scripture) were sorted alphabetically by Section name, which reads as
// arbitrary against the actual service -- Madrid wants the Order of Worship's
// own sequence instead. Merged from both templates' real `templates.sections`
// order (Morning's 18 + Vesper's 19), interleaved where a Section only
// exists in one template, since library entries aren't template-specific.
// Songs/Affirmations/Guides are intentionally NOT reordered by this --
// alphabetical stays more useful there per Madrid's own call.
export const SECTION_ORDER: string[] = [
  "Call to Worship",
  "Prayer of Invocation",
  "Psalm of Adoration",
  "Righteousness of God",
  "Call to Confession",
  "Confession of Sin",
  "Prayer for Pardon",
  "Hymn of Propitiation",
  "Assurance of Pardon",
  "Words of Thanksgiving",
  "Prayer for Illumination",
  "Psalm of Proclamation",
  "Sermon",
  "The Lord's Discourses",
  "Words of Institution",
  "Prayer before Communion",
  "Hymn of Communion",
  "The Lord's Table",
  "Closing of the Table",
  "Hymn of Dedication",
  "Affirmation of Faith",
  "Affirmation of Faith / Church Covenant",
  "Offertory & Thanksgiving",
  "Offertory Call",
  "Pastoral Prayer",
  "Prayer Meeting",
  "Charge",
  "The Great Commission",
  "Benediction",
  "Doxology",
];

// Unrecognized Section names (shouldn't happen against real data, but a
// stale/renamed Section is possible) sort after every known one rather than
// crashing or silently landing first.
export function getSectionOrderIndex(sectionName: string): number {
  const index = SECTION_ORDER.indexOf(sectionName);
  return index === -1 ? SECTION_ORDER.length : index;
}

const CANON_INDEX: Map<string, number> = new Map(canon.map((book, index) => [book.name, index]));

// A citation's canonical OT/NT position, regardless of whether it's stored
// in English or Filipino -- normalizes via the same toEnglishCitation()
// already used for the BGLinks widget, then looks up the book's position in
// the standard 66-book canon (lib/bible/canon.ts). Falls back to the end for
// anything unrecognized (a malformed citation), same defensive pattern as
// getSectionOrderIndex above.
export function getCitationCanonicalIndex(citation: string): number {
  const english = toEnglishCitation(citation);
  const bookName = [...CANON_INDEX.keys()].find((name) => english.startsWith(`${name} `));
  return bookName ? CANON_INDEX.get(bookName)! : CANON_INDEX.size;
}

// Full OT/NT canonical comparator -- book position first, then chapter,
// then first verse, so citations within the same book still read in
// Scripture order (e.g. Psalm 23 before Psalm 100) rather than just
// clustering by book with no further sequence.
export function compareCitations(a: string, b: string): number {
  const bookDelta = getCitationCanonicalIndex(a) - getCitationCanonicalIndex(b);
  if (bookDelta !== 0) return bookDelta;

  const parsedA = parseCitationReference(toEnglishCitation(a));
  const parsedB = parseCitationReference(toEnglishCitation(b));
  if (!parsedA || !parsedB) return a.localeCompare(b);

  const chapterDelta = parsedA.chapter - parsedB.chapter;
  if (chapterDelta !== 0) return chapterDelta;

  return (parsedA.verses[0] ?? 0) - (parsedB.verses[0] ?? 0);
}
