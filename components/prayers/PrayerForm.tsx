"use client";

import { useEffect, useRef, useState } from "react";
import { autosizeTextarea } from "@/lib/text/autosize";
import { shiftMarksForEdit } from "@/lib/text/marks";
import MarkEditor from "@/components/liturgy/MarkEditor";
import { XIcon } from "@/components/liturgy/icons";
import TranslationPairFields from "@/components/library/TranslationPairFields";
import type { Prayer, TextMark } from "@/types/liturgy";

interface PrayerFormProps {
  sectionNames: string[];
  initialSectionName: string;
  initialText: string;
  isGuide?: boolean;
  initialMarks?: TextMark[];
  initialTranslation?: "fil" | "en" | null;
  initialPairedId?: string | null;
  // Every other Prayer, for the translation-pairing picker -- excludes
  // itself when editing (see the `id` prop below).
  allPrayers: Prayer[];
  id?: string;
  isSaving: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (
    sectionName: string,
    text: string,
    marks: TextMark[],
    isGuide: boolean,
    translation: "fil" | "en" | null,
    pairedId: string | null
  ) => void;
  onCancel?: () => void;
}

function previewText(text: string): string {
  return text.length > 50 ? `${text.slice(0, 50)}…` : text;
}

// Prayer never had a marking toolbar at all -- Bold could only
// be typed by hand as raw asterisks, with no button and (before Bold became
// a real mark) nowhere to persist it anyway. Bold-only here (no availableMarks
// -- Congregation/Minister/Small-Caps stay scoped to the Sections that
// actually need them, per markableSections.ts), same as every other library
// form's toolbar.
//
// Audience (Corporate/Leader) moved off this form entirely as of Track B
// (2026-08-31) -- it's now a per-placement fact set in the Compile View
// (see prayerKindPolicy.ts), not a Library-level property. Guide/
// reference-only stays here, since placeability is a genuinely different,
// Library-level fact (it can already be reached from the Compile View
// directly), not an audience choice.
export default function PrayerForm({
  sectionNames,
  initialSectionName,
  initialText,
  isGuide = false,
  initialMarks = [],
  initialTranslation = null,
  initialPairedId = null,
  allPrayers,
  id,
  isSaving,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: PrayerFormProps): React.ReactElement {
  const [sectionName, setSectionName] = useState(initialSectionName || sectionNames[0] || "");
  const [text, setText] = useState(initialText);
  const [marks, setMarks] = useState<TextMark[]>(initialMarks);
  const [translation, setTranslation] = useState<"fil" | "en" | null>(initialTranslation);
  const [pairedId, setPairedId] = useState<string | null>(initialPairedId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const opposite = translation === "fil" ? "en" : "fil";
  const pairCandidates = translation
    ? allPrayers
        .filter(
          (p) =>
            p.id !== id &&
            p.sectionName === sectionName &&
            p.isGuide === isGuide &&
            p.translation === opposite
        )
        .map((p) => ({ id: p.id, label: previewText(p.text) }))
    : [];

  useEffect(() => {
    autosizeTextarea(textareaRef.current);
  }, [text]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="prayer-section">
          Section <span aria-hidden="true">*</span>
        </label>
        <select
          id="prayer-section"
          value={sectionName}
          onChange={(e) => {
            setSectionName(e.target.value);
            setPairedId(null);
          }}
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
        <label className="text-[13px] font-medium text-text-secondary">Title</label>
        <p className="text-sm text-text-muted italic">
          {text.trim() ? previewText(text) : "Derived from the first few words of the Prayer Content below."}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="prayer-text">
          Prayer Content <span aria-hidden="true">*</span>
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
          onClick={() => onSubmit(sectionName, text, marks, isGuide, translation, pairedId)}
          disabled={isSaving}
          className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
        >
          {isSaving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="self-start inline-flex items-center gap-1 bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
          >
            <XIcon size={15} /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}
