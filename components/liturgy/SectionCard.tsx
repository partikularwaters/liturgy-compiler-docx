"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AddFormulaPanel from "@/components/liturgy/AddFormulaPanel";
import AddExistingSelectionPanel from "@/components/liturgy/AddExistingSelectionPanel";
import AddPrayerPanel from "@/components/liturgy/AddPrayerPanel";
import AddSongPanel from "@/components/liturgy/AddSongPanel";
import PrayerGuidePanel from "@/components/liturgy/PrayerGuidePanel";
import MarkedText from "@/components/liturgy/MarkedText";
import FormulaEditForm from "@/components/liturgy/FormulaEditForm";
import SelectionEditForm from "@/components/liturgy/SelectionEditForm";
import VerbalCueForm from "@/components/liturgy/VerbalCueForm";
import SermonForm from "@/components/liturgy/SermonForm";
import { addVerbalCue, updateVerbalCue } from "@/lib/liturgy/verbalCueActions";
import { updateFormulaItem } from "@/lib/liturgy/addFormulaAction";
import { updateSelectionItem } from "@/lib/liturgy/addSelectionAction";
import { saveSermonPassage } from "@/lib/liturgy/sermonActions";
import { resolveItemText, resolveBase } from "@/lib/liturgy/resolveItemText";
import { sectionTitle } from "@/lib/liturgy/sectionTitle";
import { sortSectionItems } from "@/lib/liturgy/sortSectionItems";
import { formatCitation } from "@/lib/liturgy/formatCitation";
import { getSelectionMarks } from "@/lib/liturgy/markableSections";
import { TRINITARIAN_SEAL_SECTIONS } from "@/lib/liturgy/trinitarianSeal";
import { parseBoldSegments } from "@/lib/text/markdown";
import { updatePrayer } from "@/lib/prayers/prayerActions";
import { removeItem } from "@/lib/liturgy/removeItemAction";
import { PencilIcon, TrashIcon } from "@/components/liturgy/icons";
import type { CompiledSection, Formula, Item, Prayer, ScriptureSelection, Song, TextMark } from "@/types/liturgy";

const ALL_ITEM_TYPES: Item["type"][] = ["selection", "formula", "verbal_cue", "prayer", "sermon", "song"];

// Feature 22: mirrors addSelectionAction.ts's REFERENCE_ONLY_SECTIONS -- kept
// as a separate constant since this is a client component and can't import
// the "use server" action file's top-level constant directly (same pattern
// as ReaderClient.tsx).
const REFERENCE_ONLY_SECTIONS = ["The Lord's Discourses", "Words of Institution", "Closing of the Table"];

// Feature 27: Sections needing a Prayer Guide reference panel, per
// redesign-plan-v1.1.md §W's table -- "Prayer after Communion" there refers
// to the Section actually named "Closing of the Table" in both templates.
const PRAYER_GUIDE_SECTIONS = [
  "Prayer of Invocation",
  "Prayer for Illumination",
  "Prayer for Pardon",
  "Prayer before Communion",
  "Closing of the Table",
  "Pastoral Prayer",
];

// Feature 25: which Leader/Congregation/Minister/Small-Caps marks a Formula
// item can offer, per Section -- Minister role is scoped to these four
// (redesign-plan-v1.1.md §U); Vesper's Church Covenant portion (the second
// half of Affirmation of Faith / Church Covenant) gets the full
// Leader/Congregation/Small-Caps set instead, extending the tool to Formula
// content for the first time. Every other Section's Formula gets no
// marking toolbar at all -- `**bold**` markdown remains the live option
// there, unchanged.
const FORMULA_MARK_SECTIONS: Record<string, TextMark["type"][]> = {
  "Assurance of Pardon": ["minister", "congregation"],
  Charge: ["minister"],
  "The Great Commission": ["minister"],
  Benediction: ["minister"],
  "Affirmation of Faith / Church Covenant": ["congregation", "small_caps"],
};

// Feature-request (2026-07-18): Sections whose sole content is a recited
// text (a Creed, Vesper's Church Covenant) get that Formula's own name
// treated the same way a Selection's citation is -- shown inline with the
// Section title, plain (not citation-red/small-caps, since it isn't
// Scripture), pushed below only if too long. Only applies when there's no
// Selection in the Section (the two mechanics are mutually exclusive in
// practice -- these Sections never mix a Creed with a Scripture reading).
const TITLE_IN_HEADER_SECTIONS = ["Affirmation of Faith", "Affirmation of Faith / Church Covenant"];

// Feature 28 Part A: "+ X" outline buttons, 25% smaller than the app's
// standard secondary button, transparent fill -- shared by every Add
// trigger below (both the <Link> and <button> ones) so they stay identical.
const addButtonClass =
  "inline-flex items-center rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-accent-dark bg-transparent hover:bg-accent-dark hover:text-accent-foreground hover:border-accent-dark";

interface SectionCardProps {
  section: CompiledSection;
  liturgyId: string;
  sectionIndex: number;
  formulas: Formula[];
  prayers: Prayer[];
  songs: Song[];
  scriptureSelections: ScriptureSelection[];
}

// Feature 21: title-only display for a Song item -- Title Case + italic
// always; Psalm additionally gets the citation-red treatment since it's
// still Scripture-adjacent (redesign-plan-v1.1.md §L), Hymn doesn't.
function SongTitle({ song }: { song?: Song }): React.ReactElement {
  return (
    <p
      className={
        song?.kind === "psalm"
          ? "font-serif-body text-[16px] italic text-citation"
          : "font-serif-body text-[16px] italic text-text-primary"
      }
    >
      {song ? formatCitation(song.title) : "(Song not found)"}
    </p>
  );
}

function BodyText({ text, rubric = false }: { text: string; rubric?: boolean }): React.ReactElement {
  return (
    <p
      className={
        rubric
          ? "font-serif-body text-[16px] leading-[1.6] text-text-primary italic whitespace-pre-wrap text-justify"
          : "font-serif-body text-[16px] leading-[1.6] text-text-primary whitespace-pre-wrap text-justify"
      }
    >
      {parseBoldSegments(text).map((segment, i) =>
        segment.bold ? <strong key={i}>{segment.text}</strong> : <span key={i}>{segment.text}</span>
      )}
    </p>
  );
}

function LeaderOnlyBadge(): React.ReactElement {
  return (
    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-accent-light text-accent-dark">
      Leader only
    </span>
  );
}

interface PrayerEditFormProps {
  initialText: string;
  isSaving: boolean;
  error: string | null;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

function PrayerEditForm({
  initialText,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: PrayerEditFormProps): React.ReactElement {
  const [text, setText] = useState(initialText);

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
      />
      <p className="text-[13px] text-text-muted">
        Editing here updates this Prayer in the library for future use.
      </p>
      {error && <p className="text-sm text-error">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(text)}
          disabled={isSaving}
          className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="self-start bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function SectionCard({
  section,
  liturgyId,
  sectionIndex,
  formulas,
  prayers,
  songs,
  scriptureSelections,
}: SectionCardProps): React.ReactElement {
  const router = useRouter();
  const sectionFormulas = formulas.filter((f) => f.sectionName === section.name);
  const sectionScriptureSelections = scriptureSelections.filter((s) => s.sectionName === section.name);
  // Feature 27: 'guide'-kind entries are reference material, never
  // placeable as an actual liturgy item -- keep them out of AddPrayerPanel's
  // picker entirely.
  const sectionPrayers = prayers.filter((p) => p.sectionName === section.name && p.kind === "prayer");
  const sectionGuides = prayers.filter((p) => p.sectionName === section.name && p.kind === "guide");
  const sectionPsalms = songs.filter((s) => s.sectionName === section.name && s.kind === "psalm");
  const sectionHymns = songs.filter((s) => s.sectionName === section.name && s.kind === "hymn");
  const [isAddingExistingSelection, setIsAddingExistingSelection] = useState(false);
  const [isAddingFormula, setIsAddingFormula] = useState(false);
  const [isAddingVerbalCue, setIsAddingVerbalCue] = useState(false);
  const [isAddingPrayer, setIsAddingPrayer] = useState(false);
  const [isAddingSermon, setIsAddingSermon] = useState(false);
  const [isAddingPsalm, setIsAddingPsalm] = useState(false);
  const [isAddingHymn, setIsAddingHymn] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSermon = section.items.some((item) => item.type === "sermon");
  // Feature 23: item_types is missing only if a Section somehow predates the
  // migration -- fall back to every type rather than silently hiding Add
  // buttons in that case.
  const allowedTypes = section.item_types ?? ALL_ITEM_TYPES;

  // Feature 28 Part A, generalized 2026-07-18: every Selection's citation in
  // this Section moves up onto the Section-name line (matching the reference
  // bulletin's "reference shares the heading line, right-aligned" layout)
  // instead of repeating as its own label line in the items list below --
  // originally scoped only to the single-Selection case, but Madrid flagged
  // that a Section mixing a Formula with one or more Selections (e.g.
  // Assurance of Pardon) should behave the same way. Multiple citations join
  // with "; "; every other item type (Formula, Cue, Prayer, Sermon, Song)
  // keeps its own per-item label rendering, unaffected.
  const selectionItems = section.items.filter((item) => item.type === "selection");
  const creedFormulaItem = section.items.find((item) => item.type === "formula") ?? null;
  const showCreedTitleInHeader =
    selectionItems.length === 0 && TITLE_IN_HEADER_SECTIONS.includes(section.name) && creedFormulaItem !== null;
  const songItems = section.items.filter((item) => item.type === "song");
  const headerSongItem =
    selectionItems.length === 0 && !showCreedTitleInHeader && songItems.length === 1 ? songItems[0] : null;
  const headerSong = headerSongItem ? songs.find((s) => s.id === headerSongItem.songId) : null;
  const headerReference =
    selectionItems.length > 0
      ? {
          text: selectionItems.map((item) => formatCitation(item.citation)).join("; "),
          citationColor: true,
          smallCaps: true,
        }
      : showCreedTitleInHeader
        ? {
            text: resolveItemText(creedFormulaItem!, formulas, prayers, songs).label ?? "",
            citationColor: false,
            smallCaps: false,
          }
        : headerSong
          ? {
              text: formatCitation(headerSong.title),
              citationColor: headerSong.kind === "psalm",
              smallCaps: false,
              italic: true,
            }
          : null;

  // Feature-request (2026-07-18): when a Section draws from more than one
  // passage (e.g. Assurance of Pardon: John 3:16 + Acts 13:38-39), they
  // should read as one naturally-spoken flow -- the last words of one
  // immediately followed by the first words of the next -- not as separate
  // paragraphs. Concatenates every Selection's text with a single joining
  // space and shifts each item's own marks by the running offset so the
  // combined block still renders correctly through the same MarkedText path.
  // Falls back to normal per-item rendering while one of them is actively
  // being edited, rather than trying to splice an edit form into the middle
  // of a merged paragraph.
  const isAnySelectionBeingEdited = selectionItems.some((item) => item.id === editingItemId);
  const shouldMergeSelections = selectionItems.length > 1 && !isAnySelectionBeingEdited;
  let combinedSelectionText = "";
  let combinedSelectionMarks: TextMark[] = [];
  if (shouldMergeSelections) {
    let offset = 0;
    const parts: string[] = [];
    for (const item of selectionItems) {
      if (offset > 0) offset += 1; // the joining space already appended
      combinedSelectionMarks.push(
        ...(item.marks ?? []).map((m) => ({ ...m, start: m.start + offset, end: m.end + offset }))
      );
      parts.push(item.text);
      offset += item.text.length;
    }
    combinedSelectionText = parts.join(" ");
  }

  const handleAddVerbalCue = (
    text: string,
    visibility: "both" | "leader_only",
    rubric: boolean
  ): void => {
    setIsSaving(true);
    setError(null);
    addVerbalCue(liturgyId, sectionIndex, text, visibility, rubric).then((result) => {
      setIsSaving(false);
      if (result.success) {
        setIsAddingVerbalCue(false);
        router.refresh();
      } else {
        setError(result.error ?? "Unable to add this Verbal Cue right now.");
      }
    });
  };

  const handleUpdateVerbalCue = (
    itemId: string,
    text: string,
    visibility: "both" | "leader_only",
    rubric: boolean
  ): void => {
    setIsSaving(true);
    setError(null);
    updateVerbalCue(liturgyId, sectionIndex, itemId, text, visibility, rubric).then((result) => {
      setIsSaving(false);
      if (result.success) {
        setEditingItemId(null);
        router.refresh();
      } else {
        setError(result.error ?? "Unable to update this Verbal Cue right now.");
      }
    });
  };

  const handleUpdateFormulaItem = (
    itemId: string,
    text: string,
    visibility: "both" | "leader_only",
    marks: TextMark[],
    trinitarianSeal: "en" | "fil" | null
  ): void => {
    setIsSaving(true);
    setError(null);
    updateFormulaItem(liturgyId, sectionIndex, itemId, text, visibility, marks, trinitarianSeal).then((result) => {
      setIsSaving(false);
      if (result.success) {
        setEditingItemId(null);
        router.refresh();
      } else {
        setError(result.error ?? "Unable to update this Formula right now.");
      }
    });
  };

  const handleUpdateSelectionItem = (
    itemId: string,
    citation: string,
    text: string,
    amenExpected: boolean,
    marks: TextMark[],
    trinitarianSeal: "en" | "fil" | null
  ): void => {
    setIsSaving(true);
    setError(null);
    updateSelectionItem(
      liturgyId,
      sectionIndex,
      itemId,
      citation,
      text,
      amenExpected,
      marks,
      trinitarianSeal
    ).then((result) => {
      setIsSaving(false);
      if (result.success) {
        setEditingItemId(null);
        router.refresh();
      } else {
        setError(result.error ?? "Unable to update this Scripture item right now.");
      }
    });
  };

  const handleSavePrayerEdit = (itemId: string, prayerId: string, text: string): void => {
    setIsSaving(true);
    setError(null);
    updatePrayer(prayerId, section.name, text).then((result) => {
      setIsSaving(false);
      if (result.success) {
        setEditingItemId(null);
        router.refresh();
      } else {
        setError(result.error ?? "Unable to update this Prayer right now.");
      }
    });
  };

  const handleRemoveItem = (itemId: string): void => {
    if (!window.confirm("Remove this item from the Section?")) return;
    setIsSaving(true);
    setError(null);
    removeItem(liturgyId, sectionIndex, itemId).then((result) => {
      setIsSaving(false);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Unable to remove this item right now.");
      }
    });
  };

  const handleSaveSermon = (passage: string): void => {
    setIsSaving(true);
    setError(null);
    saveSermonPassage(liturgyId, sectionIndex, passage).then((result) => {
      setIsSaving(false);
      if (result.success) {
        setIsAddingSermon(false);
        setEditingItemId(null);
        router.refresh();
      } else {
        setError(result.error ?? "Unable to save the Sermon passage right now.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h2 className="font-serif-body text-[16px] font-bold uppercase text-text-primary">
          {sectionTitle(section, songs)}
        </h2>
        {headerReference && (
          <p
            className={[
              "font-serif-body text-[13px] shrink-0",
              headerReference.citationColor ? "text-citation" : "text-text-primary",
              headerReference.smallCaps ? "[font-variant:small-caps]" : "",
              headerReference.italic ? "italic" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {headerReference.text}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {allowedTypes.includes("selection") && (
          <>
            <Link href={`/reader?liturgyId=${liturgyId}&sectionIndex=${sectionIndex}`} className={addButtonClass}>
              + Scripture
            </Link>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsAddingExistingSelection((prev) => !prev);
              }}
              className={addButtonClass}
            >
              + From Library
            </button>
          </>
        )}
        {allowedTypes.includes("formula") && (
          <button type="button" onClick={() => setIsAddingFormula((prev) => !prev)} className={addButtonClass}>
            + Formula
          </button>
        )}
        {allowedTypes.includes("verbal_cue") && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsAddingVerbalCue((prev) => !prev);
            }}
            className={addButtonClass}
          >
            + Cue
          </button>
        )}
        {allowedTypes.includes("prayer") && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsAddingPrayer((prev) => !prev);
            }}
            className={addButtonClass}
          >
            + Prayer
          </button>
        )}
        {allowedTypes.includes("sermon") && !hasSermon && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsAddingSermon((prev) => !prev);
            }}
            className={addButtonClass}
          >
            + Sermon
          </button>
        )}
        {allowedTypes.includes("song") && (
          <>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsAddingPsalm((prev) => !prev);
              }}
              className={addButtonClass}
            >
              + Psalm
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsAddingHymn((prev) => !prev);
              }}
              className={addButtonClass}
            >
              + Hymn
            </button>
          </>
        )}
      </div>

      {PRAYER_GUIDE_SECTIONS.includes(section.name) && <PrayerGuidePanel guides={sectionGuides} />}

      {isAddingExistingSelection && (
        <div className="mb-4">
          <AddExistingSelectionPanel
            scriptureSelections={sectionScriptureSelections}
            liturgyId={liturgyId}
            sectionIndex={sectionIndex}
            onDone={() => setIsAddingExistingSelection(false)}
          />
        </div>
      )}

      {isAddingFormula && (
        <div className="mb-4">
          <AddFormulaPanel
            formulas={sectionFormulas}
            liturgyId={liturgyId}
            sectionIndex={sectionIndex}
            onDone={() => setIsAddingFormula(false)}
          />
        </div>
      )}

      {isAddingVerbalCue && (
        <div className="mb-4">
          <VerbalCueForm
            initialText=""
            initialVisibility="leader_only"
            isSaving={isSaving}
            error={error}
            submitLabel="Add Verbal Cue"
            onSubmit={handleAddVerbalCue}
            onCancel={() => {
              setError(null);
              setIsAddingVerbalCue(false);
            }}
          />
        </div>
      )}

      {isAddingPrayer && (
        <div className="mb-4">
          <AddPrayerPanel
            prayers={sectionPrayers}
            sectionName={section.name}
            liturgyId={liturgyId}
            sectionIndex={sectionIndex}
            onDone={() => setIsAddingPrayer(false)}
          />
        </div>
      )}

      {isAddingSermon && (
        <div className="mb-4">
          <SermonForm
            initialPassage=""
            isSaving={isSaving}
            error={error}
            submitLabel="Add Sermon"
            onSubmit={handleSaveSermon}
            onCancel={() => {
              setError(null);
              setIsAddingSermon(false);
            }}
          />
        </div>
      )}

      {isAddingPsalm && (
        <div className="mb-4">
          <AddSongPanel
            songs={sectionPsalms}
            kind="psalm"
            sectionName={section.name}
            liturgyId={liturgyId}
            sectionIndex={sectionIndex}
            onDone={() => setIsAddingPsalm(false)}
          />
        </div>
      )}

      {isAddingHymn && (
        <div className="mb-4">
          <AddSongPanel
            songs={sectionHymns}
            kind="hymn"
            sectionName={section.name}
            liturgyId={liturgyId}
            sectionIndex={sectionIndex}
            onDone={() => setIsAddingHymn(false)}
          />
        </div>
      )}

      {section.items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {(() => {
            let mergedBlockInserted = false;
            return sortSectionItems(section.items).map((item) => {
            if (headerSongItem && item.id === headerSongItem.id) return null;
            if (shouldMergeSelections && item.type === "selection") {
              if (mergedBlockInserted) return null;
              mergedBlockInserted = true;
              return (
                <li key="merged-selections">
                  <div className="flex items-center gap-3 flex-wrap">
                    {selectionItems.map((s) => (
                      <span key={s.id} className="flex items-center gap-1.5">
                        <span className="text-[11px] text-text-muted">{s.citation}</span>
                        <button
                          type="button"
                          title={`Edit ${s.citation}`}
                          onClick={() => {
                            setError(null);
                            setEditingItemId(s.id);
                          }}
                          className="text-text-muted hover:text-accent-dark"
                        >
                          <PencilIcon size={14} />
                        </button>
                        <button
                          type="button"
                          title={`Remove ${s.citation}`}
                          onClick={() => handleRemoveItem(s.id)}
                          className="text-text-muted hover:text-error"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <MarkedText text={combinedSelectionText} marks={combinedSelectionMarks} />
                </li>
              );
            }

            const resolved = resolveItemText(item, formulas, prayers, songs);

            if (item.type === "selection" && editingItemId === item.id) {
              return (
                <li key={item.id}>
                  <SelectionEditForm
                    initialCitation={item.citation}
                    initialText={item.text}
                    initialAmenExpected={item.amenExpected ?? false}
                    initialMarks={item.marks ?? []}
                    initialTrinitarianSeal={item.trinitarianSeal ?? null}
                    textOptional={REFERENCE_ONLY_SECTIONS.includes(section.name)}
                    isSongSlot={section.dynamic_naming}
                    availableMarks={getSelectionMarks(section.name)}
                    allowTrinitarianSeal={TRINITARIAN_SEAL_SECTIONS.includes(section.name)}
                    isSaving={isSaving}
                    error={error}
                    onSubmit={(citation, text, amenExpected, marks, trinitarianSeal) =>
                      handleUpdateSelectionItem(item.id, citation, text, amenExpected, marks, trinitarianSeal)
                    }
                    onCancel={() => {
                      setError(null);
                      setEditingItemId(null);
                    }}
                  />
                </li>
              );
            }

            if (item.type === "verbal_cue" && editingItemId === item.id) {
              return (
                <li key={item.id}>
                  <VerbalCueForm
                    initialText={item.text}
                    initialVisibility={item.visibility}
                    initialRubric={item.rubric ?? false}
                    isSaving={isSaving}
                    error={error}
                    submitLabel="Save"
                    onSubmit={(text, visibility, rubric) =>
                      handleUpdateVerbalCue(item.id, text, visibility, rubric)
                    }
                    onCancel={() => {
                      setError(null);
                      setEditingItemId(null);
                    }}
                  />
                </li>
              );
            }

            if (item.type === "prayer" && editingItemId === item.id) {
              return (
                <li key={item.id}>
                  <PrayerEditForm
                    initialText={resolved.text}
                    isSaving={isSaving}
                    error={error}
                    onSubmit={(text) => handleSavePrayerEdit(item.id, item.prayerId, text)}
                    onCancel={() => {
                      setError(null);
                      setEditingItemId(null);
                    }}
                  />
                </li>
              );
            }

            if (item.type === "formula" && editingItemId === item.id) {
              return (
                <li key={item.id}>
                  <FormulaEditForm
                    initialText={resolveBase(item, formulas, prayers, songs).text}
                    initialVisibility={item.visibility}
                    initialMarks={item.marks ?? []}
                    initialTrinitarianSeal={item.trinitarianSeal ?? null}
                    availableMarks={FORMULA_MARK_SECTIONS[section.name] ?? []}
                    allowTrinitarianSeal={TRINITARIAN_SEAL_SECTIONS.includes(section.name)}
                    isSaving={isSaving}
                    error={error}
                    onSubmit={(text, visibility, marks, trinitarianSeal) =>
                      handleUpdateFormulaItem(item.id, text, visibility, marks, trinitarianSeal)
                    }
                    onCancel={() => {
                      setError(null);
                      setEditingItemId(null);
                    }}
                  />
                </li>
              );
            }

            if (item.type === "sermon" && editingItemId === item.id) {
              return (
                <li key={item.id}>
                  <SermonForm
                    initialPassage={item.passage}
                    isSaving={isSaving}
                    error={error}
                    submitLabel="Save"
                    onSubmit={handleSaveSermon}
                    onCancel={() => {
                      setError(null);
                      setEditingItemId(null);
                    }}
                  />
                </li>
              );
            }

            const isEditable =
              item.type === "verbal_cue" ||
              item.type === "prayer" ||
              item.type === "sermon" ||
              item.type === "formula" ||
              item.type === "selection";

            const labelAlreadyShownInHeader =
              (item.type === "selection" && headerReference !== null) ||
              (item === creedFormulaItem && showCreedTitleInHeader);

            return (
              <li key={item.id}>
                <div className="flex items-center gap-2">
                  {!labelAlreadyShownInHeader && (
                    <p
                      className={
                        item.type === "selection"
                          ? "font-serif-body text-[13px] text-citation [font-variant:small-caps]"
                          : "font-serif-body text-[13px] text-text-secondary"
                      }
                    >
                      {resolved.label}
                    </p>
                  )}
                  {resolved.leaderOnly && <LeaderOnlyBadge />}
                  {isEditable && (
                    <button
                      type="button"
                      title="Edit"
                      onClick={() => {
                        setError(null);
                        setEditingItemId(item.id);
                      }}
                      className="text-text-muted hover:text-accent-dark"
                    >
                      <PencilIcon size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Remove"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-text-muted hover:text-error"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
                {item.type === "song" ? (
                  <SongTitle song={resolved.song} />
                ) : (
                  resolved.text &&
                  ((item.type === "selection" || item.type === "formula") &&
                  item.marks &&
                  item.marks.length > 0 ? (
                    <MarkedText text={resolved.text} marks={item.marks} />
                  ) : (
                    <BodyText text={resolved.text} rubric={resolved.rubric} />
                  ))
                )}
              </li>
            );
            });
          })()}
        </ul>
      )}
    </div>
  );
}
