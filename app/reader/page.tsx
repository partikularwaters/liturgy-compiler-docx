import { getChapter } from "@/lib/bible";
import { getHighlights } from "@/lib/bible/highlights";
import { canon } from "@/lib/bible/canon";
import { getTargetSection } from "@/lib/liturgy/getTargetSection";
import { getLiturgies } from "@/lib/liturgy/getLiturgies";
import { getSectionNames } from "@/lib/liturgy/getSectionNames";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
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
    // Gap #1 fix: an alternative to liturgyId/sectionIndex -- names a
    // Scripture Library Section tag (from getSectionNames("selection"))
    // directly, with no Liturgy involved, so a marked passage can be saved
    // straight to the shared Library.
    librarySection?: string;
  }>;
}

export default async function ReaderPage({ searchParams }: ReaderPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const book = params.book ?? "Psalms";
  const chapter = Number(params.chapter ?? 95);
  // v2 (BSB): "fil" (AB1905, the long-standing default) or "en" (BSB) --
  // Feature 02 shipped with no switcher; this is that switcher's data side.
  const language: "fil" | "en" = params.translation === "en" ? "en" : "fil";

  const currentUser = await getCurrentUser();

  const [chapterData, highlights, targetSection] = await Promise.all([
    getChapter(language === "en" ? "BSB" : "AB1905", book, chapter),
    getHighlights(book, chapter, currentUser?.id ?? null),
    params.liturgyId && params.sectionIndex
      ? getTargetSection(params.liturgyId, Number(params.sectionIndex))
      : Promise.resolve(null),
  ]);

  // Only fetched when there's no target yet -- someone who arrived via
  // "+ Scripture" already has a target pre-set, and never needs these lists.
  const [liturgies, librarySectionNames] = targetSection
    ? [[], []]
    : await Promise.all([getLiturgies(), getSectionNames("selection")]);

  // A Liturgy/Section target (deep-linked via "+ Scripture") always wins over
  // a Library target if somehow both are present in the URL. A librarySection
  // value is only honored when it's actually one of the real, Selection-
  // eligible Section tags -- otherwise a hand-edited URL could tag a Library
  // row under a Section that doesn't exist or doesn't allow Selections,
  // bypassing the same whitelist getSectionNames() exists to enforce (same
  // class of gap that motivated getSectionNames itself -- see its own
  // comment). Mirrors getTargetSection returning null for an invalid
  // liturgyId/sectionIndex.
  const librarySection =
    !targetSection && params.librarySection && librarySectionNames.includes(params.librarySection)
      ? params.librarySection
      : null;

  return (
    <ReaderClient
      books={canon}
      chapter={chapterData}
      initialHighlights={highlights}
      targetSection={targetSection}
      librarySection={librarySection}
      librarySectionNames={librarySectionNames}
      language={language}
      liturgies={liturgies}
      currentUser={currentUser}
    />
  );
}
