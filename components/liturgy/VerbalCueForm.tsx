"use client";

import { useState } from "react";

interface VerbalCueFormProps {
  initialText: string;
  initialVisibility: "both" | "leader_only";
  initialRubric?: boolean;
  isSaving: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (text: string, visibility: "both" | "leader_only", rubric: boolean) => void;
  onCancel: () => void;
}

export default function VerbalCueForm({
  initialText,
  initialVisibility,
  initialRubric = false,
  isSaving,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: VerbalCueFormProps): React.ReactElement {
  const [text, setText] = useState(initialText);
  const [visibility, setVisibility] = useState<"both" | "leader_only">(initialVisibility);
  const [rubric, setRubric] = useState(initialRubric);

  return (
    <div className="bg-surface-secondary border border-border rounded-md p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="verbal-cue-text">
          Verbal Cue
        </label>
        <textarea
          id="verbal-cue-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="verbal-cue-visibility">
          Visibility
        </label>
        <select
          id="verbal-cue-visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as "both" | "leader_only")}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        >
          <option value="leader_only">Leader only</option>
          <option value="both">Both (Guide + Bulletin)</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-[13px] font-medium text-text-secondary">
        <input type="checkbox" checked={rubric} onChange={(e) => setRubric(e.target.checked)} />
        Rubric style (instructional aside, rendered Sentence case + italic)
      </label>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(text, visibility, rubric)}
          disabled={isSaving}
          className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? "Saving…" : submitLabel}
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
