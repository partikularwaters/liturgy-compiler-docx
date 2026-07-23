"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { chooseVesperReading } from "@/lib/liturgy/chooseVesperReadingAction";
import {
  VESPER_DISCOURSE_OPTIONS,
  VESPER_WORDS_OF_INSTITUTION_OPTIONS,
  VESPER_CLOSING_OF_TABLE_OPTIONS,
} from "@/lib/liturgy/vesperTableRotation";

interface VesperReadingOption {
  citation: string;
  label: string;
}

function optionsForSection(sectionName: string): VesperReadingOption[] {
  if (sectionName === "The Lord's Discourses") {
    return VESPER_DISCOURSE_OPTIONS.map((d) => ({ citation: d.citation, label: `${d.citation} — ${d.title}` }));
  }
  if (sectionName === "Closing of the Table") {
    return VESPER_CLOSING_OF_TABLE_OPTIONS.map((citation) => ({ citation, label: citation }));
  }
  // "Words of Institution"
  return VESPER_WORDS_OF_INSTITUTION_OPTIONS.map((citation) => ({ citation, label: citation }));
}

interface VesperReadingPanelProps {
  sectionName: string;
  liturgyId: string;
  sectionIndex: number;
  currentCitation: string | null;
  onDone: () => void;
}

// The Handbook's rotation (lib/liturgy/
// vesperTableRotation.ts) auto-assigns a reading at liturgy creation, but
// that's a default, not a mandate -- the Compiler must still be able to
// pick a different one of the Handbook's own valid options by hand (a
// pastoral exception, or a correction). Deliberately scoped to *this
// Section's own fixed list*, not a free-text citation or the general
// Scripture Text Library picker (AddExistingSelectionPanel) -- those two
// already exist side-by-side via "+ Scripture"/"+ From Library" for any
// genuinely exceptional case.
export default function VesperReadingPanel({
  sectionName,
  liturgyId,
  sectionIndex,
  currentCitation,
  onDone,
}: VesperReadingPanelProps): React.ReactElement {
  const router = useRouter();
  const options = optionsForSection(sectionName);
  const [citation, setCitation] = useState(currentCitation ?? options[0]?.citation ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (): void => {
    setIsSaving(true);
    setError(null);
    chooseVesperReading(liturgyId, sectionIndex, citation).then((result) => {
      setIsSaving(false);
      if (result.success) {
        router.refresh();
        onDone();
      } else {
        setError(result.error ?? "Unable to set this reading right now.");
      }
    });
  };

  return (
    <div className="bg-surface-secondary border border-border rounded-md p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="vesper-reading-select">
          Reading (from the Handbook's rotation)
        </label>
        <select
          id="vesper-reading-select"
          value={citation}
          onChange={(e) => setCitation(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        >
          {options.map((option) => (
            <option key={option.citation} value={option.citation}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Set Reading"}
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
