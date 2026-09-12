"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setNaturalFlow } from "@/lib/liturgy/setNaturalFlowAction";

interface NaturalFlowToggleProps {
  liturgyId: string;
  sectionIndex: number;
  mergeSelections: boolean;
  canEdit: boolean;
}

// On/off toggle for opt-in natural-flow merging (2+ Selections read as one
// continuous paragraph instead of separate ones) -- only ever rendered on
// the three Sections in NATURAL_FLOW_TOGGLE_SECTIONS. Same self-contained
// shape as SilentConfessionLanguageToggle.tsx (owns its own Server Action
// call + refresh), including that file's error-surfacing fix -- a failed
// save used to fail completely silently, indistinguishable from the click
// not registering at all (EndNoteToggle.tsx's established pattern for this
// exact failure class).
export default function NaturalFlowToggle({
  liturgyId,
  sectionIndex,
  mergeSelections,
  canEdit,
}: NaturalFlowToggleProps): React.ReactElement | null {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canEdit) return null;

  const handleChange = (checked: boolean): void => {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    setNaturalFlow(liturgyId, sectionIndex, checked).then((result) => {
      setIsSaving(false);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Unable to update this setting right now.");
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <label className="flex items-center gap-2 text-[13px] font-medium text-text-secondary">
        <input
          type="checkbox"
          checked={mergeSelections}
          disabled={isSaving}
          onChange={(e) => handleChange(e.target.checked)}
        />
        Read as one continuous passage
      </label>
      {error && <p className="text-[11px] text-error">{error}</p>}
    </div>
  );
}
