"use client";

import { useEffect, useRef, useState } from "react";
import { autosizeTextarea } from "@/lib/text/autosize";
import { shiftMarksForEdit } from "@/lib/text/marks";
import MarkEditor from "@/components/liturgy/MarkEditor";
import type { TextMark } from "@/types/liturgy";

interface PrayerFormProps {
  sectionNames: string[];
  initialSectionName: string;
  initialText: string;
  initialKind?: "prayer" | "guide";
  initialMarks?: TextMark[];
  isSaving: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (sectionName: string, text: string, kind: "prayer" | "guide", marks: TextMark[]) => void;
  onCancel?: () => void;
}

// 2026-07-23: Prayer never had a marking toolbar at all -- Bold could only
// be typed by hand as raw asterisks, with no button and (before Bold became
// a real mark) nowhere to persist it anyway. Bold-only here (no availableMarks
// -- Congregation/Minister/Small-Caps stay scoped to the Sections that
// actually need them, per markableSections.ts), same as every other library
// form's toolbar.
export default function PrayerForm({
  sectionNames,
  initialSectionName,
  initialText,
  initialKind = "prayer",
  initialMarks = [],
  isSaving,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: PrayerFormProps): React.ReactElement {
  const [sectionName, setSectionName] = useState(initialSectionName || sectionNames[0] || "");
  const [text, setText] = useState(initialText);
  const [kind, setKind] = useState<"prayer" | "guide">(initialKind);
  const [marks, setMarks] = useState<TextMark[]>(initialMarks);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autosizeTextarea(textareaRef.current);
  }, [text]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="prayer-section">
          Section
        </label>
        <select
          id="prayer-section"
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        >
          {sectionNames.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="prayer-kind">
          Kind
        </label>
        <select
          id="prayer-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as "prayer" | "guide")}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        >
          <option value="prayer">Prayer (placeable in a liturgy)</option>
          <option value="guide">Guide (reference outline only, per redesign-plan-v1.1.md §W)</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="prayer-text">
          Text
        </label>
        <textarea
          id="prayer-text"
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setMarks((prev) => shiftMarksForEdit(text, e.target.value, prev));
            setText(e.target.value);
          }}
          rows={8}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent resize-none min-h-[180px] overflow-hidden"
        />
      </div>
      <MarkEditor text={text} marks={marks} onMarksChange={setMarks} availableMarks={[]} textareaRef={textareaRef} />
      {error && <p className="text-sm text-error">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(sectionName, text, kind, marks)}
          disabled={isSaving}
          className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="self-start bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
