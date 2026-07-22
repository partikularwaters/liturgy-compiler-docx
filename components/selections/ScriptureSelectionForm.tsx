"use client";

import { useEffect, useRef, useState } from "react";
import type { TextMark } from "@/types/liturgy";
import { autosizeTextarea } from "@/lib/text/autosize";
import { shiftMarksForEdit } from "@/lib/text/marks";
import { getSelectionMarks } from "@/lib/liturgy/markableSections";
import MarkEditor from "@/components/liturgy/MarkEditor";

interface ScriptureSelectionFormProps {
  sectionNames: string[];
  isSaving: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (
    sectionName: string,
    citation: string,
    text: string,
    translation: "fil" | "en",
    marks: TextMark[]
  ) => void;
}

// v2 Phase A: the direct-add counterpart to FormulaForm/PrayerForm's "New X"
// pattern -- Scripture could previously only enter the library indirectly,
// via the Reader's add-to-Section auto-save.
//
// v2 (library-level marking toolbar): marking a library Selection here
// carries onto every future placement as a starting point (see
// AddExistingSelectionPanel.tsx), same reasoning as FormulaForm.
export default function ScriptureSelectionForm({
  sectionNames,
  isSaving,
  error,
  submitLabel,
  onSubmit,
}: ScriptureSelectionFormProps): React.ReactElement {
  const [sectionName, setSectionName] = useState(sectionNames[0] ?? "");
  const [citation, setCitation] = useState("");
  const [text, setText] = useState("");
  // v2 (BSB): the companion translation (see lib/selections/
  // companionTranslation.ts) saves automatically once this is submitted --
  // no need for a second form to add the pair by hand.
  const [translation, setTranslation] = useState<"fil" | "en">("fil");
  const [marks, setMarks] = useState<TextMark[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autosizeTextarea(textareaRef.current);
  }, [text]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="scripture-section">
          Section
        </label>
        <select
          id="scripture-section"
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
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="scripture-translation">
          Translation
        </label>
        <select
          id="scripture-translation"
          value={translation}
          onChange={(e) => setTranslation(e.target.value as "fil" | "en")}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        >
          <option value="fil">AB</option>
          <option value="en">BSB</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="scripture-citation">
          Citation
        </label>
        <input
          id="scripture-citation"
          value={citation}
          onChange={(e) => setCitation(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="scripture-text">
          Text (optional — leave blank for a citation-only reading)
        </label>
        <textarea
          id="scripture-text"
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
      <MarkEditor
        text={text}
        marks={marks}
        onMarksChange={setMarks}
        onTextChange={setText}
        availableMarks={getSelectionMarks(sectionName)}
        textareaRef={textareaRef}
      />
      {error && <p className="text-sm text-error">{error}</p>}
      <button
        type="button"
        onClick={() => onSubmit(sectionName, citation, text, translation, marks)}
        disabled={isSaving}
        className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {isSaving ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}
