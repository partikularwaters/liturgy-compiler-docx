import { supabase } from "@/lib/db/supabase";
import type { BibleChapter, Translation } from "@/types/bible";

export async function getChapter(
  translation: Translation,
  book: string,
  chapter: number
): Promise<BibleChapter> {
  const { data, error } = await supabase
    .from("bible_verses")
    .select("verse, text")
    .eq("translation", translation)
    .eq("book", book)
    .eq("chapter", chapter)
    .order("verse");

  if (error) {
    console.error("[lib/bible/getChapter]", error.message);
    throw new Error("Unable to load this chapter right now.");
  }

  return {
    book,
    chapter,
    verses: data.map((row) => ({ number: row.verse, text: row.text })),
  };
}
