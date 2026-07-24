"use client";

import { useState } from "react";
import { XIcon } from "@/components/liturgy/icons";

interface SermonFormProps {
  initialPassage: string;
  isSaving: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (passage: string) => void;
  onCancel: () => void;
}

export default function SermonForm({
  initialPassage,
  isSaving,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: SermonFormProps): React.ReactElement {
  const [passage, setPassage] = useState(initialPassage);

  return (
    <div className="bg-surface-secondary border border-border rounded-md p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="sermon-passage">
          Sermon Passage
        </label>
        <input
          id="sermon-passage"
          type="text"
          value={passage}
          onChange={(e) => setPassage(e.target.value)}
          placeholder="e.g. Eph 2:1-12"
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(passage)}
          disabled={isSaving}
          className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? "Saving…" : submitLabel}
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
