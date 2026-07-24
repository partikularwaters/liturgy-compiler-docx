// Computes the verse range to show for a citation's expanded-context hover
// preview. A citation's own verse range is shown as-is once it already
// meets the target size (no need to pad an already-substantial passage);
// a shorter citation (most commonly a single verse) is padded outward
// symmetrically until it reaches the target, shifting the whole window
// forward/backward instead of just clamping when one edge runs past the
// chapter's bounds -- e.g. a single-verse citation near the start of a
// chapter still gets a full-size window, just shifted later rather than
// truncated short.
export function computeContextWindow(
  verses: number[],
  chapterVerseCount: number,
  target: number = 7
): { start: number; end: number } {
  const rangeStart = Math.min(...verses);
  const rangeEnd = Math.max(...verses);
  const rangeSize = rangeEnd - rangeStart + 1;

  if (rangeSize >= target) {
    return { start: rangeStart, end: rangeEnd };
  }

  const deficit = target - rangeSize;
  const before = Math.floor(deficit / 2);
  const after = deficit - before;

  let start = rangeStart - before;
  let end = rangeEnd + after;

  if (start < 1) {
    end += 1 - start;
    start = 1;
  }
  if (end > chapterVerseCount) {
    start -= end - chapterVerseCount;
    end = chapterVerseCount;
  }

  return { start: Math.max(1, start), end: Math.min(chapterVerseCount, end) };
}
