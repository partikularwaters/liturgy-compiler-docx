import type { TextMark } from "@/types/liturgy";

export interface MarkedSegment {
  text: string;
  mark: TextMark["type"] | null;
}

// Feature 25: splits `text` into segments by `marks` (assumed non-overlapping,
// sorted by start -- MarkedTextEditor.ts is responsible for keeping them
// that way). Unmarked stretches come through with `mark: null`, which every
// renderer treats as the default "Leader" voice (flush left, no label) --
// Leader is never actually stored as its own mark type since it's the
// implicit default, only Congregation/Minister/Small Caps need tagging.
export function applyMarks(text: string, marks: TextMark[] | undefined): MarkedSegment[] {
  if (!marks || marks.length === 0) {
    return [{ text, mark: null }];
  }

  const sorted = [...marks].sort((a, b) => a.start - b.start);
  const segments: MarkedSegment[] = [];
  let cursor = 0;

  for (const mark of sorted) {
    if (mark.start > cursor) {
      segments.push({ text: text.slice(cursor, mark.start), mark: null });
    }
    segments.push({ text: text.slice(mark.start, mark.end), mark: mark.type });
    cursor = mark.end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), mark: null });
  }

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
    segments[i] = { ...segments[i], text: segments[i].text.replace(/^\n+|\n+$/g, "") };
    if (i > 0) segments[i - 1] = { ...segments[i - 1], text: segments[i - 1].text.replace(/\n+$/, "") };
    if (i < segments.length - 1) {
      segments[i + 1] = { ...segments[i + 1], text: segments[i + 1].text.replace(/^\n+/, "") };
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
// consumes the mark entirely).
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
