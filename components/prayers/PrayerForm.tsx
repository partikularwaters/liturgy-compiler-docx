"use client";

import { useEffect, useRef, useState } from "react";
import { autosizeTextarea } from "@/lib/text/autosize";
import { shiftMarksForEdit } from "@/lib/text/marks";
import MarkEditor from "@/components/liturgy/MarkEditor";
import TranslationPairFields from "@/components/library/TranslationPairFields";
import type { Prayer, TextMark } from "@/types/liturgy";

interface PrayerFormProps {
  sectionNames: string[];
  initialSectionName: string;
  initialText: string;
  initialKind?: "corporate" | "leader";
  initialIsGuide?: boolean;
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
    kind: "corporate" | "leader",
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
// Kind is purely audience (Corporate/Leader),
// driving derived Bulletin visibility -- see types/liturgy.ts's Prayer.kind
// comment. The old "Guide" kind option is gone; guide/reference-only is now
// a separate, de-emphasized checkbox, since the reference-outline mechanism
// is an orthogonal, rarely-used fact (it can already be reached from the
// Compile View directly), not a third audience choice competing for
// attention with the two real ones.
export default function PrayerForm({
  sectionNames,
  initialSectionName,
  initialText,
  initialKind = "leader",
  initialIsGuide = false,
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
  const [kind, setKind] = useState<"corporate" | "leader">(initialKind);
  const [isGuide, setIsGuide] = useState(initialIsGuide);
  const [marks, setMarks] = useState<TextMark[]>(initialMarks);
  const [translation, setTranslation] = useState<"fil" | "en" | null>(initialTranslation);
  const [pairedId, setPairedId] = useState<string | null>(initialPairedId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const opposite = translation === "fil" ? "en" : "fil";
  const pairCandidates = translation
    ? allPrayers
        .filter((p) => p.id !== id && p.sectionName === sectionName && p.translation === opposite)
        .map((p) => ({ id: p.id, label: previewText(p.text) }))
    : [];

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
          onChange={(e) => setKind(e.target.value as "corporate" | "leader")}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        >
          <option value="corporate">Corporate (whole church prays it — Bulletin + Guide)</option>
          <option value="leader">Leader (leader/minister's own material — Guide only)</option>
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
      <label className="flex items-center gap-2 text-[12px] text-text-muted">
        <input type="checkbox" checked={isGuide} onChange={(e) => setIsGuide(e.target.checked)} />
        This is reference material only (a Prayer Guide checklist, per redesign-plan-v1.1.md §W) — never placeable
        in a liturgy
      </label>
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
          onClick={() => onSubmit(sectionName, text, kind, marks, isGuide, translation, pairedId)}
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
