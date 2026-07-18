"use client";

import { useState } from "react";

interface PrayerFormProps {
  sectionNames: string[];
  initialSectionName: string;
  initialText: string;
  initialKind?: "prayer" | "guide";
  isSaving: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (sectionName: string, text: string, kind: "prayer" | "guide") => void;
  onCancel?: () => void;
}

export default function PrayerForm({
  sectionNames,
  initialSectionName,
  initialText,
  initialKind = "prayer",
  isSaving,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: PrayerFormProps): React.ReactElement {
  const [sectionName, setSectionName] = useState(initialSectionName || sectionNames[0] || "");
  const [text, setText] = useState(initialText);
  const [kind, setKind] = useState<"prayer" | "guide">(initialKind);

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
          onChange={(e) => setKind(e.target.value as "prayer" | "guide")}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        >
          <option value="prayer">Prayer (placeable in a liturgy)</option>
          <option value="guide">Guide (reference outline only, per redesign-plan-v1.1.md §W)</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="prayer-text">
          Text
        </label>
        <textarea
          id="prayer-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(sectionName, text, kind)}
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
