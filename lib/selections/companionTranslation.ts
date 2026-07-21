"use server";

import { supabase } from "@/lib/db/supabase";
import { parseCitationReference, toFilipinoCitation } from "@/lib/bible/bookNamesTagalog";
import { formatCitation } from "@/lib/liturgy/formatCitation";
import { formatVerseSpec } from "@/lib/liturgy/citations";

const OTHER_LANGUAGE: Record<"fil" | "en", "fil" | "en"> = { fil: "en", en: "fil" };
const BIBLE_TRANSLATION: Record<"fil" | "en", "AB1905" | "BSB"> = { fil: "AB1905", en: "BSB" };

// v2 (BSB): whenever a Selection is saved in one language, auto-save the
// *unmodified* source text for the same passage in the other language too,
// if it doesn't already exist in the Scripture Library -- a Filipino and an
// English entry for the same passage are a linked pair, not a duplicate.
// "Same passage" is matched by canonical verse reference (parseCitationReference
// + the English book name bible_verses is keyed by), not a manual link.
// Best-effort and silent: never blocks or fails the caller's own save --
// the same discipline the library upsert next to every addSelection call
// already follows. Returns whether a companion was actually created, so the
// caller can surface a small "(English translation also saved)" note.
export async function saveCompanionTranslation(
  sectionName: string,
  citation: string,
  translation: "fil" | "en"
): Promise<boolean> {
  const parsed = parseCitationReference(citation);
  if (!parsed) return false;

  const companionLanguage = OTHER_LANGUAGE[translation];
  const verseSpec = formatVerseSpec(parsed.verses);
  const companionCitation =
    companionLanguage === "fil"
      ? toFilipinoCitation(`${parsed.book} ${parsed.chapter}:${verseSpec}`)
      : formatCitation(`${parsed.book} ${parsed.chapter}:${verseSpec}`);

  const { data: existing } = await supabase
    .from("scripture_selections")
    .select("id")
    .eq("section_name", sectionName)
    .eq("translation", companionLanguage)
    .eq("citation", companionCitation)
    .maybeSingle();
  if (existing) return false;

  const { data: verseRows, error: verseError } = await supabase
    .from("bible_verses")
    .select("verse, text")
    .eq("translation", BIBLE_TRANSLATION[companionLanguage])
    .eq("book", parsed.book)
    .eq("chapter", parsed.chapter)
    .in("verse", parsed.verses)
    .order("verse");

  if (verseError) {
    console.error("[lib/selections/companionTranslation]", verseError.message);
    return false;
  }
  if (!verseRows || verseRows.length === 0) return false;

  const companionText = verseRows.map((row) => row.text).join(" ");

  const { error: insertError } = await supabase.from("scripture_selections").insert({
    section_name: sectionName,
    citation: companionCitation,
    text: companionText,
    translation: companionLanguage,
  });

  if (insertError) {
    // A concurrent save could lose the race against the maybeSingle() check
    // above -- unique(section_name, citation) will reject the second insert,
    // which is the correct outcome (no duplicate), just not a real failure.
    if (insertError.code !== "23505") {
      console.error("[lib/selections/companionTranslation]", insertError.message);
    }
    return false;
  }

  return true;
}
