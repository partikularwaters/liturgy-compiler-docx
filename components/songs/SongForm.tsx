"use client";

import { useState } from "react";
import TranslationPairFields from "@/components/library/TranslationPairFields";
import type { Song } from "@/types/liturgy";

interface SongFormProps {
  sectionNames: string[];
  initialSectionName: string;
  initialKind: "psalm" | "hymn";
  initialTitle: string;
  initialAttribution: string;
  initialYearPublished: string;
  initialNotes: string;
  initialTranslation?: "fil" | "en" | null;
  initialPairedId?: string | null;
  // Every other Song, for the translation-pairing picker -- excludes
  // itself when editing (see the `id` prop below).
  allSongs: Song[];
  id?: string;
  isSaving: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (
    sectionName: string,
    kind: "psalm" | "hymn",
    title: string,
    attribution: string,
    yearPublished: string,
    notes: string,
    translation: "fil" | "en" | null,
    pairedId: string | null
  ) => void;
  onCancel?: () => void;
}

// v2 Phase A: Songs library management, mirroring FormulaForm's shape --
// shared between /songs/new (create) and SongListRow's inline edit, same
// pattern as Formula/Prayer.
export default function SongForm({
  sectionNames,
  initialSectionName,
  initialKind,
  initialTitle,
  initialAttribution,
  initialYearPublished,
  initialNotes,
  initialTranslation = null,
  initialPairedId = null,
  allSongs,
  id,
  isSaving,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: SongFormProps): React.ReactElement {
  const [sectionName, setSectionName] = useState(initialSectionName || sectionNames[0] || "");
  const [kind, setKind] = useState<"psalm" | "hymn">(initialKind);
  const [title, setTitle] = useState(initialTitle);
  const [attribution, setAttribution] = useState(initialAttribution);
  const [yearPublished, setYearPublished] = useState(initialYearPublished);
  const [notes, setNotes] = useState(initialNotes);
  const [translation, setTranslation] = useState<"fil" | "en" | null>(initialTranslation);
  const [pairedId, setPairedId] = useState<string | null>(initialPairedId);

  const attributionLabel = kind === "psalm" ? "Versification" : "Author";

  const opposite = translation === "fil" ? "en" : "fil";
  const pairCandidates = translation
    ? allSongs
        .filter((s) => s.id !== id && s.sectionName === sectionName && s.kind === kind && s.translation === opposite)
        .map((s) => ({ id: s.id, label: s.title }))
    : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="song-form-section">
          Section
        </label>
        <select
          id="song-form-section"
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
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="song-form-kind">
          Kind
        </label>
        <select
          id="song-form-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as "psalm" | "hymn")}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        >
          <option value="psalm">Psalm</option>
          <option value="hymn">Hymn</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="song-form-title">
          Title
        </label>
        <input
          id="song-form-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="song-form-attribution">
          {attributionLabel}
        </label>
        <input
          id="song-form-attribution"
          value={attribution}
          onChange={(e) => setAttribution(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="song-form-year">
          Year published (optional)
        </label>
        <input
          id="song-form-year"
          value={yearPublished}
          onChange={(e) => setYearPublished(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="song-form-notes">
          Notes (optional, Leader Guide only)
        </label>
        <textarea
          id="song-form-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>
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
          onClick={() => onSubmit(sectionName, kind, title, attribution, yearPublished, notes, translation, pairedId)}
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
