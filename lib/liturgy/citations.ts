export function buildCitation(book: string, chapter: number, verseNumbers: number[]): string {
  const sorted = [...verseNumbers].sort((a, b) => a - b);
  const isContiguous = sorted.every((n, i) => i === 0 || n === sorted[i - 1] + 1);

  if (sorted.length === 1) return `${book} ${chapter}:${sorted[0]}`;
  if (isContiguous) return `${book} ${chapter}:${sorted[0]}-${sorted[sorted.length - 1]}`;
  return `${book} ${chapter}:${sorted.join(",")}`;
}

export function buildSelectionText(verses: { number: number; text: string }[], verseNumbers: number[]): string {
  const selected = new Set(verseNumbers);
  return verses
    .filter((v) => selected.has(v.number))
    .sort((a, b) => a.number - b.number)
    .map((v) => v.text)
    .join(" ");
}

export function parseCitationVerses(citation: string, book: string, chapter: number): number[] | null {
  const prefix = `${book} ${chapter}:`;
  if (!citation.startsWith(prefix)) return null;

  const versesPart = citation.slice(prefix.length);
  if (versesPart.includes("-")) {
    const [start, end] = versesPart.split("-").map(Number);
    if (Number.isNaN(start) || Number.isNaN(end)) return null;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  const verses = versesPart.split(",").map(Number);
  return verses.some(Number.isNaN) ? null : verses;
}
