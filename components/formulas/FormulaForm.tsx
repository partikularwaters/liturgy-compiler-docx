"use client";

import { useEffect, useRef, useState } from "react";
import type { Formula, TextMark } from "@/types/liturgy";
import { autosizeTextarea } from "@/lib/text/autosize";
import { shiftMarksForEdit } from "@/lib/text/marks";
import { getFormulaMarks } from "@/lib/liturgy/markableSections";
import MarkEditor from "@/components/liturgy/MarkEditor";
import TranslationPairFields from "@/components/library/TranslationPairFields";

interface FormulaFormProps {
  sectionNames: string[];
  initialSectionName: string;
  initialName: string;
  initialDefaultText: string;
  initialMarks?: TextMark[];
  initialTranslation?: "fil" | "en" | null;
  initialPairedId?: string | null;
  // Every other Formula, for the translation-pairing picker -- excludes
  // itself when editing (see the `id` prop below).
  allFormulas: Formula[];
  id?: string;
  isSaving: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (
    sectionName: string,
    name: string,
    defaultText: string,
    marks: TextMark[],
    translation: "fil" | "en" | null,
    pairedId: string | null
  ) => void;
  onCancel?: () => void;
}

// v2: library-level marking toolbar -- this form is shared by /formulas/new
// (create) and FormulaListRow's edit path, so marking a Formula here (e.g.
// Absolution's Minister/Congregation dialogue) happens once in the library
// instead of being redone from scratch on every placement (addFormulaAction
// carries these marks onto a new placed instance as a starting point).
// availableMarks depends on the Section, which is itself editable here, so
// it's recomputed live off getFormulaMarks() -- the same lookup Compile-View
// editing uses, so the two can never drift.
export default function FormulaForm({
  sectionNames,
  initialSectionName,
  initialName,
  initialDefaultText,
  initialMarks = [],
  initialTranslation = null,
  initialPairedId = null,
  allFormulas,
  id,
  isSaving,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: FormulaFormProps): React.ReactElement {
  const [sectionName, setSectionName] = useState(initialSectionName || sectionNames[0] || "");
  const [name, setName] = useState(initialName);
  const [defaultText, setDefaultText] = useState(initialDefaultText);
  const [marks, setMarks] = useState<TextMark[]>(initialMarks);
  const [translation, setTranslation] = useState<"fil" | "en" | null>(initialTranslation);
  const [pairedId, setPairedId] = useState<string | null>(initialPairedId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const opposite = translation === "fil" ? "en" : "fil";
  const pairCandidates = translation
    ? allFormulas
        .filter((f) => f.id !== id && f.sectionName === sectionName && f.translation === opposite)
        .map((f) => ({ id: f.id, label: f.name }))
    : [];

  useEffect(() => {
    autosizeTextarea(textareaRef.current);
  }, [defaultText]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="formula-section">
          Section
        </label>
        <select
          id="formula-section"
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
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="formula-name">
          Name
        </label>
        <input
          id="formula-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="formula-default-text">
          Default Text
        </label>
        <textarea
          id="formula-default-text"
          ref={textareaRef}
          value={defaultText}
          onChange={(e) => {
            setMarks((prev) => shiftMarksForEdit(defaultText, e.target.value, prev));
            setDefaultText(e.target.value);
          }}
          rows={8}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent resize-none min-h-[180px] overflow-hidden"
        />
      </div>
      <MarkEditor
        text={defaultText}
        marks={marks}
        onMarksChange={setMarks}
        availableMarks={getFormulaMarks(sectionName)}
        textareaRef={textareaRef}
      />
      <TranslationPairFields
        translation={translation}
        onTranslationChange={(t) => {
          setTranslation(t);
          setPairedId(null);
        }}
        pairedId={pairedId}
        onPairedIdChange={setPairedId}
        candidates={pairCandidates}
      />
      {error && <p className="text-sm text-error">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(sectionName, name, defaultText, marks, translation, pairedId)}
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
