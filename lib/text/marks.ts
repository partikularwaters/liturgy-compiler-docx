import type { TextMark } from "@/types/liturgy";

export interface StyleRun {
  text: string;
  bold: boolean;
  smallCaps: boolean;
}

export interface MarkedSegment {
  // Only Congregation/Minister are mutually exclusive with each other (a
  // line can't be spoken by both at once) -- null for the default "Leader"
  // voice. Bold and Small Caps are both independent style overlays, carried
  // per-run below, since either may freely combine with this region's
  // speaker mark, with each other, or stand alone.
  //
  // Correction: Small Caps used to be grouped in with
  // Congregation/Minister as a third "exclusive" option. That's wrong --
  // Small Caps is a typographic convention (reverential capitalization of a
  // divine name), orthogonal to *who's speaking*, not a competing claim on
  // the same range. Treating it as exclusive meant marking a word inside an
  // existing Congregation block split that block into two separate blocks
  // with the word sandwiched between them -- and since Congregation renders
  // as its own visual block, the inline word between two blocks got forced
  // onto its own line by the surrounding block breaks. Moving Small Caps
  // into the same independent-overlay treatment Bold already has removes
  // this failure mode the same way promoting Bold did.
  mark: "congregation" | "minister" | null;
  runs: StyleRun[];
}

interface Range {
  start: number;
  end: number;
}

// Splits [start, end) of `text` into runs, each tagged with whether it falls
// inside a bold range and/or a small-caps range -- the two overlay sets are
// completely independent of each other, so a run can be bold-only,
// small-caps-only, both, or neither. Computed by collecting every boundary
// point either range set contributes within [start, end), then testing each
// resulting slice against both sets -- correct regardless of how the two
// sets interleave or nest.
function buildRuns(text: string, start: number, end: number, boldRanges: Range[], smallCapsRanges: Range[]): StyleRun[] {
  const points = new Set<number>([start, end]);
  for (const r of [...boldRanges, ...smallCapsRanges]) {
    const s = Math.max(r.start, start);
    const e = Math.min(r.end, end);
    if (e > s) {
      points.add(s);
      points.add(e);
    }
  }
  const bounds = [...points].sort((a, b) => a - b);

  const runs: StyleRun[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const segStart = bounds[i];
    const segEnd = bounds[i + 1];
    if (segEnd <= segStart) continue;
    runs.push({
      text: text.slice(segStart, segEnd),
      bold: boldRanges.some((r) => r.start <= segStart && r.end >= segEnd),
      smallCaps: smallCapsRanges.some((r) => r.start <= segStart && r.end >= segEnd),
    });
  }
  return runs.length > 0 ? runs : [{ text: text.slice(start, end), bold: false, smallCaps: false }];
}

// Splits `text` into segments by the mutually-exclusive Congregation/
// Minister marks (assumed non-overlapping with each other, sorted by
// start), then further splits each segment into Bold/Small-Caps runs using
// the two independent overlay mark sets, either of which may freely overlap
// a Congregation/Minister region or stand alone. Unmarked stretches come
// through with `mark: null`, which every renderer treats as the default
// "Leader" voice (flush left, no label) -- Leader is never actually stored
// as its own mark.
export function applyMarks(text: string, marks: TextMark[] | undefined): MarkedSegment[] {
  const all = marks ?? [];
  const exclusive = all.filter((m) => m.type === "congregation" || m.type === "minister").sort((a, b) => a.start - b.start);
  const toRanges = (type: TextMark["type"]): Range[] =>
    all
      .filter((m) => m.type === type)
      .map((m) => ({ start: m.start, end: m.end }))
      .sort((a, b) => a.start - b.start);
  const boldRanges = toRanges("bold");
  const smallCapsRanges = toRanges("small_caps");

  // Defensive: a mark's start/end can go stale relative to the text it's
  // attached to (e.g. the text was shortened by hand, outside the normal
  // edit path that keeps marks in sync via shiftMarksForEdit). Clamping to
  // [0, text.length] and dropping anything that's degenerate after clamping
  // means a stale offset renders as if that mark were simply absent, instead
  // of an empty or corrupted block.
  const regions: { start: number; end: number; mark: "congregation" | "minister" | null }[] = [];
  let cursor = 0;
  for (const mark of exclusive) {
    const start = Math.min(Math.max(mark.start, 0), text.length);
    const end = Math.min(Math.max(mark.end, 0), text.length);
    if (end <= start || end <= cursor) continue;
    const clippedStart = Math.max(start, cursor);
    if (clippedStart > cursor) {
      regions.push({ start: cursor, end: clippedStart, mark: null });
    }
    regions.push({ start: clippedStart, end, mark: mark.type as "congregation" | "minister" });
    cursor = end;
  }
  if (cursor < text.length) {
    regions.push({ start: cursor, end: text.length, mark: null });
  }
  if (regions.length === 0) {
    regions.push({ start: 0, end: text.length, mark: null });
  }

  const segments: MarkedSegment[] = regions.map((region) => ({
    mark: region.mark,
    runs: buildRuns(text, region.start, region.end, boldRanges, smallCapsRanges),
  }));

  // Congregation/Minister render as their own block (a forced line break
  // before and after). A lot of this project's real text pre-dates the
  // marking system and already has a manual "\n" at the same spot the mark
  // now falls on -- left alone, that's a second, redundant line break
  // stacked on top of the one the block display already gives, which reads
  // as a much bigger gap than intended. Trim exactly one boundary newline on
  // either side of a block-type mark; every other newline (including a
  // deliberate blank line the user actually typed) is untouched.
  for (let i = 0; i < segments.length; i++) {
    const isBlock = segments[i].mark === "congregation" || segments[i].mark === "minister";
    if (!isBlock) continue;

    const runs = segments[i].runs;
    if (runs.length > 0) {
      runs[0] = { ...runs[0], text: runs[0].text.replace(/^\n+/, "") };
      runs[runs.length - 1] = { ...runs[runs.length - 1], text: runs[runs.length - 1].text.replace(/\n+$/, "") };
    }
    if (i > 0) {
      const prevRuns = segments[i - 1].runs;
      if (prevRuns.length > 0) {
        const last = prevRuns.length - 1;
        prevRuns[last] = { ...prevRuns[last], text: prevRuns[last].text.replace(/\n+$/, "") };
      }
    }
    if (i < segments.length - 1) {
      const nextRuns = segments[i + 1].runs;
      if (nextRuns.length > 0) {
        nextRuns[0] = { ...nextRuns[0], text: nextRuns[0].text.replace(/^\n+/, "") };
      }
    }
  }

  return segments;
}

// Keeps existing marks intact across a text edit instead of wiping all of
// them, which is what every editor used to do on any keystroke -- a single
// typo fix could silently discard a whole paragraph's worth of marking.
// Finds the common prefix/suffix between old and new text to isolate the
// actual edited span, then: marks entirely before it are untouched, marks
// entirely after it shift by the length delta, and a mark overlapping the
// edited span grows/shrinks to keep covering it (dropped only if the edit
// consumes the mark entirely). Type-agnostic -- every mark type (including
// Bold and Small Caps, both real offset-based marks) shifts by this same
// rule, no special-casing needed.
export function shiftMarksForEdit(oldText: string, newText: string, marks: TextMark[]): TextMark[] {
  const minLen = Math.min(oldText.length, newText.length);
  let prefix = 0;
  while (prefix < minLen && oldText[prefix] === newText[prefix]) prefix++;

  let suffix = 0;
  while (
    suffix < minLen - prefix &&
    oldText[oldText.length - 1 - suffix] === newText[newText.length - 1 - suffix]
  ) {
    suffix++;
  }

  const oldEditEnd = oldText.length - suffix;
  const newEditEnd = newText.length - suffix;
  const delta = newText.length - oldText.length;

  const result: TextMark[] = [];
  for (const mark of marks) {
    if (mark.end <= prefix) {
      result.push(mark);
      continue;
    }
    if (mark.start >= oldEditEnd) {
      result.push({ ...mark, start: mark.start + delta, end: mark.end + delta });
      continue;
    }
    const start = mark.start >= oldEditEnd ? mark.start + delta : Math.min(mark.start, prefix);
    const end = mark.end > oldEditEnd ? mark.end + delta : newEditEnd;
    if (end > start) result.push({ start, end, type: mark.type });
  }

  return result;
}
