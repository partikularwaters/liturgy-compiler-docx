import { bookNameTagalog } from "@/lib/bible/bookNamesTagalog";

// Shared by buildCitation and lib/selections/companionTranslation.ts (which
// needs the identical verse-range formatting when constructing the other
// language's citation string).
export function formatVerseSpec(verseNumbers: number[]): string {
  const sorted = [...verseNumbers].sort((a, b) => a - b);
  const isContiguous = sorted.every((n, i) => i === 0 || n === sorted[i - 1] + 1);
  if (sorted.length === 1) return `${sorted[0]}`;
  // En dash for a verse range, not a hyphen -- matches this project's
  // established typesetting convention (e.g. "Psalm 47:5–9").
  if (isContiguous) return `${sorted[0]}–${sorted[sorted.length - 1]}`;
  return sorted.join(",");
}

// v2 (BSB): translation defaults to "fil" so every pre-BSB call site (the
// Reader was hardcoded to AB1905 until now) keeps building Tagalog citations
// unchanged. "en" builds the plain English/canon.ts book name instead.
export function buildCitation(
  book: string,
  chapter: number,
  verseNumbers: number[],
  translation: "fil" | "en" = "fil"
): string {
  const displayBook = translation === "fil" ? bookNameTagalog(book) : book;
  return `${displayBook} ${chapter}:${formatVerseSpec(verseNumbers)}`;
}

export function buildSelectionText(verses: { number: number; text: string }[], verseNumbers: number[]): string {
  const selected = new Set(verseNumbers);
  return verses
    .filter((v) => selected.has(v.number))
    .sort((a, b) => a.number - b.number)
    .map((v) => v.text)
    .join(" ");
}

export function parseCitationVerses(
  citation: string,
  book: string,
  chapter: number,
  translation: "fil" | "en" = "fil"
): number[] | null {
  const displayBook = translation === "fil" ? bookNameTagalog(book) : book;
  const prefix = `${displayBook} ${chapter}:`;
  if (!citation.startsWith(prefix)) return null;

  const versesPart = citation.slice(prefix.length);
  // Accept both the en dash buildCitation now writes and a plain hyphen, so
  // citations saved before that change (or typed manually) still parse.
  if (versesPart.includes("–") || versesPart.includes("-")) {
    const [start, end] = versesPart.split(/[–-]/).map(Number);
    if (Number.isNaN(start) || Number.isNaN(end)) return null;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  const verses = versesPart.split(",").map(Number);
  return verses.some(Number.isNaN) ? null : verses;
}
