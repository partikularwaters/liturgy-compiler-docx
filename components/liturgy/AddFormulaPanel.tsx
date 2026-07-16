"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addFormula } from "@/lib/liturgy/addFormulaAction";
import type { Formula } from "@/types/liturgy";

interface AddFormulaPanelProps {
  formulas: Formula[];
  liturgyId: string;
  sectionIndex: number;
  onDone: () => void;
}

export default function AddFormulaPanel({
  formulas,
  liturgyId,
  sectionIndex,
  onDone,
}: AddFormulaPanelProps): React.ReactElement {
  const router = useRouter();
  const [formulaId, setFormulaId] = useState(formulas[0]?.id ?? "");
  const [useOverride, setUseOverride] = useState(false);
  const [overrideText, setOverrideText] = useState("");
  const [visibility, setVisibility] = useState<"both" | "leader_only">("both");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedFormula = formulas.find((f) => f.id === formulaId);

  const handleSelectFormula = (id: string): void => {
    setFormulaId(id);
    setUseOverride(false);
    setOverrideText("");
  };

  const handleToggleOverride = (): void => {
    if (!useOverride && selectedFormula) {
      setOverrideText(selectedFormula.defaultText);
    }
    setUseOverride(!useOverride);
  };

  const handleSave = (): void => {
    if (!formulaId) return;
    setIsSaving(true);
    setError(null);
    addFormula(liturgyId, sectionIndex, formulaId, useOverride ? overrideText : null, visibility).then(
      (result) => {
        setIsSaving(false);
        if (result.success) {
          router.refresh();
          onDone();
        } else {
          setError(result.error ?? "Unable to place this Formula right now.");
        }
      }
    );
  };

  if (formulas.length === 0) {
    return (
      <div className="bg-surface-secondary border border-border rounded-md p-4">
        <p className="text-sm text-text-muted">
          No Formulas yet for this Section — create one in the Formula library first.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-secondary border border-border rounded-md p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="formula-select">
          Formula
        </label>
        <select
          id="formula-select"
          value={formulaId}
          onChange={(e) => handleSelectFormula(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        >
          {formulas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {selectedFormula && !useOverride && (
        <p className="font-serif-body text-[17px] leading-[1.75] text-text-primary">
          {selectedFormula.defaultText}
        </p>
      )}

      <label className="flex items-center gap-2 text-[13px] font-medium text-text-secondary">
        <input type="checkbox" checked={useOverride} onChange={handleToggleOverride} />
        Override text for this instance
      </label>

      {useOverride && (
        <textarea
          value={overrideText}
          onChange={(e) => setOverrideText(e.target.value)}
          rows={4}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      )}

      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="formula-visibility">
          Visibility
        </label>
        <select
          id="formula-visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as "both" | "leader_only")}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        >
          <option value="both">Both (Guide + Bulletin)</option>
          <option value="leader_only">Leader only</option>
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
          {isSaving ? "Saving…" : "Add Formula"}
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
