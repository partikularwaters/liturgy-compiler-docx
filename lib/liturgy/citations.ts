import { bookNameTagalog, parseVerseSpec } from "@/lib/bible/bookNamesTagalog";

// Shared by buildCitation and lib/selections/companionTranslation.ts (which
// needs the identical verse-range formatting when constructing the other
// language's citation string).
// Groups a verse selection into consecutive runs -- e.g. [1,2,3,7] becomes
// "1–3, 7", not a flat "1,2,3,7". The old version only checked contiguity
// across the WHOLE set, so a single non-contiguous verse anywhere (the
// common "vv 1-3, 7" case) disabled range-grouping entirely and also
// dropped the space after each comma.
export function formatVerseSpec(verseNumbers: number[]): string {
  const sorted = [...new Set(verseNumbers)].sort((a, b) => a - b);
  if (sorted.length === 0) return "";

  const segments: string[] = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const n = sorted[i];
    if (n === end + 1) {
      end = n;
      continue;
    }
    // En dash for a verse range, not a hyphen -- matches this project's
    // established typesetting convention (e.g. "Psalm 47:5–9").
    segments.push(start === end ? `${start}` : `${start}–${end}`);
    start = n;
    end = n;
  }
  return segments.join(", ");
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
  return parseVerseSpec(versesPart);
}
