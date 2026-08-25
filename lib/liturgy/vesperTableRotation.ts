import { parseLocalDate } from "@/lib/liturgy/lordsDay";

// Automated rotation-cycle assignment for the Liturgy of the
// Table's three recurring reading series (see docs/Handbook for Leading
// Worship (pg. 45-47).pdf). Previously tracked by manually
// cross-referencing the printed table by hand every time a Vesper liturgy
// was created.
//
// Anchor decision (explicitly confirmed against the handbook, since the
// handbook text itself never states which calendar month starts a new
// 3-month Discourse cycle -- guessing wrong here would assign the wrong
// Scripture reading to a real service): the Lord's Discourse's 12-reading
// cycle is anchored to calendar quarters. Row 1 (the Farewell Discourse)
// always falls on the 1st Sunday of January, April, July, or October;
// each quarter runs that row through row 12 across its three months.

export type DiscourseGroup = "johannine" | "matthean" | "kingdom";

export interface DiscourseReading {
  citation: string;
  title: string;
  group: DiscourseGroup;
}

// The 12 rows of "The Lord's Discourse" column, top to bottom. Confirmed
// 2026-08-24 (BA-007) against Madrid's own source document ("Vesper
// Service and Lord's Table.docx", not the OCR'd handbook PDF this file
// originally transcribed), which corrected three things:
// - Row 6 was missing a second citation -- the Good Shepherd half of the
//   reading (John 10:1–18) alongside the Light of the World half (John
//   8:12–58).
// - Row 7's citation was a placeholder guess ("Matthew 5–7") pending this
//   confirmation; the real reading deliberately skips 6:9–15 (the Lord's
//   Prayer passage), so it's not the plain chapter range.
// - Row 11 was titled "The Parabolic Discourse" (a duplicate of row 9),
//   flagged here as a likely typo -- the source document confirms it's
//   "The Olivet Discourse."
const DISCOURSE_CYCLE: DiscourseReading[] = [
  { citation: "John 14–16", title: "Farewell Discourse", group: "johannine" },
  { citation: "John 3:1–21", title: "The New Birth", group: "johannine" },
  { citation: "John 4:1–42", title: "The Water of Life", group: "johannine" },
  { citation: "John 5:1–47", title: "The Divine Son", group: "johannine" },
  { citation: "John 6:22–69", title: "The Bread of Life", group: "johannine" },
  { citation: "John 8:12–58, 10:1–18", title: "The Light of the World and the Good Shepherd", group: "johannine" },
  { citation: "Matthew 5:1–6:8, 6:16–34, 7:1–29", title: "The Sermon on the Mount", group: "matthean" },
  { citation: "Matthew 10:1–42", title: "The Mission Discourse", group: "matthean" },
  { citation: "Matthew 13", title: "The Parabolic Discourse", group: "matthean" },
  { citation: "Matthew 18", title: "The Community Discourse", group: "matthean" },
  { citation: "Matthew 24–25", title: "The Olivet Discourse", group: "matthean" },
  { citation: "Luke 12:1–59, 15:1–32", title: "The Kingdom and Discipleship", group: "kingdom" },
];

// Four-week monthly cycle, independent of the Discourse's 3-month cycle --
// resets every calendar month regardless of which Discourse quarter it
// falls in. Indexed by (Sunday-of-month - 1), clamped to index 3 for a 5th
// Sunday ("repeat the last Sunday's appointed texts").
const WORDS_OF_INSTITUTION_CYCLE = ["Matthew 26:17–30", "Mark 14:12–26", "Luke 22:7–21", "1 Corinthians 11:23–29"];

// Same four-week cycle shape as Words of Institution, same Sunday-of-month
// index -- a distinct reading series, not derived from WoI's citations.
const GREAT_COMMISSION_CYCLE = ["John 20:21", "Matthew 28:19–20", "Luke 24:46–48", "Acts 1:7–8"];

// The Closing of the Table's text is fixed per Discourse group, not per
// calendar position -- "determined not by the calendar but by whichever
// Lord's Discourse is appointed for that Sunday" (handbook's own words).
const CLOSING_OF_TABLE_BY_GROUP: Record<DiscourseGroup, string> = {
  johannine: "John 17",
  matthean: "Matthew 5:9–15",
  kingdom: "Luke 11:2–4",
};

export interface VesperTableReadings {
  discourse: DiscourseReading;
  wordsOfInstitution: string;
  closingOfTable: string;
  greatCommission: string;
}

// 1-5. Correct for any actual Sunday: a month's Sundays are always exactly
// 7 days apart, so ceil(dayOfMonth / 7) equals "the Nth Sunday of this
// month" regardless of which weekday the 1st falls on. Not meaningful for
// a non-Sunday service date (Feature 16's "Proceed anyway" liturgies) --
// this rotation is only ever invoked for Vesper, and a non-Sunday Vesper
// is already a flagged exception elsewhere, not specially handled here.
function getSundayOfMonth(date: Date): number {
  return Math.ceil(date.getDate() / 7);
}

// 0/1/2 -- which third of the recurring 3-month Discourse supercycle this
// calendar month belongs to. Jan/Apr/Jul/Oct -> 0, Feb/May/Aug/Nov -> 1,
// Mar/Jun/Sep/Dec -> 2, per the calendar-quarter anchor confirmed above.
function getDiscourseQuarterIndex(date: Date): 0 | 1 | 2 {
  return (date.getMonth() % 3) as 0 | 1 | 2;
}

// The automated assignment above is a
// default, not a mandate -- the Compiler must still be able to choose a
// different reading from the fixed list by hand (e.g. a pastoral exception,
// or a correction if the calendar-quarter anchor ever drifts from actual
// practice). Exported read-only so VesperReadingPanel.tsx can build
// its picker options directly from the same source of truth this file's
// automation already uses -- the two can never list different options than
// what the automation itself would pick from.
export const VESPER_DISCOURSE_OPTIONS: readonly DiscourseReading[] = DISCOURSE_CYCLE;
export const VESPER_WORDS_OF_INSTITUTION_OPTIONS: readonly string[] = WORDS_OF_INSTITUTION_CYCLE;
export const VESPER_CLOSING_OF_TABLE_OPTIONS: readonly string[] = Object.values(CLOSING_OF_TABLE_BY_GROUP);
// 2026-08-26: Great Commission Text gets the same treatment as Words of
// Institution (Madrid's explicit call -- both are fixed purely by
// Sunday-of-month, same 4-week shape, no reason to treat them differently).
export const VESPER_GREAT_COMMISSION_OPTIONS: readonly string[] = GREAT_COMMISSION_CYCLE;

// The four Sections this rotation actually assigns to -- shared so
// SectionCard.tsx's "+ Reading" button and its option-source lookup can't
// drift apart from each other.
export const VESPER_TABLE_SECTIONS = [
  "The Lord’s Discourses",
  "Words of Institution",
  "Closing of the Table",
  "The Great Commission",
];

export function getVesperTableReadings(serviceDate: string): VesperTableReadings {
  const date = parseLocalDate(serviceDate);
  const sundayOfMonth = Math.min(getSundayOfMonth(date), 4); // 5th Sunday repeats the 4th
  const cycleIndex = sundayOfMonth - 1; // 0-3

  const discourseIndex = getDiscourseQuarterIndex(date) * 4 + cycleIndex; // 0-11
  const discourse = DISCOURSE_CYCLE[discourseIndex];

  return {
    discourse,
    wordsOfInstitution: WORDS_OF_INSTITUTION_CYCLE[cycleIndex],
    closingOfTable: CLOSING_OF_TABLE_BY_GROUP[discourse.group],
    greatCommission: GREAT_COMMISSION_CYCLE[cycleIndex],
  };
}
