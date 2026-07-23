"use client";

import { useState, type RefObject } from "react";
import type { TextMark } from "@/types/liturgy";
import MarkedText from "@/components/liturgy/MarkedText";
import { applyTrinitarianSeal } from "@/lib/liturgy/trinitarianSeal";
import { ClearIcon, NoteIcon } from "@/components/liturgy/icons";

type ExclusiveMark = "leader" | "congregation" | "minister";
type OverlayMark = "bold" | "small_caps";

interface MarkEditorProps {
  text: string;
  marks: TextMark[];
  onMarksChange: (marks: TextMark[]) => void;
  availableMarks: Exclude<TextMark["type"], "bold">[];
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  // Folds the Trinitarian Seal toggle into this same toolbar +
  // preview instead of AddSelectionPanel/SelectionEditForm/FormulaEditForm
  // each carrying their own separate radio group and duplicate preview --
  // the seal is just another thing that changes what gets previewed, same
  // as a mark. Omit allowTrinitarianSeal (or leave it false) for any form
  // that doesn't need it.
  allowTrinitarianSeal?: boolean;
  trinitarianSeal?: "en" | "fil" | null;
  onTrinitarianSealChange?: (value: "en" | "fil" | null) => void;
}

const EXCLUSIVE_MARK_LABELS: Record<ExclusiveMark, string> = {
  leader: "Leader",
  congregation: "Congregation",
  minister: "Minister",
};

const OVERLAY_MARK_LABELS: Record<OverlayMark, string> = {
  bold: "B",
  small_caps: "Small Caps",
};

const SEAL_CYCLE: ("en" | "fil" | null)[] = [null, "fil", "en"];
const SEAL_BUTTON_LABELS: Record<"en" | "fil" | "off", string> = {
  off: "Seal",
  fil: "Seal: Filipino",
  en: "Seal: English",
};

// Shared Leader/Congregation/Minister/Small-Caps/Bold toolbar + always-
// visible live preview, used by every place that marks item text (Add
// Scripture, editing a placed Scripture item, editing a placed Formula
// item). The preview renders regardless of whether this Section has any
// exclusive-mark toolbar at all (`availableMarks` empty) -- it's the only
// way to see Bold take effect before saving, since a plain <textarea> can't
// render it itself; hiding the whole component when there was no toolbar
// (the original behavior) made Bold look like it silently didn't work
// anywhere outside a markable Section.
export default function MarkEditor({
  text,
  marks,
  onMarksChange,
  availableMarks,
  textareaRef,
  allowTrinitarianSeal = false,
  trinitarianSeal = null,
  onTrinitarianSealChange,
}: MarkEditorProps): React.ReactElement {
  const [showHelp, setShowHelp] = useState(false);

  // Only Congregation/Minister are mutually exclusive with each other (a
  // line can't be spoken by both at once) -- carving trims whatever
  // overlapping Congregation/Minister mark is there down to the parts
  // outside the new selection, instead of deleting it outright. Bold and
  // Small Caps are both independent overlays now (see toggleOverlayMark
  // below) and are never touched here.
  const applyMark = (type: ExclusiveMark): void => {
    const el = textareaRef.current;
    if (!el || el.selectionStart === el.selectionEnd) return;
    const { selectionStart: start, selectionEnd: end } = el;

    const carved: TextMark[] = [];
    for (const m of marks) {
      if (m.type === "bold" || m.type === "small_caps" || end <= m.start || start >= m.end) {
        carved.push(m);
        continue;
      }
      if (m.start < start) carved.push({ ...m, end: start });
      if (m.end > end) carved.push({ ...m, start: end });
    }
    onMarksChange([...carved, { start, end, type }]);
  };

  // Bold and Small Caps are both independent overlay marks -- Small Caps was
  // previously wrongly grouped in with Congregation/Minister as a competing "exclusive"
  // option, which meant marking a word inside an existing Congregation span
  // split that span into two separate blocks with the word sandwiched (and
  // visually isolated onto its own line) between them. Both now use this
  // same overlay toggle: an exact-range match removes the mark (the common
  // case -- reselecting exactly what you just marked); any other selection
  // adds a clean new mark instead of trying to carve up an existing larger
  // one of the same overlay type.
  const toggleOverlayMark = (type: OverlayMark): void => {
    const el = textareaRef.current;
    if (!el || el.selectionStart === el.selectionEnd) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const exactMatch = marks.some((m) => m.type === type && m.start === start && m.end === end);
    const withoutOverlapping = marks.filter((m) => m.type !== type || end <= m.start || start >= m.end);
    onMarksChange(exactMatch ? withoutOverlapping : [...withoutOverlapping, { start, end, type }]);
  };

  // Same carving as applyMark above -- clearing a small selection inside a
  // larger mark (of any type) should only clear that overlapping portion,
  // not the whole mark.
  const clearMarksInSelection = (): void => {
    const el = textareaRef.current;
    if (!el || el.selectionStart === el.selectionEnd) return;
    const { selectionStart: start, selectionEnd: end } = el;

    const carved: TextMark[] = [];
    for (const m of marks) {
      if (end <= m.start || start >= m.end) {
        carved.push(m);
        continue;
      }
      if (m.start < start) carved.push({ ...m, end: start });
      if (m.end > end) carved.push({ ...m, start: end });
    }
    onMarksChange(carved);
  };

  const cycleSeal = (): void => {
    if (!onTrinitarianSealChange) return;
    const next = SEAL_CYCLE[(SEAL_CYCLE.indexOf(trinitarianSeal) + 1) % SEAL_CYCLE.length];
    onTrinitarianSealChange(next);
  };

  const preview = applyTrinitarianSeal(text, marks, trinitarianSeal);
  const exclusiveMarks = availableMarks.filter((type): type is ExclusiveMark => type !== "small_caps");
  const hasSmallCaps = availableMarks.includes("small_caps");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => toggleOverlayMark("bold")}
          aria-label="Bold"
          title="Bold"
          className="rounded-md border border-border w-7 h-7 flex items-center justify-center text-[13px] font-bold text-text-secondary bg-transparent hover:bg-surface-secondary"
        >
          {OVERLAY_MARK_LABELS.bold}
        </button>
        {hasSmallCaps && (
          <button
            type="button"
            onClick={() => toggleOverlayMark("small_caps")}
            className="rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-accent-dark bg-transparent hover:bg-accent-dark hover:text-accent-foreground"
          >
            {OVERLAY_MARK_LABELS.small_caps}
          </button>
        )}
        {exclusiveMarks.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => applyMark(type)}
            className="rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-accent-dark bg-transparent hover:bg-accent-dark hover:text-accent-foreground"
          >
            {EXCLUSIVE_MARK_LABELS[type]}
          </button>
        ))}
        {allowTrinitarianSeal && (
          <button
            type="button"
            onClick={cycleSeal}
            className={
              trinitarianSeal
                ? "rounded-md border border-accent-dark px-2.5 py-1 text-[12px] font-medium text-accent-foreground bg-accent-dark"
                : "rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-accent-dark bg-transparent hover:bg-accent-dark hover:text-accent-foreground"
            }
          >
            {SEAL_BUTTON_LABELS[trinitarianSeal ?? "off"]}
          </button>
        )}
        {availableMarks.length > 0 && (
          <button
            type="button"
            onClick={clearMarksInSelection}
            aria-label="Clear marks in selection"
            title="Clear marks in selection"
            className="text-text-muted hover:text-accent-dark"
          >
            <ClearIcon />
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowHelp((prev) => !prev)}
          aria-label="How marking works"
          title="How marking works"
          className="text-text-muted hover:text-accent-dark"
        >
          <NoteIcon />
        </button>
      </div>
      {showHelp && (
        <p className="text-[13px] text-text-muted">
          Select a range of text above, then click a label — unmarked text stays Leader (flush
          left, no label). Marks stick through further edits; use Clear to remove one.
          {allowTrinitarianSeal && " Seal cycles Off → Filipino → English, appended at the very end."}
        </p>
      )}
      <div className="bg-surface-secondary border border-border rounded-md p-3">
        <MarkedText text={preview.text} marks={preview.marks} />
      </div>
    </div>
  );
}
