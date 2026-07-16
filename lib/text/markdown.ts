export interface TextSegment {
  text: string;
  bold: boolean;
}

// Congregational/unison lines are marked with **bold**; the leader's part is
// plain text — see founding-days-liturgy-compiler.md §3 and ui-rules.md's
// "Congregational/unison lines" typography entry.
export function parseBoldSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
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
