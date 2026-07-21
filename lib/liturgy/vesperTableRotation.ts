import { parseLocalDate } from "@/lib/liturgy/lordsDay";

// v2 item 4: automated rotation-cycle assignment for the Liturgy of the
// Table's three recurring reading series (Handbook for Leading Worship,
// pg. 45-47, pasted by Madrid 2026-07-21 -- see docs/Handbook for Leading
// Worship (pg. 45-47).pdf). Previously tracked by Madrid manually
// cross-referencing the printed table by hand every time a Vesper liturgy
// was created (founding-days-liturgy-compiler.md's v3+ parking-lot note).
//
// Anchor decision (confirmed directly with Madrid 2026-07-21, since the
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

// The 12 rows of "The Lord's Discourse" column, top to bottom, exactly as
// printed. Two things in the source table are flagged here rather than
// silently corrected:
// - Row 7's citation was badly OCR-mangled in the source PDF ("Matthew
//   5–6:1–8, 6–34, 7:1–29"); rendered here as the plain chapter range
//   "Matthew 5–7" (the traditional bounds of the Sermon on the Mount) --
//   needs Madrid to confirm against the actual handbook page.
// - Rows 9 and 11 are both titled "The Parabolic Discourse" in the source
//   table (Matthew 13 and Matthew 24–25 respectively) -- likely a title
//   typo in the handbook itself (Matthew 24–25 is traditionally the
//   Olivet Discourse), reproduced as printed rather than silently
//   relabeled.
// - The handbook's own narrative text says the Matthean group has "six
//   readings," but the table lists only five (rows 7–11) before the single
//   Luke row -- reproduced as the table actually lists it (12 rows total),
//   not forced to match the "six" description.
const DISCOURSE_CYCLE: DiscourseReading[] = [
  { citation: "John 14–16", title: "Farewell Discourse", group: "johannine" },
  { citation: "John 3:1–21", title: "The New Birth", group: "johannine" },
  { citation: "John 4:1–42", title: "The Water of Life", group: "johannine" },
  { citation: "John 5:1–47", title: "The Divine Son", group: "johannine" },
  { citation: "John 6:22–69", title: "The Bread of Life", group: "johannine" },
  { citation: "John 8:12–58", title: "The Light of the World and the Good Shepherd", group: "johannine" },
  { citation: "Matthew 5–7", title: "The Sermon on the Mount", group: "matthean" },
  { citation: "Matthew 10:1–42", title: "The Mission Discourse", group: "matthean" },
  { citation: "Matthew 13", title: "The Parabolic Discourse", group: "matthean" },
  { citation: "Matthew 18", title: "The Community Discourse", group: "matthean" },
  { citation: "Matthew 24–25", title: "The Parabolic Discourse", group: "matthean" },
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
// Mar/Jun/Sep/Dec -> 2, per the calendar-quarter anchor Madrid confirmed.
function getDiscourseQuarterIndex(date: Date): 0 | 1 | 2 {
  return (date.getMonth() % 3) as 0 | 1 | 2;
}

// Feature-request (2026-07-21): the automated assignment above is a
// default, not a mandate -- the Compiler must still be able to choose a
// different reading from the fixed list by hand (e.g. a pastoral exception,
// or a correction if the calendar-quarter anchor ever drifts from Madrid's
// actual practice). Exported read-only so VesperReadingPanel.tsx can build
// its picker options directly from the same source of truth this file's
// automation already uses -- the two can never list different options than
// what the automation itself would pick from.
export const VESPER_DISCOURSE_OPTIONS: readonly DiscourseReading[] = DISCOURSE_CYCLE;
export const VESPER_WORDS_OF_INSTITUTION_OPTIONS: readonly string[] = WORDS_OF_INSTITUTION_CYCLE;
export const VESPER_CLOSING_OF_TABLE_OPTIONS: readonly string[] = Object.values(CLOSING_OF_TABLE_BY_GROUP);

// The three Sections this rotation actually assigns to -- shared so
// SectionCard.tsx's "+ Reading" button and its option-source lookup can't
// drift apart from each other.
export const VESPER_TABLE_SECTIONS = ["The Lord's Discourses", "Words of Institution", "Closing of the Table"];

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
