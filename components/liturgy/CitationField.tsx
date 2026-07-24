"use client";

import { useEffect, useState } from "react";
import { PencilIcon } from "@/components/liturgy/icons";

declare global {
  interface Window {
    BGLinks?: { version: string; linkVerses: () => void };
  }
}

interface CitationFieldProps {
  value: string;
  onChange: (value: string) => void;
}

// The citation is a value first, a field
// second -- showing it as plain hoverable text by default (so BibleGateway's
// bglinks widget can pick it up mid-composition, before the Selection is
// even saved) and only switching to an editable input when the pencil icon
// is clicked. `window.BGLinks.linkVerses()` re-scans the page on demand,
// since toggling this component's local state isn't a route change and
// ScriptureLinker only re-scans on mount/pathname change.
export default function CitationField({ value, onChange }: CitationFieldProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) window.BGLinks?.linkVerses();
  }, [isEditing, value]);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px] font-medium text-text-secondary">Citation</label>
      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setIsEditing(false);
            }}
            className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <p className="font-serif-body text-sm text-citation [font-variant:small-caps]">{value || "—"}</p>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label="Edit citation"
            title="Edit citation"
            className="text-text-muted hover:text-accent-dark"
          >
            <PencilIcon size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
