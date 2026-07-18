"use client";

import { useState, type RefObject } from "react";
import type { TextMark } from "@/types/liturgy";
import MarkedText from "@/components/liturgy/MarkedText";
import { ClearIcon, NoteIcon } from "@/components/liturgy/icons";

interface MarkEditorProps {
  text: string;
  marks: TextMark[];
  onMarksChange: (marks: TextMark[]) => void;
  availableMarks: TextMark["type"][];
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

const MARK_BUTTON_LABELS: Record<TextMark["type"], string> = {
  leader: "Leader",
  congregation: "Congregation",
  minister: "Minister",
  small_caps: "Small Caps",
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
  availableMarks,
  textareaRef,
}: MarkEditorProps): React.ReactElement {
  const [showHelp, setShowHelp] = useState(false);

  const applyMark = (type: TextMark["type"]): void => {
    const el = textareaRef.current;
    if (!el || el.selectionStart === el.selectionEnd) return;
    const { selectionStart: start, selectionEnd: end } = el;
    onMarksChange([...marks.filter((m) => end <= m.start || start >= m.end), { start, end, type }]);
  };

  const clearMarksInSelection = (): void => {
    const el = textareaRef.current;
    if (!el || el.selectionStart === el.selectionEnd) return;
    const { selectionStart: start, selectionEnd: end } = el;
    onMarksChange(marks.filter((m) => end <= m.start || start >= m.end));
  };

  return (
    <div className="flex flex-col gap-2">
      {availableMarks.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
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
          <button
            type="button"
            onClick={clearMarksInSelection}
            aria-label="Clear marks in selection"
            title="Clear marks in selection"
            className="text-text-muted hover:text-accent-dark"
          >
            <ClearIcon />
          </button>
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
      )}
      {showHelp && (
        <p className="text-[13px] text-text-muted">
          Select a range of text above, then click a label — unmarked text stays Leader (flush
          left, no label). Marks stick through further edits; use Clear to remove one.
        </p>
      )}
      <div className="bg-surface-secondary border border-border rounded-md p-3">
        <MarkedText text={text} marks={marks} />
      </div>
    </div>
  );
}
