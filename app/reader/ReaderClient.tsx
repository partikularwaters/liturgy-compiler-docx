"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import BookChapterPicker from "@/components/reader/BookChapterPicker";
import HighlightColorPicker from "@/components/reader/HighlightColorPicker";
import VerseDisplay from "@/components/reader/VerseDisplay";
import type { VerseMarker } from "@/components/reader/VerseDisplay";
import AddSelectionPanel from "@/components/liturgy/AddSelectionPanel";
import ReaderTargetPicker from "@/components/reader/ReaderTargetPicker";
import { ArrowRightIcon, ArrowLeftIcon } from "@/components/liturgy/icons";
import { setHighlight } from "@/lib/bible/highlightActions";
import { addSelection } from "@/lib/liturgy/addSelectionAction";
import { createScriptureSelection } from "@/lib/selections/scriptureSelectionActions";
import { buildCitation, buildSelectionText, parseCitationVerses } from "@/lib/liturgy/citations";
import type { BibleBook, BibleChapter, HighlightColor, VerseHighlights } from "@/types/bible";
import type { TargetSection } from "@/lib/liturgy/getTargetSection";
import { getSelectionMarks } from "@/lib/liturgy/markableSections";
import { TRINITARIAN_SEAL_SECTIONS } from "@/lib/liturgy/trinitarianSeal";
import { getAmenPolicy } from "@/lib/liturgy/amenPolicy";
import type { LiturgySummary, TextMark } from "@/types/liturgy";
import type { CurrentUser } from "@/lib/auth/getCurrentUser";

// Feature 22: mirrors addSelectionAction.ts's REFERENCE_ONLY_SECTIONS -- kept
// as a separate constant since the Reader is a client component and can't
// import the "use server" action file's top-level constant directly.
const REFERENCE_ONLY_SECTIONS = [
  "The Lord’s Discourses",
  "Words of Institution",
  "Closing of the Table",
  "The Great Commission",
];

interface ReaderClientProps {
  books: BibleBook[];
  chapter: BibleChapter;
  initialHighlights: VerseHighlights;
  targetSection: TargetSection | null;
  // Gap #1 fix: the Scripture Library counterpart to targetSection -- a
  // Section-name tag (getSectionNames("selection")) chosen via
  // ReaderTargetPicker's "Scripture Library" mode, with no Liturgy involved.
  // Mutually exclusive with targetSection (see page.tsx).
  librarySection: string | null;
  returnToLibrary: boolean;
  // v2 (BSB): "fil" (AB1905) or "en" (BSB) -- which translation the Reader
  // is currently browsing. Drives citation language (buildCitation/
  // parseCitationVerses) and what gets saved onto a new Selection.
  language: "fil" | "en";
  // Only populated when there's no target yet -- powers ReaderTargetPicker
  // so someone who free-browsed in via the top nav can still choose a
  // liturgy/Section or a Library Section to add to, without a round trip
  // back to the Compile View first.
  liturgies: LiturgySummary[];
  librarySectionNames: string[];
  // null for an anonymous visitor -- highlighting requires an account
  // (task 31: highlights are per-account, so there's nothing to show an
  // anonymous visitor anyway).
  currentUser: CurrentUser | null;
}

export default function ReaderClient({
  books,
  chapter,
  initialHighlights,
  targetSection,
  librarySection,
  returnToLibrary,
  language,
  liturgies,
  librarySectionNames,
  currentUser,
}: ReaderClientProps): React.ReactElement {
  // Gap #2 fix: an anonymous visitor can read/browse the Reader freely (an
  // intentional, documented invariant -- see architecture.md/project-
  // overview.md's "public reading remains anonymous"), but must never see
  // the Selection-building affordances at all -- not just get rejected at
  // the final save click. This single flag gates the target picker, verse
  // markers, and Add panel together, the same "don't offer an affordance
  // that can't work" rule already applied to the highlight color picker
  // below.
  const canBuildSelection = !!currentUser;
  const router = useRouter();
  const [activeColor, setActiveColor] = useState<HighlightColor | null>("accent");
  const [highlights, setHighlights] = useState<VerseHighlights>(initialHighlights);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const navigateTo = (book: string, chapterNumber: number, nextLanguage: "fil" | "en" = language): void => {
    const params = new URLSearchParams({ book, chapter: String(chapterNumber) });
    if (nextLanguage === "en") params.set("translation", "en");
    if (targetSection) {
      params.set("liturgyId", targetSection.liturgyId);
      params.set("sectionIndex", String(targetSection.sectionIndex));
    } else if (librarySection) {
      params.set("librarySection", librarySection);
    }
    if (returnToLibrary) params.set("from", "library");
    router.push(`/reader?${params.toString()}`);
  };

  const handleBookChange = (book: string): void => {
    navigateTo(book, 1);
  };

  const handleChapterChange = (chapterNumber: number): void => {
    navigateTo(chapter.book, chapterNumber);
  };

  const handleLanguageChange = (nextLanguage: "fil" | "en"): void => {
    navigateTo(chapter.book, chapter.chapter, nextLanguage);
  };

  const handleVerseClick = (verseNumber: number): void => {
    // Never optimistically show a highlight that won't actually save --
    // an anonymous visitor clicking a verse used to see the color apply
    // instantly, then silently vanish on the next load once setHighlight's
    // (now-required) login check rejected it. The color picker is already
    // hidden for a signed-out visitor (see below), but the verse text
    // itself is still clickable regardless, so this guard has to live here
    // too -- a plain no-op, since there's no picker left to show an error
    // next to.
    if (!currentUser) return;

    const current = highlights[verseNumber];
    const next: HighlightColor | null = !activeColor || current === activeColor ? null : activeColor;

    setHighlights((prev) => {
      const updated = { ...prev };
      if (next === null) {
        delete updated[verseNumber];
      } else {
        updated[verseNumber] = next;
      }
      return updated;
    });

    startTransition(() => {
      setHighlight(chapter.book, chapter.chapter, verseNumber, next);
    });
  };

  const handleVerseMarkerClick = (verseNumber: number): void => {
    setSuccessMessage(null);
    setSelectedVerses((prev) => {
      const updated = new Set(prev);
      if (updated.has(verseNumber)) {
        updated.delete(verseNumber);
      } else {
        updated.add(verseNumber);
      }
      return updated;
    });
  };

  const alreadySavedVerses = new Set<number>();
  if (targetSection) {
    for (const citation of targetSection.citations) {
      const verses = parseCitationVerses(citation, chapter.book, chapter.chapter, language);
      verses?.forEach((v) => alreadySavedVerses.add(v));
    }
  }

  const hasTarget = !!targetSection || !!librarySection;

  const verseMarkers: Record<number, VerseMarker> = {};
  if (hasTarget) {
    const label = targetSection ? targetSection.sectionName : (librarySection as string);
    for (const verse of chapter.verses) {
      if (alreadySavedVerses.has(verse.number)) {
        verseMarkers[verse.number] = { label, state: "saved" };
      } else if (selectedVerses.has(verse.number)) {
        verseMarkers[verse.number] = { label, state: "pending" };
      } else {
        verseMarkers[verse.number] = { label, state: "addable" };
      }
    }
  }

  const selectedVerseNumbers = Array.from(selectedVerses);
  const candidateCitation =
    hasTarget && selectedVerseNumbers.length > 0
      ? buildCitation(chapter.book, chapter.chapter, selectedVerseNumbers, language)
      : null;
  const candidateText = candidateCitation
    ? buildSelectionText(chapter.verses, selectedVerseNumbers)
    : "";
  // Library saves have no fetched citation list to check against -- a
  // duplicate is caught by createScriptureSelection's own unique-constraint
  // error instead (surfaced through saveError, same as any other save
  // failure), matching ScriptureSelectionForm's direct-add path.
  const alreadySaved =
    targetSection && candidateCitation ? targetSection.citations.includes(candidateCitation) : false;
  const targetLabel = targetSection
    ? `${targetSection.templateName} → ${targetSection.sectionName}`
    : librarySection
      ? `Scripture Library → ${librarySection}`
      : "";

  const handleSaveSelection = (
    citation: string,
    text: string,
    amenExpected: boolean,
    marks: TextMark[],
    trinitarianSeal: "en" | "fil" | null
  ): void => {
    if (!targetSection && !librarySection) return;
    setIsSaving(true);
    setSaveError(null);
    setSuccessMessage(null);
    const savePromise = targetSection
      ? addSelection(
          targetSection.liturgyId,
          targetSection.sectionIndex,
          citation,
          text,
          amenExpected,
          marks,
          trinitarianSeal,
          language
        )
      : createScriptureSelection(librarySection as string, citation, text, language, marks);
    savePromise.then((result) => {
      setIsSaving(false);
      if (result.success) {
        setSelectedVerses(new Set());
        setSuccessMessage(
          `Successfully added to ${targetSection ? targetSection.sectionName : "the Scripture Library"}` +
            (result.companionSaved
              ? language === "fil"
                ? " (BSB translation also saved)"
                : " (AB translation also saved)"
              : "")
        );
        router.refresh();
      } else {
        setSaveError(result.error ?? "Unable to save this Scripture item right now.");
      }
    });
  };

  return (
    <div className="max-w-[1120px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="font-serif-body text-[28px] font-bold leading-9 text-text-primary [font-variant:small-caps]">
        Bible Reader
      </h1>

      {canBuildSelection && (hasTarget || returnToLibrary) && (
        <div className="flex items-center justify-between bg-accent-light rounded-md px-3 py-1.5">
          <p className="flex items-center gap-1 text-[12px] text-accent-dark truncate" title={targetLabel}>
            <ArrowRightIcon size={13} className="shrink-0" /> {targetSection ? targetSection.sectionName : librarySection ?? "Scripture Library"}
          </p>
          <Link
            href={targetSection ? `/liturgy/${targetSection.liturgyId}#section-${targetSection.sectionIndex}` : "/library"}
            className="flex items-center gap-1 text-[12px] font-medium text-accent-dark underline shrink-0"
          >
            <ArrowLeftIcon size={13} /> {targetSection ? "Back to Liturgy" : "Back to Library"}
          </Link>
        </div>
      )}
      {/* One shared two-column shell for both states -- previously a target
          Section rendered a sidebar+verses layout while free-browsing (no
          target yet) rendered a full-width stack with a picker bar on top,
          so the Reader looked like two different pages depending on how you
          arrived. The sidebar now always renders; its contents are just
          whichever of the three is relevant right now. */}
      {/* Sidebar stays a fixed width; the reading column now fills whatever
          space remains (a narrow gap, not a matched-width column) -- Book/
          Chapter and the Highlight picker moved to sit directly above the
          reading pane instead of spanning above both columns, and the AB/
          BSB toggle moved inline with the pane's own "{book} {chapter}"
          heading (see VerseDisplay's headingAccessory). */}
      <div className="flex flex-col md:flex-row items-start gap-6">
        <div className="w-full md:w-[360px] shrink-0 md:sticky md:top-8 md:max-h-[calc(100vh-4rem)] md:overflow-y-auto md:pr-1 flex flex-col gap-4">
          {!canBuildSelection ? (
            // Gap #2 fix: hides the whole workflow, not just the final save
            // click -- an anonymous visitor never sees the target picker,
            // verse markers, or Add panel at all.
            <p className="text-sm text-text-muted">Sign in to build a Scripture Selection.</p>
          ) : (
            <>
              <ReaderTargetPicker
                liturgies={liturgies}
                librarySectionNames={librarySectionNames}
                lockedTarget={
                  targetSection
                    ? { templateName: targetSection.templateName, sectionName: targetSection.sectionName }
                    : null
                }
                initialLibrarySection={librarySection}
              />
              {hasTarget &&
                (candidateCitation ? (
                  <AddSelectionPanel
                    key={candidateCitation}
                    targetLabel={targetLabel}
                    initialCitation={candidateCitation}
                    initialText={candidateText}
                    alreadySaved={alreadySaved}
                    isSaving={isSaving}
                    saveError={saveError}
                    onSave={handleSaveSelection}
                    textOptional={REFERENCE_ONLY_SECTIONS.includes(
                      targetSection ? targetSection.sectionName : (librarySection as string)
                    )}
                    amenPolicy={targetSection ? getAmenPolicy(targetSection.sectionName) : "none"}
                    availableMarks={getSelectionMarks(
                      targetSection ? targetSection.sectionName : (librarySection as string)
                    )}
                    allowTrinitarianSeal={
                      targetSection ? TRINITARIAN_SEAL_SECTIONS.includes(targetSection.sectionName) : false
                    }
                  />
                ) : (
                  <p className="text-sm text-text-muted">Click the + beside a verse to add it here.</p>
                ))}
            </>
          )}
          {successMessage && (
            <div className="bg-success-light rounded-lg px-4 py-3 transition-[opacity,transform] duration-[var(--duration-dropdown)] ease-[var(--ease-out-strong)] starting:opacity-0 motion-safe:starting:-translate-y-1">
              <p className="text-sm font-medium text-success-foreground">{successMessage}</p>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <BookChapterPicker
              books={books}
              selectedBook={chapter.book}
              selectedChapter={chapter.chapter}
              onBookChange={handleBookChange}
              onChapterChange={handleChapterChange}
            />
            {/* No account, no highlighting -- hidden entirely rather than
                shown-and-erroring, matching the "don't offer an affordance
                that can't work" rule applied everywhere else in the app. */}
            {currentUser && <HighlightColorPicker activeColor={activeColor} onSelect={setActiveColor} />}
          </div>
          <VerseDisplay
            chapter={chapter}
            highlights={highlights}
            onVerseClick={handleVerseClick}
            verseMarkers={canBuildSelection && hasTarget ? verseMarkers : undefined}
            onVerseMarkerClick={canBuildSelection && hasTarget ? handleVerseMarkerClick : undefined}
            headingAccessory={
              <div className="flex items-center rounded-md border border-border overflow-hidden text-sm font-medium shrink-0">
                <button
                  type="button"
                  onClick={() => handleLanguageChange("fil")}
                  className={
                    language === "fil"
                      ? "px-3 py-1.5 bg-accent text-accent-foreground"
                      : "px-3 py-1.5 bg-surface text-text-secondary hover:bg-surface-secondary"
                  }
                >
                  AB
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange("en")}
                  className={
                    language === "en"
                      ? "px-3 py-1.5 bg-accent text-accent-foreground"
                      : "px-3 py-1.5 bg-surface text-text-secondary hover:bg-surface-secondary"
                  }
                >
                  BSB
                </button>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
