// Wraps (or unwraps) the selected range in `**...**` -- the original,
// universal congregational-response convention (Feature 11/12) that every
// Selection/Formula/Verbal Cue already renders via parseBoldSegments,
// independent of the newer Leader/Congregation/Minister/Small-Caps marking
// toolbar, which is deliberately scoped to only a few Sections. This is what
// lets a Section with no marking toolbar (e.g. "Righteousness of God") still
// mark a congregational response.
export function toggleBoldSelection(text: string, start: number, end: number): string {
  if (start === end) return text;
  const selected = text.slice(start, end);
  const isBold = selected.startsWith("**") && selected.endsWith("**") && selected.length >= 4;
  const replacement = isBold ? selected.slice(2, -2) : `**${selected}**`;
  return text.slice(0, start) + replacement + text.slice(end);
}
