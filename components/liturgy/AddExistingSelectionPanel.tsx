"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addSelection } from "@/lib/liturgy/addSelectionAction";
import type { ScriptureSelection } from "@/types/liturgy";

interface AddExistingSelectionPanelProps {
  scriptureSelections: ScriptureSelection[];
  liturgyId: string;
  sectionIndex: number;
  onDone: () => void;
}

// Picks a citation already saved to the Scripture Text Library (Feature 20)
// for this Section and places it directly, instead of the Reader being the
// only way to add a Selection. Reuses addSelection() as-is -- dedup,
// typography normalization, and the library re-upsert all already handle a
// citation that's placed a second time correctly, so no new server action
// was needed.
export default function AddExistingSelectionPanel({
  scriptureSelections,
  liturgyId,
  sectionIndex,
  onDone,
}: AddExistingSelectionPanelProps): React.ReactElement {
  const router = useRouter();
  const [selectionId, setSelectionId] = useState(scriptureSelections[0]?.id ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = scriptureSelections.find((s) => s.id === selectionId);

  const handleSave = (): void => {
    if (!selected) return;
    setIsSaving(true);
    setError(null);
    addSelection(liturgyId, sectionIndex, selected.citation, selected.text).then((result) => {
      setIsSaving(false);
      if (result.success) {
        router.refresh();
        onDone();
      } else {
        setError(result.error ?? "Unable to place this Selection right now.");
      }
    });
  };

  if (scriptureSelections.length === 0) {
    return (
      <div className="bg-surface-secondary border border-border rounded-md p-4">
        <p className="text-sm text-text-muted">
          No existing Scripture in the library for this Section yet — add one via the Reader first.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-secondary border border-border rounded-md p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="existing-selection-select">
          Existing Scripture
        </label>
        <select
          id="existing-selection-select"
          value={selectionId}
          onChange={(e) => setSelectionId(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        >
          {scriptureSelections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.citation}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <p className="font-serif-body text-[16px] leading-[1.6] text-text-primary whitespace-pre-wrap">
          {selected.text || "(citation only)"}
        </p>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Add to Section"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="self-start bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
