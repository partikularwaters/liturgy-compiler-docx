// Tagalog book names for the Ang Dating Biblia (1905) canon -- the Reader is
// hardcoded to AB1905 (no translation switcher exists, per Feature 02's
// scope decision), so every citation built from it should be named in
// Tagalog by default, matching this project's Tagalog-first/English-second
// convention -- not the English keys `lib/bible/canon.ts` uses internally
// for chapter/verse lookups and highlight storage. Keyed by the canonical
// English name so callers don't need a second identifier system; falls back
// to the English name if a book is somehow missing (defensive, shouldn't
// happen since this covers all 66).
export const BOOK_NAMES_TAGALOG: Record<string, string> = {
  Genesis: "Genesis",
  Exodus: "Exodo",
  Leviticus: "Levitico",
  Numbers: "Mga Bilang",
  Deuteronomy: "Deuteronomio",
  Joshua: "Josue",
  Judges: "Mga Hukom",
  Ruth: "Ruth",
  "1 Samuel": "1 Samuel",
  "2 Samuel": "2 Samuel",
  "1 Kings": "1 Mga Hari",
  "2 Kings": "2 Mga Hari",
  "1 Chronicles": "1 Mga Cronica",
  "2 Chronicles": "2 Mga Cronica",
  Ezra: "Ezra",
  Nehemiah: "Nehemias",
  Esther: "Esther",
  Job: "Job",
  Psalms: "Mga Awit",
  Proverbs: "Mga Kawikaan",
  Ecclesiastes: "Mangangaral",
  "Song of Solomon": "Awit ng mga Awit",
  Isaiah: "Isaias",
  Jeremiah: "Jeremias",
  Lamentations: "Mga Panaghoy",
  Ezekiel: "Ezekiel",
  Daniel: "Daniel",
  Hosea: "Oseas",
  Joel: "Joel",
  Amos: "Amos",
  Obadiah: "Abdias",
  Jonah: "Jonas",
  Micah: "Mikas",
  Nahum: "Nahum",
  Habakkuk: "Habacuc",
  Zephaniah: "Sofonias",
  Haggai: "Hagai",
  Zechariah: "Zacarias",
  Malachi: "Malakias",
  Matthew: "Mateo",
  Mark: "Marcos",
  Luke: "Lucas",
  John: "Juan",
  Acts: "Mga Gawa",
  Romans: "Roma",
  "1 Corinthians": "1 Corinto",
  "2 Corinthians": "2 Corinto",
  Galatians: "Galacia",
  Ephesians: "Efeso",
  Philippians: "Filipos",
  Colossians: "Colosas",
  "1 Thessalonians": "1 Tesalonica",
  "2 Thessalonians": "2 Tesalonica",
  "1 Timothy": "1 Timoteo",
  "2 Timothy": "2 Timoteo",
  Titus: "Tito",
  Philemon: "Filemon",
  Hebrews: "Mga Hebreo",
  James: "Santiago",
  "1 Peter": "1 Pedro",
  "2 Peter": "2 Pedro",
  "1 John": "1 Juan",
  "2 John": "2 Juan",
  "3 John": "3 Juan",
  Jude: "Judas",
  Revelation: "Pahayag",
};

export function bookNameTagalog(englishName: string): string {
  return BOOK_NAMES_TAGALOG[englishName] ?? englishName;
}

// Longest-first so a multi-word book name (e.g. "Song of Solomon", "1
// Corinthians") is matched before a shorter, unrelated prefix could be.
const ENGLISH_BOOK_NAMES = Object.keys(BOOK_NAMES_TAGALOG).sort((a, b) => b.length - a.length);

const FILIPINO_TO_ENGLISH: Record<string, string> = Object.fromEntries(
  Object.entries(BOOK_NAMES_TAGALOG).map(([english, filipino]) => [filipino, english])
);
const FILIPINO_BOOK_NAMES = Object.keys(FILIPINO_TO_ENGLISH).sort((a, b) => b.length - a.length);

// Display-time transform (2026-07-20) -- every Selection's citation should
// read in Filipino, since AB1905 (the only translation the Reader currently
// builds citations from) is a Tagalog text; a citation typed by hand in
// English gets Filipino-ized too, for consistency. Idempotent: a citation
// already in Filipino, or one whose book name isn't recognized, passes
// through unchanged. Deliberately never applied at save time (see
// addSelectionAction.ts) -- v2 is expected to add BSB (English) Selections,
// and a citation's stored wording needs to stay whatever it actually is so
// that day's display logic can tell the difference; only today's "we only
// have Filipino Selections" reality makes universal Filipino display correct
// for now.
export function toFilipinoCitation(citation: string): string {
  for (const englishName of ENGLISH_BOOK_NAMES) {
    if (citation.startsWith(`${englishName} `)) {
      return `${BOOK_NAMES_TAGALOG[englishName]}${citation.slice(englishName.length)}`;
    }
  }
  return citation;
}

// The inverse -- used to build the BibleGateway RefTag/BGLinks widget's
// `data-bibleref` override (see ScriptureCitationLink.tsx), since the
// widget's own text-scanning regex only recognizes English book names and
// abbreviations. Lets a citation display in Filipino while still linking
// correctly. A citation already in English (or unrecognized) passes through
// unchanged.
export function toEnglishCitation(citation: string): string {
  for (const filipinoName of FILIPINO_BOOK_NAMES) {
    if (citation.startsWith(`${filipinoName} `)) {
      return `${FILIPINO_TO_ENGLISH[filipinoName]}${citation.slice(filipinoName.length)}`;
    }
  }
  return citation;
}

// v2 (BSB): the single place every renderer should go through to decide
// whether a citation displays in Filipino -- only when its Selection is
// actually "fil" (the default). Wraps toFilipinoCitation so callers don't
// each need their own `translation === "fil" ? ... : ...` branch.
export function displayCitation(citation: string, translation: "fil" | "en" = "fil"): string {
  return translation === "fil" ? toFilipinoCitation(citation) : citation;
}

// v2 (BSB), 2026-07-21: normalizes a citation's *stored* spelling to match
// its own translation tag -- Filipino book names for "fil", English for
// "en". Deliberately NOT done before this: a citation's spelling used to be
// the only signal of which language it was in, so normalizing at save time
// would have destroyed that signal. Now that `translation` is a real,
// separate column, the spelling carries no information the column doesn't
// already have, so normalizing it is safe -- and necessary: a legacy "fil"
// citation still spelled in English (predating the Tagalog-naming
// convention) computes to the exact same string its own English companion
// would need, so the two can never coexist under the
// unique(section_name, citation) constraint until the source's spelling is
// corrected. Applying this at every save prevents the bug from recurring
// for anything saved from now on, not just fixing the historical rows.
export function normalizeCitationForTranslation(citation: string, translation: "fil" | "en"): string {
  return translation === "fil" ? toFilipinoCitation(citation) : toEnglishCitation(citation);
}

export interface ParsedCitation {
  // Canonical English name -- matches bible_verses.book / canon.ts, so this
  // is directly queryable regardless of which language the citation was
  // written in.
  book: string;
  chapter: number;
  verses: number[];
}

// v2 (BSB): the general form of parseCitationVerses in lib/liturgy/
// citations.ts -- that one requires the caller to already know the book and
// chapter (the Reader's own use case). This one works from the citation
// string alone, trying both English and Filipino book names, so it can
// resolve a citation saved in either language -- needed to look up the
// *other* language's verse text when auto-saving a translation companion
// (see lib/selections/companionTranslation.ts).
export function parseCitationReference(citation: string): ParsedCitation | null {
  const candidates: { name: string; english: string }[] = [
    ...ENGLISH_BOOK_NAMES.map((name) => ({ name, english: name })),
    ...FILIPINO_BOOK_NAMES.map((name) => ({ name, english: FILIPINO_TO_ENGLISH[name] })),
  ].sort((a, b) => b.name.length - a.name.length);

  for (const candidate of candidates) {
    if (!citation.startsWith(`${candidate.name} `)) continue;

    const rest = citation.slice(candidate.name.length + 1);
    const match = rest.match(/^(\d+):(.+)$/);
    if (!match) continue;

    const chapter = Number(match[1]);
    const versesPart = match[2];
    let verses: number[];
    if (versesPart.includes("–") || versesPart.includes("-")) {
      const [start, end] = versesPart.split(/[–-]/).map(Number);
      if (Number.isNaN(start) || Number.isNaN(end)) continue;
      verses = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    } else {
      verses = versesPart.split(",").map(Number);
      if (verses.some(Number.isNaN)) continue;
    }

    return { book: candidate.english, chapter, verses };
  }

  return null;
}
