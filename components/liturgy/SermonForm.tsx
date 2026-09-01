"use client";

import { useState } from "react";
import { XIcon } from "@/components/liturgy/icons";

interface SermonFormProps {
  initialTitle: string;
  initialSeries: string;
  initialPassage: string;
  initialPreacher: string;
  isSaving: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (fields: { title: string; series: string; passage: string; preacher: string }) => void;
  onCancel: () => void;
}

export default function SermonForm({
  initialTitle,
  initialSeries,
  initialPassage,
  initialPreacher,
  isSaving,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: SermonFormProps): React.ReactElement {
  const [title, setTitle] = useState(initialTitle);
  const [series, setSeries] = useState(initialSeries);
  const [passage, setPassage] = useState(initialPassage);
  const [preacher, setPreacher] = useState(initialPreacher);

  return (
    <div className="bg-surface-secondary border border-border rounded-md p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="sermon-title">
          Sermon Title <span aria-hidden="true">*</span>
        </label>
        <input
          id="sermon-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="sermon-series">
          Sermon Series (optional)
        </label>
        <input
          id="sermon-series"
          type="text"
          value={series}
          onChange={(e) => setSeries(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="sermon-passage">
          Passage <span aria-hidden="true">*</span>
        </label>
        <input
          id="sermon-passage"
          type="text"
          required
          value={passage}
          onChange={(e) => setPassage(e.target.value)}
          placeholder="e.g. Eph 2:1-12"
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="sermon-preacher">
          Preacher <span aria-hidden="true">*</span>
        </label>
        <input
          id="sermon-preacher"
          type="text"
          required
          value={preacher}
          onChange={(e) => setPreacher(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit({ title, series, passage, preacher })}
          disabled={isSaving || !title.trim() || !passage.trim() || !preacher.trim()}
          className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
        >
          {isSaving ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="self-start inline-flex items-center gap-1 bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
        >
          <XIcon size={15} /> Cancel
        </button>
      </div>
    </div>
  );
}
