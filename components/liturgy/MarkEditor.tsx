"use client";

import { useState, type RefObject } from "react";
import type { TextMark } from "@/types/liturgy";
import MarkedText from "@/components/liturgy/MarkedText";
import { applyTrinitarianSeal } from "@/lib/liturgy/trinitarianSeal";
import { toggleBoldSelection } from "@/lib/text/toggleBold";
import { shiftMarksForEdit } from "@/lib/text/marks";
import { ClearIcon, NoteIcon } from "@/components/liturgy/icons";

interface MarkEditorProps {
  text: string;
  marks: TextMark[];
  onMarksChange: (marks: TextMark[]) => void;
  // 2026-07-21: Bold moved in here too, alongside Congregation/Minister/
  // Small-Caps/Seal, so every one of these sits on the same toolbar row
  // instead of Bold living as a separate button above/below in each of
  // AddSelectionPanel/SelectionEditForm/FormulaEditForm/PrayerEditForm. Needs
  // a way to update the text itself (the other buttons only ever touch
  // marks), hence this new callback.
  onTextChange: (text: string) => void;
  availableMarks: TextMark["type"][];
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  // 2026-07-20: folded the Trinitarian Seal toggle into this same toolbar +
  // preview instead of AddSelectionPanel/SelectionEditForm/FormulaEditForm
  // each carrying their own separate radio group and duplicate preview --
  // the seal is just another thing that changes what gets previewed, same
  // as a mark. Omit allowTrinitarianSeal (or leave it false) for any form
  // that doesn't need it.
  allowTrinitarianSeal?: boolean;
  trinitarianSeal?: "en" | "fil" | null;
  onTrinitarianSealChange?: (value: "en" | "fil" | null) => void;
}

const MARK_BUTTON_LABELS: Record<TextMark["type"], string> = {
  leader: "Leader",
  congregation: "Congregation",
  minister: "Minister",
  small_caps: "Small Caps",
};

const SEAL_CYCLE: ("en" | "fil" | null)[] = [null, "fil", "en"];
const SEAL_BUTTON_LABELS: Record<"en" | "fil" | "off", string> = {
  off: "Seal",
  fil: "Seal: Filipino",
  en: "Seal: English",
};

// Shared Leader/Congregation/Minister/Small-Caps toolbar + always-visible
// live preview, used by every place that marks item text (Add Scripture,
// editing a placed Scripture item, editing a placed Formula item). The
// preview renders regardless of whether this Section has any marking
// toolbar at all (`availableMarks` empty) -- it's the only way to see
// **bold** congregational-response formatting take effect before saving,
// since a plain <textarea> can't render markdown itself; hiding the whole
// component when there was no toolbar (the original behavior) made Bold
// look like it silently didn't work anywhere outside a markable Section.
export default function MarkEditor({
  text,
  marks,
  onMarksChange,
  onTextChange,
  availableMarks,
  textareaRef,
  allowTrinitarianSeal = false,
  trinitarianSeal = null,
  onTrinitarianSealChange,
}: MarkEditorProps): React.ReactElement {
  const [showHelp, setShowHelp] = useState(false);

  const applyMark = (type: TextMark["type"]): void => {
    const el = textareaRef.current;
    if (!el || el.selectionStart === el.selectionEnd) return;
    const { selectionStart: start, selectionEnd: end } = el;
    onMarksChange([...marks.filter((m) => end <= m.start || start >= m.end), { start, end, type }]);
  };

  const toggleBold = (): void => {
    const el = textareaRef.current;
    if (!el || el.selectionStart === el.selectionEnd) return;
    const newText = toggleBoldSelection(text, el.selectionStart, el.selectionEnd);
    onMarksChange(shiftMarksForEdit(text, newText, marks));
    onTextChange(newText);
  };

  const clearMarksInSelection = (): void => {
    const el = textareaRef.current;
    if (!el || el.selectionStart === el.selectionEnd) return;
    const { selectionStart: start, selectionEnd: end } = el;
    onMarksChange(marks.filter((m) => end <= m.start || start >= m.end));
  };

  const cycleSeal = (): void => {
    if (!onTrinitarianSealChange) return;
    const next = SEAL_CYCLE[(SEAL_CYCLE.indexOf(trinitarianSeal) + 1) % SEAL_CYCLE.length];
    onTrinitarianSealChange(next);
  };

  const preview = applyTrinitarianSeal(text, marks, trinitarianSeal);

  return (
    <div className="flex flex-col gap-2">
      {
        // 2026-07-21: Bold is universal (every Section renders **bold**
        // regardless of whether it has a Leader/Congregation/Minister/Small-
        // Caps toolbar), so this row can no longer be hidden just because
        // availableMarks is empty and allowTrinitarianSeal is off -- Bold
        // alone is reason enough for the row to always render.
      }
      <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={toggleBold}
            aria-label="Bold"
            title="Bold"
            className="rounded-md border border-border w-7 h-7 flex items-center justify-center text-[13px] font-bold text-text-secondary bg-transparent hover:bg-surface-secondary"
          >
            B
          </button>
          {availableMarks.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => applyMark(type)}
              className="rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-accent-dark bg-transparent hover:bg-accent-dark hover:text-accent-foreground"
            >
              {MARK_BUTTON_LABELS[type]}
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
