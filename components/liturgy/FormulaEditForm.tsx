"use client";

import { useEffect, useRef, useState } from "react";
import type { TextMark } from "@/types/liturgy";
import { autosizeTextarea } from "@/lib/text/autosize";
import { shiftMarksForEdit } from "@/lib/text/marks";
import MarkEditor from "@/components/liturgy/MarkEditor";

interface FormulaEditFormProps {
  initialText: string;
  initialVisibility: "both" | "leader_only";
  initialMarks: TextMark[];
  initialTrinitarianSeal: "en" | "fil" | null;
  // Feature 25: which mark buttons to offer -- Minister-only Sections
  // (Assurance of Pardon, Charge, Great Commission, Benediction) get just
  // "minister"; Vesper's Church Covenant portion gets the full
  // Leader/Congregation/Small-Caps set, matching redesign-plan-v1.1.md §U.
  availableMarks: Exclude<TextMark["type"], "bold">[];
  // Trinitarian Seal, extended from Benediction-only (2026-07-20) -- true for
  // Sections whose Formula instance may close with the fixed seal line, e.g.
  // Assurance of Pardon's Absolution.
  allowTrinitarianSeal?: boolean;
  isSaving: boolean;
  error: string | null;
  onSubmit: (
    text: string,
    visibility: "both" | "leader_only",
    marks: TextMark[],
    trinitarianSeal: "en" | "fil" | null
  ) => void;
  onCancel: () => void;
}

export default function FormulaEditForm({
  initialText,
  initialVisibility,
  initialMarks,
  initialTrinitarianSeal,
  availableMarks,
  allowTrinitarianSeal = false,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: FormulaEditFormProps): React.ReactElement {
  const [text, setText] = useState(initialText);
  const [visibility, setVisibility] = useState<"both" | "leader_only">(initialVisibility);
  const [marks, setMarks] = useState<TextMark[]>(initialMarks);
  const [trinitarianSeal, setTrinitarianSeal] = useState<"en" | "fil" | null>(initialTrinitarianSeal);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autosizeTextarea(textareaRef.current);
  }, [text]);

  return (
    <div className="bg-surface-secondary border border-border rounded-md p-4 flex flex-col gap-3">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          setMarks((prev) => shiftMarksForEdit(text, e.target.value, prev));
          setText(e.target.value);
        }}
        rows={4}
        className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent resize-none min-h-[96px] overflow-hidden"
      />
      <p className="text-[13px] text-text-muted">
        Editing here updates only this instance -- the Formula library entry is unchanged.
      </p>

      <MarkEditor
        text={text}
        marks={marks}
        onMarksChange={setMarks}
        availableMarks={availableMarks}
        textareaRef={textareaRef}
        allowTrinitarianSeal={allowTrinitarianSeal}
        trinitarianSeal={trinitarianSeal}
        onTrinitarianSealChange={setTrinitarianSeal}
      />

      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="formula-item-visibility">
          Visibility
        </label>
        <select
          id="formula-item-visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as "both" | "leader_only")}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        >
          <option value="both">Both (Guide + Bulletin)</option>
          <option value="leader_only">Leader only</option>
        </select>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(text, visibility, marks, trinitarianSeal)}
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
