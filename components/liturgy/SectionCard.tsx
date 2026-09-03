"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import AddFormulaPanel from "@/components/liturgy/AddFormulaPanel";
import AddExistingSelectionPanel from "@/components/liturgy/AddExistingSelectionPanel";
import VesperReadingPanel from "@/components/liturgy/VesperReadingPanel";
import AddPrayerPanel from "@/components/liturgy/AddPrayerPanel";
import AddSongPanel from "@/components/liturgy/AddSongPanel";
import PrayerGuidePanel from "@/components/liturgy/PrayerGuidePanel";
import SilentConfessionLanguageToggle from "@/components/liturgy/SilentConfessionLanguageToggle";
import MarkedText from "@/components/liturgy/MarkedText";
import MarkEditor from "@/components/liturgy/MarkEditor";
import FormulaEditForm from "@/components/liturgy/FormulaEditForm";
import SelectionEditForm from "@/components/liturgy/SelectionEditForm";
import VerbalCueForm from "@/components/liturgy/VerbalCueForm";
import SermonForm from "@/components/liturgy/SermonForm";
import { addVerbalCue, updateVerbalCue } from "@/lib/liturgy/verbalCueActions";
import { updateFormulaItem } from "@/lib/liturgy/addFormulaAction";
import { updateSelectionItem } from "@/lib/liturgy/addSelectionAction";
import { saveSermon } from "@/lib/liturgy/sermonActions";
import { resolveItemText, resolveBase } from "@/lib/liturgy/resolveItemText";
import { sectionTitle } from "@/lib/liturgy/sectionTitle";
import { sortSectionItems } from "@/lib/liturgy/sortSectionItems";
import { formatCitation } from "@/lib/liturgy/formatCitation";
import { displayCitation } from "@/lib/bible/bookNamesTagalog";
import ScriptureCitationLink from "@/components/liturgy/ScriptureCitationLink";
import { getSelectionMarks, getFormulaMarks } from "@/lib/liturgy/markableSections";
import { VESPER_TABLE_SECTIONS } from "@/lib/liturgy/vesperTableRotation";
import { toEnglishCitation } from "@/lib/bible/bookNamesTagalog";
import { TRINITARIAN_SEAL_SECTIONS } from "@/lib/liturgy/trinitarianSeal";
import { getAmenPolicy, type AmenPolicy } from "@/lib/liturgy/amenPolicy";
import { SILENT_CONFESSION_SECTION, SILENT_CONFESSION_RUBRIC_TEXT } from "@/lib/liturgy/silentConfessionRubric";
import { NATURAL_FLOW_TOGGLE_SECTIONS } from "@/lib/liturgy/naturalFlowSections";
import NaturalFlowToggle from "@/components/liturgy/NaturalFlowToggle";
import { applyMarks, shiftMarksForEdit } from "@/lib/text/marks";
import { updatePrayerItem } from "@/lib/liturgy/addPrayerAction";
import { updateSongItem } from "@/lib/liturgy/addSongAction";
import { removeItem } from "@/lib/liturgy/removeItemAction";
import { PencilIcon, TrashIcon, PlusIcon, XIcon } from "@/components/liturgy/icons";
import type { VerbalCueRun } from "@/lib/liturgy/resolveVerbalCueTemplate";
import type { CurrentUser } from "@/lib/auth/getCurrentUser";
import type { CompiledSection, Formula, Item, Prayer, ScriptureSelection, Song, TextMark } from "@/types/liturgy";

const ALL_ITEM_TYPES: Item["type"][] = ["selection", "formula", "verbal_cue", "prayer", "sermon", "song"];

// See `openTarget`'s comment in SectionCard for why these replace eight
// independent booleans plus `editingItemId`.
type PanelKey =
  | "addExistingSelection"
  | "vesperReading"
  | "addFormula"
  | "addVerbalCue"
  | "addPrayer"
  | "addSermon"
  | "addPsalm"
  | "addHymn";
type OpenTarget = { type: "panel"; key: PanelKey } | { type: "edit"; itemId: string } | null;

// Feature 22: mirrors addSelectionAction.ts's REFERENCE_ONLY_SECTIONS -- kept
// as a separate constant since this is a client component and can't import
// the "use server" action file's top-level constant directly (same pattern
// as ReaderClient.tsx).
const REFERENCE_ONLY_SECTIONS = [
  "The Lord’s Discourses",
  "Words of Institution",
  "Closing of the Table",
  "The Great Commission",
];

// Confession of Sin's Call-to-Confession cue is the only Verbal Cue that
// needs a second-language toggle -- every other cue keeps the single-text
// form.
const ALTERNATE_LANGUAGE_CUE_SECTIONS = ["Confession of Sin"];

// Feature 27: Sections needing a Prayer Guide reference panel, per
// redesign-plan-v1.1.md W's table -- "Prayer after Communion" there refers
// to the Section actually named "Closing of the Table" in both templates.
const PRAYER_GUIDE_SECTIONS = [
  "Prayer of Invocation",
  "Prayer for Illumination",
  "Prayer for Pardon",
  "Prayer before Communion",
  "Closing of the Table",
  "Pastoral Prayer",
];

// Sections whose sole content is a recited
// text (a Creed, Vesper's Church Covenant) get that Formula's own name
// treated the same way a Selection's citation is -- shown inline with the
// Section title, plain (not citation-red/small-caps, since it isn't
// Scripture), pushed below only if too long. Only applies when there's no
// Selection in the Section (the two mechanics are mutually exclusive in
// practice -- these Sections never mix a Creed with a Scripture reading).
const TITLE_IN_HEADER_SECTIONS = ["Affirmation of Faith"];

// Feature 28 Part A: "+ X" outline buttons, 25% smaller than the app's
// standard secondary button, transparent fill -- shared by every Add
// trigger below (both the <Link> and <button> ones) so they stay identical.
const addButtonClass =
  "inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-accent-dark bg-transparent hover:bg-accent-dark hover:text-accent-foreground hover:border-accent-dark transition-[color,background-color,border-color,transform] duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]";

interface SectionCardProps {
  section: CompiledSection;
  liturgyId: string;
  sectionIndex: number;
  formulas: Formula[];
  prayers: Prayer[];
  songs: Song[];
  scriptureSelections: ScriptureSelection[];
  // v3: null for an anonymous visitor. Only used so far to decide whether
  // to offer the Personal Library "save to my Library" checkbox on a
  // placed Prayer/Song edit -- Compiler-only, see updatePrayerItem's
  // comment for why a Curator never needs this (they edit the shared
  // master directly instead).
  currentUser: CurrentUser | null;
}

// Feature 21: title-only display for a Song item -- Title Case + italic
// always; Psalm additionally gets the citation-red treatment since it's
// still Scripture-adjacent (redesign-plan-v1.1.md L), Hymn doesn't.
function SongTitle({
  song,
}: {
  song?: Pick<Song, "title" | "kind" | "attribution" | "yearPublished" | "notes">;
}): React.ReactElement {
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
      {applyMarks(text, undefined).flatMap((seg, segIndex) =>
        seg.runs.map((run, runIndex) =>
          run.bold ? (
            <strong key={`${segIndex}-${runIndex}`}>{run.text}</strong>
          ) : (
            <span key={`${segIndex}-${runIndex}`}>{run.text}</span>
          )
        )
      )}
    </p>
  );
}

function SermonBody({ item }: { item: Extract<Item, { type: "sermon" }> }): React.ReactElement {
  return (
    <div className="font-serif-body text-[16px] leading-[1.6] text-text-primary text-center whitespace-pre-wrap">
      {item.title && <p className="[font-variant:small-caps]">{item.title}</p>}
      {item.series && <p>{item.series}</p>}
      <p>{item.passage}</p>
      {item.preacher && <p>{item.preacher}</p>}
    </div>
  );
}

// A Verbal Cue's substituted {{scripture}}/{{song}} token renders in
// citation-red (matching a Selection header/Psalm title elsewhere), never
// Small Caps -- the rest of the cue's hand-written prose stays plain.
//
// Citation runs render as an <a> WITHOUT an href, not a <span> -- purely to
// keep BibleGateway's own BGLinks widget (ScriptureLinker.tsx) out of them.
// BGLinks re-scans the whole document body on every navigation for anything
// that looks like an English/Latin book name + chapter:verse, and wraps
// matches into its own auto-generated link -- it explicitly skips recursing
// into existing <a>/<h1-6>/<img>/<pre>/<input>/<option> elements (confirmed
// in bglinks.js's own source). A citation like "Exodo 20:1-17" starts with
// "Exod", which its regex happily matches even though the visible word is
// Filipino -- producing a second, stray, differently-encoded BibleGateway
// link/tooltip right inside the cue, duplicating the deliberate one already
// on the Section's own header line (ScriptureCitationLink). An href-less <a>
// has no navigation, isn't focusable, and isn't announced as a link by
// screen readers -- visually and behaviorally identical to the <span> it
// replaces, it just happens to be a tag BGLinks knows to leave alone.
function VerbalCueBody({ runs, rubric = false }: { runs: VerbalCueRun[]; rubric?: boolean }): React.ReactElement {
  return (
    <p
      className={
        rubric
          ? "font-serif-body text-[16px] leading-[1.6] text-text-primary italic whitespace-pre-wrap text-justify"
          : "font-serif-body text-[16px] leading-[1.6] text-text-primary whitespace-pre-wrap text-justify"
      }
    >
      {runs.map((run, i) =>
        run.citation ? (
          <a key={i} className="text-citation">
            {run.text}
          </a>
        ) : (
          <span key={i}>{run.text}</span>
        )
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
  initialMarks: TextMark[];
  // Track B (2026-08-31): audience is now a per-placement fact (this
  // Section instance's own PrayerItem.leaderOnly), not a property of the
  // shared library Prayer -- see prayerKindPolicy.ts.
  initialLeaderOnly: boolean;
  isSaving: boolean;
  error: string | null;
  // v3: only a Compiler ever sees the "save to my Library" checkbox -- a
  // Curator edits the shared master directly via the Library page instead.
  offerPersonalLibrarySave: boolean;
  onSubmit: (text: string, marks: TextMark[], leaderOnly: boolean, saveToPersonalLibrary: boolean) => void;
  onCancel: () => void;
}

function PrayerEditForm({
  initialText,
  initialMarks,
  initialLeaderOnly,
  isSaving,
  error,
  offerPersonalLibrarySave,
  onSubmit,
  onCancel,
}: PrayerEditFormProps): React.ReactElement {
  const [text, setText] = useState(initialText);
  const [marks, setMarks] = useState<TextMark[]>(initialMarks);
  const [leaderOnly, setLeaderOnly] = useState(initialLeaderOnly);
  const [saveToPersonalLibrary, setSaveToPersonalLibrary] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="flex flex-col gap-2">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          setMarks((prev) => shiftMarksForEdit(text, e.target.value, prev));
          setText(e.target.value);
        }}
        rows={4}
        className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
      />
      <MarkEditor
        text={text}
        marks={marks}
        onMarksChange={setMarks}
        availableMarks={[]}
        textareaRef={textareaRef}
      />
      <p className="text-[13px] text-text-muted">
        Editing here only changes this one placement -- the shared Library entry is never touched.
      </p>
      <label className="flex items-center gap-2 text-[13px] font-medium text-text-secondary">
        <input type="checkbox" checked={!leaderOnly} onChange={(e) => setLeaderOnly(!e.target.checked)} />
        Corporate (whole church prays it — Bulletin + Guide). Off means Leader/minister’s own material — Guide only.
      </label>
      {offerPersonalLibrarySave && (
        <label className="flex items-center gap-2 text-[13px] font-medium text-text-secondary">
          <input
            type="checkbox"
            checked={saveToPersonalLibrary}
            onChange={(e) => setSaveToPersonalLibrary(e.target.checked)}
          />
          Also save this version to My Library, for reuse elsewhere
        </label>
      )}
      {error && <p className="text-sm text-error">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(text, marks, leaderOnly, saveToPersonalLibrary)}
          disabled={isSaving}
          className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="self-start inline-flex items-center gap-1 bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
        >
          <XIcon size={15} /> Cancel
        </button>
      </div>
    </div>
  );
}

interface SongEditFormProps {
  initialTitle: string;
  initialAttribution: string;
  initialYearPublished: string;
  initialNotes: string;
  initialAmenExpected: boolean;
  amenPolicy: AmenPolicy;
  isSaving: boolean;
  error: string | null;
  offerPersonalLibrarySave: boolean;
  onSubmit: (
    title: string,
    attribution: string,
    yearPublished: string,
    notes: string,
    amenExpected: boolean,
    saveToPersonalLibrary: boolean
  ) => void;
  onCancel: () => void;
}

// v3: Song had no edit-in-place path at all until now (only add/remove) --
// a lightweight form (title/attribution/year/notes only, no Section/kind/
// translation-pairing -- those don't make sense mid-liturgy) mirroring
// PrayerEditForm's shape, including the same Personal Library checkbox.
function SongEditForm({
  initialTitle,
  initialAttribution,
  initialYearPublished,
  initialNotes,
  initialAmenExpected,
  amenPolicy,
  isSaving,
  error,
  offerPersonalLibrarySave,
  onSubmit,
  onCancel,
}: SongEditFormProps): React.ReactElement {
  const [title, setTitle] = useState(initialTitle);
  const [attribution, setAttribution] = useState(initialAttribution);
  const [yearPublished, setYearPublished] = useState(initialYearPublished);
  const [notes, setNotes] = useState(initialNotes);
  const [amenExpected, setAmenExpected] = useState(initialAmenExpected);
  const [saveToPersonalLibrary, setSaveToPersonalLibrary] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="song-item-title">
          Title
        </label>
        <input
          id="song-item-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="song-item-attribution">
          Versification/Author
        </label>
        <input
          id="song-item-attribution"
          value={attribution}
          onChange={(e) => setAttribution(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="song-item-year">
          Year published (optional)
        </label>
        <input
          id="song-item-year"
          value={yearPublished}
          onChange={(e) => setYearPublished(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="song-item-notes">
          Notes (optional, Leader Guide only)
        </label>
        <textarea
          id="song-item-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>
      <p className="text-[13px] text-text-muted">
        Editing here only changes this one placement -- the shared Library entry is never touched.
      </p>
      {amenPolicy !== "none" && (
        <label className="flex items-center gap-2 text-[13px] font-medium text-text-secondary">
          <input
            type="checkbox"
            checked={amenExpected}
            onChange={(e) => setAmenExpected(e.target.checked)}
          />
          Customarily ends in a sung Amen (Leader Guide only)
        </label>
      )}
      {offerPersonalLibrarySave && (
        <label className="flex items-center gap-2 text-[13px] font-medium text-text-secondary">
          <input
            type="checkbox"
            checked={saveToPersonalLibrary}
            onChange={(e) => setSaveToPersonalLibrary(e.target.checked)}
          />
          Also save this version to My Library, for reuse elsewhere
        </label>
      )}
      {error && <p className="text-sm text-error">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(title, attribution, yearPublished, notes, amenExpected, saveToPersonalLibrary)}
          disabled={isSaving}
          className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="self-start inline-flex items-center gap-1 bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
        >
          <XIcon size={15} /> Cancel
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
  currentUser,
}: SectionCardProps): React.ReactElement {
  const router = useRouter();
  const sectionFormulas = formulas.filter((f) => f.sectionName === section.name);
  const sectionScriptureSelections = scriptureSelections.filter((s) => s.sectionName === section.name);
  // `isGuide` entries are reference
  // material, never placeable as an actual liturgy item -- keep them out of
  // AddPrayerPanel's picker entirely.
  //
  // task 6: also exclude another Compiler's private drafts/forks entirely --
  // a null ownerId (shared/canonical) or the CURRENT user's own ownerId
  // passes; anyone else's owned row (someone else's unpromoted proposal)
  // never should have appeared in this picker for anyone but its owner.
  const isVisibleToCurrentUser = (ownerId: string | null | undefined): boolean =>
    !ownerId || ownerId === currentUser?.id;
  const sectionPrayers = prayers.filter(
    (p) => p.sectionName === section.name && !p.isGuide && isVisibleToCurrentUser(p.ownerId)
  );
  const sectionGuides = prayers.filter((p) => p.sectionName === section.name && p.isGuide);
  const sectionPsalms = songs.filter(
    (s) => s.sectionNames.includes(section.name) && s.kind === "psalm" && isVisibleToCurrentUser(s.ownerId)
  );
  const sectionHymns = songs.filter(
    (s) => s.sectionNames.includes(section.name) && s.kind === "hymn" && isVisibleToCurrentUser(s.ownerId)
  );
  // Only one Add panel or item editor can be open in a Section at once --
  // clicking a second "+ X" button while a first one
  // was still open left both stacked, and repeating this across several
  // Sections/items produced a long run of open panels stretching down the
  // page. `openTarget` replaces what used to be eight independent booleans
  // plus `editingItemId`, so opening or editing anything new necessarily
  // replaces whatever was open before, never adds to it. `isDirtyRef` is a
  // best-effort "did the user actually type/select anything in the panel
  // that's about to be replaced" signal -- fed by a capture-phase
  // input/change listener on each panel/editor's own wrapper (see
  // `dirtyCaptureProps` below) rather than by threading a prop through
  // every Add panel and edit form. It won't catch a mark-only edit (e.g.
  // toggling Bold with no text typed) as dirty -- an accepted, narrow gap
  // rather than instrumenting every child component individually.
  const [openTarget, setOpenTarget] = useState<OpenTarget>(null);
  const isDirtyRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editingItemId = openTarget?.type === "edit" ? openTarget.itemId : null;
  const isAddingExistingSelection = openTarget?.type === "panel" && openTarget.key === "addExistingSelection";
  const isChoosingVesperReading = openTarget?.type === "panel" && openTarget.key === "vesperReading";
  const isAddingFormula = openTarget?.type === "panel" && openTarget.key === "addFormula";
  const isAddingVerbalCue = openTarget?.type === "panel" && openTarget.key === "addVerbalCue";
  const isAddingPrayer = openTarget?.type === "panel" && openTarget.key === "addPrayer";
  const isAddingSermon = openTarget?.type === "panel" && openTarget.key === "addSermon";
  const isAddingPsalm = openTarget?.type === "panel" && openTarget.key === "addPsalm";
  const isAddingHymn = openTarget?.type === "panel" && openTarget.key === "addHymn";

  // Opening a different panel/editor while the current one has unsaved
  // input confirms before discarding it. Re-clicking the trigger for
  // whatever's already open closes it (same convenience the old per-button
  // toggle had). Confirmed via `window.confirm` -- matches this codebase's
  // one other destructive-action confirm (`handleRemoveItem` below), not a
  // new pattern.
  const requestOpenChange = (next: OpenTarget): void => {
    const isSameAsCurrent =
      openTarget !== null &&
      next !== null &&
      ((openTarget.type === "panel" && next.type === "panel" && openTarget.key === next.key) ||
        (openTarget.type === "edit" && next.type === "edit" && openTarget.itemId === next.itemId));
    const resolvedNext = isSameAsCurrent ? null : next;

    if (openTarget !== null && isDirtyRef.current) {
      const proceed = window.confirm(
        "This will discard what you've started here. Continue?"
      );
      if (!proceed) return;
    }

    setError(null);
    isDirtyRef.current = false;
    setOpenTarget(resolvedNext);
  };

  const closeOpenTarget = (): void => {
    isDirtyRef.current = false;
    setOpenTarget(null);
  };

  const markOpenTargetDirty = (): void => {
    isDirtyRef.current = true;
  };

  // Spread onto the wrapper around whichever panel/editor is currently
  // rendered -- capture phase so it fires on any descendant input/select/
  // textarea/checkbox without each panel needing to wire it up itself.
  const dirtyCaptureProps = {
    onInputCapture: markOpenTargetDirty,
    onChangeCapture: markOpenTargetDirty,
  };

  const hasSermon = section.items.some((item) => item.type === "sermon");
  // Feature 23: item_types is missing only if a Section somehow predates the
  // migration -- fall back to every type rather than silently hiding Add
  // buttons in that case.
  const allowedTypes = section.item_types ?? ALL_ITEM_TYPES;

  // Every Selection's citation in
  // this Section moves up onto the Section-name line (matching the reference
  // bulletin's "reference shares the heading line, right-aligned" layout)
  // instead of repeating as its own label line in the items list below --
  // applies even when a Formula is mixed in with one or more Selections
  // (e.g. Assurance of Pardon). Multiple citations join
  // with "; "; every other item type (Formula, Cue, Prayer, Sermon, Song)
  // keeps its own per-item label rendering, unaffected.
  const selectionItems = section.items.filter((item) => item.type === "selection");
  const creedFormulaItem = section.items.find((item) => item.type === "formula") ?? null;
  const showCreedTitleInHeader =
    selectionItems.length === 0 && TITLE_IN_HEADER_SECTIONS.includes(section.name) && creedFormulaItem !== null;
  const songItems = section.items.filter((item) => item.type === "song");
  const headerSongItem =
    selectionItems.length === 0 && !showCreedTitleInHeader && songItems.length === 1 ? songItems[0] : null;
  // Prefer the item's own snapshot (see SongItem's comment) over a live
  // lookup, so an already-compiled liturgy's header doesn't silently
  // change if the Library's Song entry is edited later. Falls back to a
  // live lookup only for a liturgy placed before this fix shipped.
  const headerSong =
    headerSongItem?.title !== undefined && headerSongItem?.kind !== undefined
      ? { title: headerSongItem.title, kind: headerSongItem.kind }
      : headerSongItem
        ? songs.find((s) => s.id === headerSongItem.songId)
        : null;
  const selectionCitations = selectionItems.map((item) => ({
    text: displayCitation(formatCitation(item.citation), item.translation),
    translation: item.translation ?? "fil",
  }));
  const headerReference =
    selectionItems.length > 0
      ? {
          text: selectionCitations.map((c) => c.text).join("; "),
          citations: selectionCitations,
          citationColor: true,
          smallCaps: true,
        }
      : showCreedTitleInHeader
        ? {
            text: resolveItemText(creedFormulaItem!, formulas, prayers, songs).label ?? "",
            citations: undefined,
            citationColor: false,
            smallCaps: false,
          }
        : headerSong
          ? {
              text: formatCitation(headerSong.title),
              citations: undefined,
              citationColor: headerSong.kind === "psalm",
              smallCaps: false,
              italic: true,
            }
          : null;

  // When a Section draws from more than one
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
  // Track B: merging is opt-in (section.mergeSelections) on the three named
  // Sections; every other Section (Assurance of Pardon included) keeps the
  // old unconditional behavior -- see naturalFlowSections.ts. Mirrors
  // prepareSectionRender.ts's identical gating so the two can't drift.
  const isNaturalFlowToggleGated = NATURAL_FLOW_TOGGLE_SECTIONS.includes(section.name);
  const shouldMergeSelections =
    selectionItems.length > 1 &&
    !isAnySelectionBeingEdited &&
    (!isNaturalFlowToggleGated || section.mergeSelections);
  let combinedSelectionText = "";
  const combinedSelectionMarks: TextMark[] = [];
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
    rubric: boolean,
    textAlternate: string,
    showAlternate: boolean
  ): void => {
    setIsSaving(true);
    setError(null);
    addVerbalCue(liturgyId, sectionIndex, text, visibility, rubric, textAlternate, showAlternate).then((result) => {
      setIsSaving(false);
      if (result.success) {
        closeOpenTarget();
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
    rubric: boolean,
    textAlternate: string,
    showAlternate: boolean
  ): void => {
    setIsSaving(true);
    setError(null);
    updateVerbalCue(liturgyId, sectionIndex, itemId, text, visibility, rubric, textAlternate, showAlternate).then(
      (result) => {
        setIsSaving(false);
        if (result.success) {
          closeOpenTarget();
          router.refresh();
        } else {
          setError(result.error ?? "Unable to update this Verbal Cue right now.");
        }
      }
    );
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
        closeOpenTarget();
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
        closeOpenTarget();
        router.refresh();
      } else {
        setError(result.error ?? "Unable to update this Scripture item right now.");
      }
    });
  };

  const handleSavePrayerEdit = (
    itemId: string,
    text: string,
    marks: TextMark[],
    leaderOnly: boolean,
    saveToPersonalLibrary: boolean
  ): void => {
    setIsSaving(true);
    setError(null);
    updatePrayerItem(liturgyId, sectionIndex, itemId, text, marks, leaderOnly, saveToPersonalLibrary).then((result) => {
      setIsSaving(false);
      if (result.success) {
        closeOpenTarget();
        router.refresh();
      } else {
        setError(result.error ?? "Unable to update this Prayer right now.");
      }
    });
  };

  const handleSaveSongEdit = (
    itemId: string,
    title: string,
    attribution: string,
    yearPublished: string,
    notes: string,
    amenExpected: boolean,
    saveToPersonalLibrary: boolean
  ): void => {
    setIsSaving(true);
    setError(null);
    updateSongItem(
      liturgyId,
      sectionIndex,
      itemId,
      title,
      attribution,
      yearPublished,
      notes,
      amenExpected,
      saveToPersonalLibrary
    ).then(
      (result) => {
        setIsSaving(false);
        if (result.success) {
          closeOpenTarget();
          router.refresh();
        } else {
          setError(result.error ?? "Unable to update this Song right now.");
        }
      }
    );
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

  const handleSaveSermon = (fields: { title: string; series: string; passage: string; preacher: string }): void => {
    setIsSaving(true);
    setError(null);
    saveSermon(liturgyId, sectionIndex, fields).then((result) => {
      setIsSaving(false);
      if (result.success) {
        closeOpenTarget();
        router.refresh();
      } else {
        setError(result.error ?? "Unable to save the Sermon right now.");
      }
    });
  };

  return (
    <div id={`section-${sectionIndex}`} className="flex flex-col gap-2 scroll-mt-6">
      <div className="flex items-baseline justify-between gap-x-4 gap-y-1 flex-wrap">
        <h2 className="font-serif-body text-[16px] font-bold uppercase text-text-primary">
          {sectionTitle(section, songs, formulas)}
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
            {headerReference.citations
              ? headerReference.citations.map((citation, citationIndex) => (
                  <span key={citation.text}>
                    {citationIndex > 0 && "; "}
                    <ScriptureCitationLink citation={citation.text} translation={citation.translation} />
                  </span>
                ))
              : headerReference.text}
          </p>
        )}
      </div>
      {/* Hidden entirely for an anonymous visitor -- every "Add X" action
          behind these buttons now requires login (task 33), so showing them
          only to fail on click would be the same false affordance already
          fixed for the Library's own Edit/Delete/New buttons. */}
      {currentUser && (
      <div className="flex items-center gap-2 flex-wrap">
        {allowedTypes.includes("selection") && (
          <>
            <Link href={`/reader?liturgyId=${liturgyId}&sectionIndex=${sectionIndex}`} className={addButtonClass}>
              <PlusIcon size={13} /> Scripture
            </Link>
            {/* 2026-08-26: "+ From Library" removed for the four
                VESPER_TABLE_SECTIONS -- their content is fully enumerable by
                the fixed rotation list "+ Reading" already exposes, so the
                general cross-Section Scripture Library picker was pure
                redundancy here, not a second real option. "+ Scripture"
                (the Reader) stays as the genuine escape hatch for a real
                pastoral exception outside the fixed list. */}
            {!VESPER_TABLE_SECTIONS.includes(section.name) && (
              <button
                type="button"
                onClick={() => requestOpenChange({ type: "panel", key: "addExistingSelection" })}
                className={addButtonClass}
              >
                <PlusIcon size={13} /> From Library
              </button>
            )}
            {VESPER_TABLE_SECTIONS.includes(section.name) && (
              <button
                type="button"
                onClick={() => requestOpenChange({ type: "panel", key: "vesperReading" })}
                className={addButtonClass}
              >
                <PlusIcon size={13} /> Reading
              </button>
            )}
          </>
        )}
        {allowedTypes.includes("formula") && (
          <button
            type="button"
            onClick={() => requestOpenChange({ type: "panel", key: "addFormula" })}
            className={addButtonClass}
          >
            <PlusIcon size={13} /> Formula
          </button>
        )}
        {allowedTypes.includes("verbal_cue") && (
          <button
            type="button"
            onClick={() => requestOpenChange({ type: "panel", key: "addVerbalCue" })}
            className={addButtonClass}
          >
            <PlusIcon size={13} /> Cue
          </button>
        )}
        {allowedTypes.includes("prayer") && (
          <button
            type="button"
            onClick={() => requestOpenChange({ type: "panel", key: "addPrayer" })}
            className={addButtonClass}
          >
            <PlusIcon size={13} /> Prayer
          </button>
        )}
        {allowedTypes.includes("sermon") && !hasSermon && (
          <button
            type="button"
            onClick={() => requestOpenChange({ type: "panel", key: "addSermon" })}
            className={addButtonClass}
          >
            <PlusIcon size={13} /> Sermon
          </button>
        )}
        {allowedTypes.includes("song") && (
          <>
            <button
              type="button"
              onClick={() => requestOpenChange({ type: "panel", key: "addPsalm" })}
              className={addButtonClass}
            >
              <PlusIcon size={13} /> Psalm
            </button>
            <button
              type="button"
              onClick={() => requestOpenChange({ type: "panel", key: "addHymn" })}
              className={addButtonClass}
            >
              <PlusIcon size={13} /> Hymn
            </button>
          </>
        )}
      </div>
      )}

      {PRAYER_GUIDE_SECTIONS.includes(section.name) && (
        <PrayerGuidePanel
          guides={sectionGuides}
          liturgyId={liturgyId}
          sectionIndex={sectionIndex}
          showPrayerGuide={section.showPrayerGuide}
          canEdit={currentUser !== null}
        />
      )}

      {isAddingExistingSelection && (
        <div
          className="mb-4 transition-[opacity,transform] duration-[var(--duration-dropdown)] ease-[var(--ease-out-strong)] starting:opacity-0 motion-safe:starting:-translate-y-1"
          {...dirtyCaptureProps}
        >
          <AddExistingSelectionPanel
            scriptureSelections={sectionScriptureSelections}
            liturgyId={liturgyId}
            sectionIndex={sectionIndex}
            amenPolicy={getAmenPolicy(section.name)}
            allowTrinitarianSeal={TRINITARIAN_SEAL_SECTIONS.includes(section.name)}
            onDone={closeOpenTarget}
          />
        </div>
      )}

      {isChoosingVesperReading && (
        <div
          className="mb-4 transition-[opacity,transform] duration-[var(--duration-dropdown)] ease-[var(--ease-out-strong)] starting:opacity-0 motion-safe:starting:-translate-y-1"
          {...dirtyCaptureProps}
        >
          <VesperReadingPanel
            sectionName={section.name}
            liturgyId={liturgyId}
            sectionIndex={sectionIndex}
            currentCitation={
              selectionItems[0] ? toEnglishCitation(formatCitation(selectionItems[0].citation)) : null
            }
            onDone={closeOpenTarget}
          />
        </div>
      )}

      {isAddingFormula && (
        <div
          className="mb-4 transition-[opacity,transform] duration-[var(--duration-dropdown)] ease-[var(--ease-out-strong)] starting:opacity-0 motion-safe:starting:-translate-y-1"
          {...dirtyCaptureProps}
        >
          <AddFormulaPanel
            formulas={sectionFormulas}
            liturgyId={liturgyId}
            sectionIndex={sectionIndex}
            onDone={closeOpenTarget}
          />
        </div>
      )}

      {isAddingVerbalCue && (
        <div
          className="mb-4 transition-[opacity,transform] duration-[var(--duration-dropdown)] ease-[var(--ease-out-strong)] starting:opacity-0 motion-safe:starting:-translate-y-1"
          {...dirtyCaptureProps}
        >
          <VerbalCueForm
            initialText=""
            initialVisibility="leader_only"
            allowAlternateLanguage={ALTERNATE_LANGUAGE_CUE_SECTIONS.includes(section.name)}
            isSaving={isSaving}
            error={error}
            submitLabel="Add Verbal Cue"
            onSubmit={handleAddVerbalCue}
            onCancel={closeOpenTarget}
          />
        </div>
      )}

      {isAddingPrayer && (
        <div
          className="mb-4 transition-[opacity,transform] duration-[var(--duration-dropdown)] ease-[var(--ease-out-strong)] starting:opacity-0 motion-safe:starting:-translate-y-1"
          {...dirtyCaptureProps}
        >
          <AddPrayerPanel
            prayers={sectionPrayers}
            currentUserId={currentUser?.id ?? null}
            sectionName={section.name}
            liturgyId={liturgyId}
            sectionIndex={sectionIndex}
            onDone={closeOpenTarget}
          />
        </div>
      )}

      {isAddingSermon && (
        <div
          className="mb-4 transition-[opacity,transform] duration-[var(--duration-dropdown)] ease-[var(--ease-out-strong)] starting:opacity-0 motion-safe:starting:-translate-y-1"
          {...dirtyCaptureProps}
        >
          <SermonForm
            initialTitle=""
            initialSeries=""
            initialPassage=""
            initialPreacher=""
            isSaving={isSaving}
            error={error}
            submitLabel="Add Sermon"
            onSubmit={handleSaveSermon}
            onCancel={closeOpenTarget}
          />
        </div>
      )}

      {isAddingPsalm && (
        <div
          className="mb-4 transition-[opacity,transform] duration-[var(--duration-dropdown)] ease-[var(--ease-out-strong)] starting:opacity-0 motion-safe:starting:-translate-y-1"
          {...dirtyCaptureProps}
        >
          <AddSongPanel
            songs={sectionPsalms}
            currentUserId={currentUser?.id ?? null}
            kind="psalm"
            sectionName={section.name}
            liturgyId={liturgyId}
            sectionIndex={sectionIndex}
            onDone={closeOpenTarget}
          />
        </div>
      )}

      {isAddingHymn && (
        <div
          className="mb-4 transition-[opacity,transform] duration-[var(--duration-dropdown)] ease-[var(--ease-out-strong)] starting:opacity-0 motion-safe:starting:-translate-y-1"
          {...dirtyCaptureProps}
        >
          <AddSongPanel
            songs={sectionHymns}
            currentUserId={currentUser?.id ?? null}
            kind="hymn"
            sectionName={section.name}
            liturgyId={liturgyId}
            sectionIndex={sectionIndex}
            onDone={closeOpenTarget}
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
                        <span className="text-[11px] text-text-muted">{displayCitation(s.citation, s.translation)}</span>
                        {currentUser && (
                          <>
                            <button
                              type="button"
                              title={`Edit ${s.citation}`}
                              onClick={() => requestOpenChange({ type: "edit", itemId: s.id })}
                              className="text-text-muted hover:text-accent-dark transition-colors duration-[var(--duration-tooltip)] ease"
                            >
                              <PencilIcon size={15} />
                            </button>
                            <button
                              type="button"
                              title={`Remove ${s.citation}`}
                              onClick={() => handleRemoveItem(s.id)}
                              className="text-text-muted hover:text-error transition-colors duration-[var(--duration-tooltip)] ease"
                            >
                              <TrashIcon size={15} />
                            </button>
                          </>
                        )}
                      </span>
                    ))}
                  </div>
                  <MarkedText text={combinedSelectionText} marks={combinedSelectionMarks} />
                </li>
              );
            }

            const resolved = resolveItemText(item, formulas, prayers, songs, section.items);

            if (item.type === "selection" && editingItemId === item.id) {
              return (
                <li key={item.id} {...dirtyCaptureProps}>
                  <SelectionEditForm
                    initialCitation={item.citation}
                    initialText={item.text}
                    initialAmenExpected={item.amenExpected ?? false}
                    initialMarks={item.marks ?? []}
                    initialTrinitarianSeal={item.trinitarianSeal ?? null}
                    textOptional={REFERENCE_ONLY_SECTIONS.includes(section.name)}
                    amenPolicy={getAmenPolicy(section.name)}
                    availableMarks={getSelectionMarks(section.name)}
                    allowTrinitarianSeal={TRINITARIAN_SEAL_SECTIONS.includes(section.name)}
                    isSaving={isSaving}
                    error={error}
                    onSubmit={(citation, text, amenExpected, marks, trinitarianSeal) =>
                      handleUpdateSelectionItem(item.id, citation, text, amenExpected, marks, trinitarianSeal)
                    }
                    onCancel={closeOpenTarget}
                  />
                </li>
              );
            }

            if (item.type === "verbal_cue" && editingItemId === item.id) {
              return (
                <li key={item.id} {...dirtyCaptureProps}>
                  <VerbalCueForm
                    initialText={item.text}
                    initialVisibility={item.visibility}
                    initialRubric={item.rubric ?? false}
                    allowAlternateLanguage={ALTERNATE_LANGUAGE_CUE_SECTIONS.includes(section.name)}
                    initialTextAlternate={item.textAlternate ?? ""}
                    initialShowAlternate={item.showAlternate ?? false}
                    isSaving={isSaving}
                    error={error}
                    submitLabel="Save"
                    onSubmit={(text, visibility, rubric, textAlternate, showAlternate) =>
                      handleUpdateVerbalCue(item.id, text, visibility, rubric, textAlternate, showAlternate)
                    }
                    onCancel={closeOpenTarget}
                  />
                </li>
              );
            }

            if (item.type === "prayer" && editingItemId === item.id) {
              return (
                <li key={item.id} {...dirtyCaptureProps}>
                  <PrayerEditForm
                    initialText={resolved.text}
                    initialMarks={resolved.marks ?? []}
                    initialLeaderOnly={resolved.leaderOnly}
                    isSaving={isSaving}
                    error={error}
                    offerPersonalLibrarySave={currentUser?.role === "compiler"}
                    onSubmit={(text, marks, leaderOnly, saveToPersonalLibrary) =>
                      handleSavePrayerEdit(item.id, text, marks, leaderOnly, saveToPersonalLibrary)
                    }
                    onCancel={closeOpenTarget}
                  />
                </li>
              );
            }

            if (item.type === "song" && editingItemId === item.id) {
              return (
                <li key={item.id} {...dirtyCaptureProps}>
                  <SongEditForm
                    initialTitle={item.title ?? resolved.song?.title ?? ""}
                    initialAttribution={item.attribution ?? resolved.song?.attribution ?? ""}
                    initialYearPublished={item.yearPublished ?? resolved.song?.yearPublished ?? ""}
                    initialNotes={item.notes ?? resolved.song?.notes ?? ""}
                    initialAmenExpected={item.amenExpected ?? false}
                    amenPolicy={getAmenPolicy(section.name)}
                    isSaving={isSaving}
                    error={error}
                    offerPersonalLibrarySave={currentUser?.role === "compiler"}
                    onSubmit={(title, attribution, yearPublished, notes, amenExpected, saveToPersonalLibrary) =>
                      handleSaveSongEdit(item.id, title, attribution, yearPublished, notes, amenExpected, saveToPersonalLibrary)
                    }
                    onCancel={closeOpenTarget}
                  />
                </li>
              );
            }

            if (item.type === "formula" && editingItemId === item.id) {
              return (
                <li key={item.id} {...dirtyCaptureProps}>
                  <FormulaEditForm
                    initialText={resolveBase(item, formulas, prayers, songs).text}
                    initialVisibility={item.visibility}
                    initialMarks={item.marks ?? []}
                    initialTrinitarianSeal={item.trinitarianSeal ?? null}
                    availableMarks={getFormulaMarks(section.name, formulas.find((f) => f.id === item.formulaId)?.kind)}
                    allowTrinitarianSeal={TRINITARIAN_SEAL_SECTIONS.includes(section.name)}
                    isSaving={isSaving}
                    error={error}
                    onSubmit={(text, visibility, marks, trinitarianSeal) =>
                      handleUpdateFormulaItem(item.id, text, visibility, marks, trinitarianSeal)
                    }
                    onCancel={closeOpenTarget}
                  />
                </li>
              );
            }

            if (item.type === "sermon" && editingItemId === item.id) {
              return (
                <li key={item.id} {...dirtyCaptureProps}>
                  <SermonForm
                    initialTitle={item.title ?? ""}
                    initialSeries={item.series ?? ""}
                    initialPassage={item.passage}
                    initialPreacher={item.preacher ?? ""}
                    isSaving={isSaving}
                    error={error}
                    submitLabel="Save"
                    onSubmit={handleSaveSermon}
                    onCancel={closeOpenTarget}
                  />
                </li>
              );
            }

            const isEditable =
              item.type === "verbal_cue" ||
              item.type === "prayer" ||
              item.type === "sermon" ||
              item.type === "formula" ||
              item.type === "selection" ||
              item.type === "song";

            const labelAlreadyShownInHeader =
              (item.type === "selection" && headerReference !== null) ||
              (item === creedFormulaItem && showCreedTitleInHeader) ||
              item.type === "sermon";

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
                  {currentUser && (
                    <>
                      {isEditable && (
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => requestOpenChange({ type: "edit", itemId: item.id })}
                          className="text-text-muted hover:text-accent-dark transition-colors duration-[var(--duration-tooltip)] ease"
                        >
                          <PencilIcon size={15} />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Remove"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-text-muted hover:text-error transition-colors duration-[var(--duration-tooltip)] ease"
                      >
                        <TrashIcon size={15} />
                      </button>
                    </>
                  )}
                </div>
                {item.type === "sermon" ? (
                  <SermonBody item={item} />
                ) : item.type === "song" ? (
                  <SongTitle song={resolved.song} />
                ) : item.type === "verbal_cue" && resolved.verbalCueRuns ? (
                  <VerbalCueBody runs={resolved.verbalCueRuns} rubric={resolved.rubric} />
                ) : (
                  resolved.text &&
                  ((item.type === "selection" || item.type === "formula" || item.type === "prayer") &&
                  resolved.marks &&
                  resolved.marks.length > 0 ? (
                    <MarkedText text={resolved.text} marks={resolved.marks} />
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
      {section.name === SILENT_CONFESSION_SECTION && (
        <div className="flex flex-col items-center gap-2">
          <SilentConfessionLanguageToggle
            liturgyId={liturgyId}
            sectionIndex={sectionIndex}
            language={section.silentConfessionLanguage}
            canEdit={currentUser !== null}
          />
          <p className="font-serif-body text-[16px] leading-[1.6] text-text-primary italic text-center whitespace-pre-line">
            {SILENT_CONFESSION_RUBRIC_TEXT[section.silentConfessionLanguage]}
          </p>
        </div>
      )}
      {isNaturalFlowToggleGated && (
        <NaturalFlowToggle
          liturgyId={liturgyId}
          sectionIndex={sectionIndex}
          mergeSelections={section.mergeSelections}
          canEdit={currentUser !== null}
        />
      )}
    </div>
  );
}
