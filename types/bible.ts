export type HighlightColor = "accent" | "success" | "info" | "warning";

export type Translation = "AB1905" | "BSB";

export interface VerseHighlight {
  book: string;
  chapter: number;
  verse: number;
  color: HighlightColor;
}

export interface BibleVerse {
  number: number;
  text: string;
}

export interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

export interface BibleBook {
  name: string;
  chapterCount: number;
}

export type VerseHighlights = Record<number, HighlightColor>;
