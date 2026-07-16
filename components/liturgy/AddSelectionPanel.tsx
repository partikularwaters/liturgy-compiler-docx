"use client";

import { useState } from "react";

interface AddSelectionPanelProps {
  targetLabel: string;
  initialCitation: string;
  initialText: string;
  alreadySaved: boolean;
  isSaving: boolean;
  saveError: string | null;
  onSave: (citation: string, text: string) => void;
}

export default function AddSelectionPanel({
  targetLabel,
  initialCitation,
  initialText,
  alreadySaved,
  isSaving,
  saveError,
  onSave,
}: AddSelectionPanelProps): React.ReactElement {
  const [citation, setCitation] = useState(initialCitation);
  const [text, setText] = useState(initialText);

  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3">
      <p className="text-[13px] font-medium text-text-secondary">Adding to: {targetLabel}</p>

      {alreadySaved ? (
        <span className="self-start rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-success-light text-success-foreground">
          Already saved to this Section
        </span>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-text-secondary" htmlFor="selection-citation">
              Citation
            </label>
            <input
              id="selection-citation"
              value={citation}
              onChange={(e) => setCitation(e.target.value)}
              className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-text-secondary" htmlFor="selection-text">
              Text
            </label>
            <textarea
              id="selection-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
            />
          </div>
          {saveError && <p className="text-sm text-error">{saveError}</p>}
          <button
            type="button"
            onClick={() => onSave(citation, text)}
            disabled={isSaving}
            className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Add to Section"}
          </button>
        </>
      )}
    </div>
  );
}
