"use client";

import { useState } from "react";

interface FormulaFormProps {
  sectionNames: string[];
  initialSectionName: string;
  initialName: string;
  initialDefaultText: string;
  isSaving: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (sectionName: string, name: string, defaultText: string) => void;
  onCancel?: () => void;
}

export default function FormulaForm({
  sectionNames,
  initialSectionName,
  initialName,
  initialDefaultText,
  isSaving,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: FormulaFormProps): React.ReactElement {
  const [sectionName, setSectionName] = useState(initialSectionName || sectionNames[0] || "");
  const [name, setName] = useState(initialName);
  const [defaultText, setDefaultText] = useState(initialDefaultText);

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
          value={defaultText}
          onChange={(e) => setDefaultText(e.target.value)}
          rows={4}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(sectionName, name, defaultText)}
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
