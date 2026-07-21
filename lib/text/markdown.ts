export interface TextSegment {
  text: string;
  bold: boolean;
}

// Congregational/unison lines are marked with **bold**; the leader's part is
// plain text — see founding-days-liturgy-compiler.md §3 and ui-rules.md's
// "Congregational/unison lines" typography entry.
export function parseBoldSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  // [\s\S] instead of `.` -- `.` never matches a newline in JS regex (the
  // `s`/dotAll flag that would fix that needs ES2018, this project targets
  // ES2017), so a bolded span crossing a line break (e.g. the Decalogue's
  // numbered commandments, each on its own line) could never find its
  // closing `**`, and the whole thing rendered as literal asterisks instead
  // of bold. Real bug, not a design choice: single-line/single-word bold
  // happened to work by accident since it never crossed a newline.
  const pattern = /\*\*([\s\S]+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }

  return segments.length > 0 ? segments : [{ text, bold: false }];
}
