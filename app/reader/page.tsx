import { getChapter } from "@/lib/bible";
import { getHighlights } from "@/lib/bible/highlights";
import { canon } from "@/lib/bible/canon";
import { getTargetSection } from "@/lib/liturgy/getTargetSection";
import ReaderClient from "@/app/reader/ReaderClient";

// Always reads live data -- same cached-fetch bug class fixed on the
// homepage, Library, and Compile View pages.
export const dynamic = "force-dynamic";

interface ReaderPageProps {
  searchParams: Promise<{
    book?: string;
    chapter?: string;
    liturgyId?: string;
    sectionIndex?: string;
    translation?: string;
  }>;
}

export default async function ReaderPage({ searchParams }: ReaderPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const book = params.book ?? "Psalms";
  const chapter = Number(params.chapter ?? 95);
  // v2 (BSB): "fil" (AB1905, the long-standing default) or "en" (BSB) --
  // Feature 02 shipped with no switcher; this is that switcher's data side.
  const language: "fil" | "en" = params.translation === "en" ? "en" : "fil";

  const [chapterData, highlights, targetSection] = await Promise.all([
    getChapter(language === "en" ? "BSB" : "AB1905", book, chapter),
    getHighlights(book, chapter),
    params.liturgyId && params.sectionIndex
      ? getTargetSection(params.liturgyId, Number(params.sectionIndex))
      : Promise.resolve(null),
  ]);

  return (
    <ReaderClient
      books={canon}
      chapter={chapterData}
      initialHighlights={highlights}
      targetSection={targetSection}
      language={language}
    />
  );
}
