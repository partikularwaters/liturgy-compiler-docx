import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const AB1905_SOURCE = new URL("./sources/tgl-tagalog.osis.xml", import.meta.url);
const BSB_SOURCE = new URL("./sources/bsb.txt", import.meta.url);

interface VerseRow {
  translation: "AB1905" | "BSB";
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

const OSIS_BOOK_MAP: Record<string, string> = {
  Gen: "Genesis", Exod: "Exodus", Lev: "Leviticus", Num: "Numbers", Deut: "Deuteronomy",
  Josh: "Joshua", Judg: "Judges", Ruth: "Ruth", "1Sam": "1 Samuel", "2Sam": "2 Samuel",
  "1Kgs": "1 Kings", "2Kgs": "2 Kings", "1Chr": "1 Chronicles", "2Chr": "2 Chronicles",
  Ezra: "Ezra", Neh: "Nehemiah", Esth: "Esther", Job: "Job", Ps: "Psalms", Prov: "Proverbs",
  Eccl: "Ecclesiastes", Song: "Song of Solomon", Isa: "Isaiah", Jer: "Jeremiah",
  Lam: "Lamentations", Ezek: "Ezekiel", Dan: "Daniel", Hos: "Hosea", Joel: "Joel",
  Amos: "Amos", Obad: "Obadiah", Jonah: "Jonah", Mic: "Micah", Nah: "Nahum",
  Hab: "Habakkuk", Zeph: "Zephaniah", Hag: "Haggai", Zech: "Zechariah", Mal: "Malachi",
  Matt: "Matthew", Mark: "Mark", Luke: "Luke", John: "John", Acts: "Acts", Rom: "Romans",
  "1Cor": "1 Corinthians", "2Cor": "2 Corinthians", Gal: "Galatians", Eph: "Ephesians",
  Phil: "Philippians", Col: "Colossians", "1Thess": "1 Thessalonians", "2Thess": "2 Thessalonians",
  "1Tim": "1 Timothy", "2Tim": "2 Timothy", Titus: "Titus", Phlm: "Philemon", Heb: "Hebrews",
  Jas: "James", "1Pet": "1 Peter", "2Pet": "2 Peter", "1John": "1 John", "2John": "2 John",
  "3John": "3 John", Jude: "Jude", Rev: "Revelation",
};

const BSB_BOOK_MAP: Record<string, string> = {
  Psalm: "Psalms",
};

function parseAB1905(): VerseRow[] {
  const xml = readFileSync(AB1905_SOURCE, "utf-8");
  const rows: VerseRow[] = [];
  const pattern = /<verse osisID='([^.]+)\.(\d+)\.(\d+)'>([\s\S]*?)<\/verse>/g;

  for (const match of xml.matchAll(pattern)) {
    const [, osisBook, chapter, verse, text] = match;
    const book = OSIS_BOOK_MAP[osisBook];
    if (!book) {
      throw new Error(`[seed-bible] Unmapped AB1905 OSIS book code: ${osisBook}`);
    }
    rows.push({
      translation: "AB1905",
      book,
      chapter: Number(chapter),
      verse: Number(verse),
      text: text.trim(),
    });
  }
  return rows;
}

function parseBSB(): VerseRow[] {
  const text = readFileSync(BSB_SOURCE, "utf-8");
  const rows: VerseRow[] = [];
  const refPattern = /^(.+) (\d+):(\d+)$/;

  for (const line of text.split("\n")) {
    const [ref, verseText] = line.split("\t");
    if (!ref || !verseText) continue;

    const match = refPattern.exec(ref.trim());
    if (!match) continue;

    const [, rawBook, chapter, verse] = match;
    const book = BSB_BOOK_MAP[rawBook] ?? rawBook;
    rows.push({
      translation: "BSB",
      book,
      chapter: Number(chapter),
      verse: Number(verse),
      text: verseText.trim(),
    });
  }
  return rows;
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "[seed-bible] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with: node --env-file=.env.local scripts/seed-bible.ts"
    );
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const ab1905 = parseAB1905();
  const bsb = parseBSB();
  console.log(`[seed-bible] Parsed ${ab1905.length} AB1905 verses, ${bsb.length} BSB verses`);

  const allRows = [...ab1905, ...bsb];
  const batchSize = 500;

  for (let i = 0; i < allRows.length; i += batchSize) {
    const batch = allRows.slice(i, i + batchSize);
    const { error } = await supabase
      .from("bible_verses")
      .upsert(batch, { onConflict: "translation,book,chapter,verse" });

    if (error) {
      throw new Error(`[seed-bible] Batch ${i / batchSize} failed: ${error.message}`);
    }
    console.log(`[seed-bible] Seeded ${Math.min(i + batchSize, allRows.length)} / ${allRows.length}`);
  }

  console.log("[seed-bible] Done.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
