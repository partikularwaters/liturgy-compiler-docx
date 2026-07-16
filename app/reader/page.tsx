import { getChapter } from "@/lib/bible";
import { getHighlights } from "@/lib/bible/highlights";
import { canon } from "@/lib/bible/canon";
import { getTargetSection } from "@/lib/liturgy/getTargetSection";
import ReaderClient from "@/app/reader/ReaderClient";

interface ReaderPageProps {
  searchParams: Promise<{ book?: string; chapter?: string; liturgyId?: string; sectionIndex?: string }>;
}

export default async function ReaderPage({ searchParams }: ReaderPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const book = params.book ?? "Psalms";
  const chapter = Number(params.chapter ?? 95);

  const [chapterData, highlights, targetSection] = await Promise.all([
    getChapter("AB1905", book, chapter),
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
    />
  );
}
