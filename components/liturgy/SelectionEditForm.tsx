"use client";

import { useEffect, useRef, useState } from "react";
import type { TextMark } from "@/types/liturgy";
import { autosizeTextarea } from "@/lib/text/autosize";
import { shiftMarksForEdit } from "@/lib/text/marks";
import CitationField from "@/components/liturgy/CitationField";
import MarkEditor from "@/components/liturgy/MarkEditor";
import { XIcon } from "@/components/liturgy/icons";

interface SelectionEditFormProps {
  initialCitation: string;
  initialText: string;
  initialAmenExpected: boolean;
  initialMarks: TextMark[];
  initialTrinitarianSeal: "en" | "fil" | null;
  textOptional: boolean;
  isSongSlot: boolean;
  availableMarks: Exclude<TextMark["type"], "bold">[];
  allowTrinitarianSeal: boolean;
  isSaving: boolean;
  error: string | null;
  onSubmit: (
    citation: string,
    text: string,
    amenExpected: boolean,
    marks: TextMark[],
    trinitarianSeal: "en" | "fil" | null
  ) => void;
  onCancel: () => void;
}

// The edit path for an already-placed Selection item -- until now Selection
// was the only item type with no way back in once saved, which was the real
// cause behind "I can't apply Small Caps after using Congregation": there
// was nowhere to reopen the marking toolbar. Mirrors FormulaEditForm's shape.
export default function SelectionEditForm({
  initialCitation,
  initialText,
  initialAmenExpected,
  initialMarks,
  initialTrinitarianSeal,
  textOptional,
  isSongSlot,
  availableMarks,
  allowTrinitarianSeal,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: SelectionEditFormProps): React.ReactElement {
  const [citation, setCitation] = useState(initialCitation);
  const [text, setText] = useState(initialText);
  const [amenExpected, setAmenExpected] = useState(initialAmenExpected);
  const [marks, setMarks] = useState<TextMark[]>(initialMarks);
  const [trinitarianSeal, setTrinitarianSeal] = useState<"en" | "fil" | null>(initialTrinitarianSeal);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autosizeTextarea(textareaRef.current);
  }, [text]);

  return (
    <div className="bg-surface-secondary border border-border rounded-md p-4 flex flex-col gap-3">
      <CitationField value={citation} onChange={setCitation} />
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="selection-edit-text">
          {textOptional ? "Text (optional — this Section is read aloud in full)" : "Text"}
        </label>
        <textarea
          id="selection-edit-text"
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setMarks((prev) => shiftMarksForEdit(text, e.target.value, prev));
            setText(e.target.value);
          }}
          rows={3}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent resize-none min-h-[96px] overflow-hidden"
        />
      </div>

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

      {isSongSlot && (
        <label className="flex items-center gap-2 text-[13px] font-medium text-text-secondary">
          <input
            type="checkbox"
            checked={amenExpected}
            onChange={(e) => setAmenExpected(e.target.checked)}
          />
          Customarily ends in a sung Amen (Leader Guide only)
        </label>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(citation, text, amenExpected, marks, trinitarianSeal)}
          disabled={isSaving}
          className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="self-start inline-flex items-center gap-1 bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          <XIcon size={15} /> Cancel
        </button>
      </div>
    </div>
  );
}
