"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import FormulaForm from "@/components/formulas/FormulaForm";
import { updateFormula } from "@/lib/formulas/formulaActions";
import type { Formula } from "@/types/liturgy";

interface FormulaListRowProps {
  formula: Formula;
  sectionNames: string[];
}

export default function FormulaListRow({
  formula,
  sectionNames,
}: FormulaListRowProps): React.ReactElement {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (sectionName: string, name: string, defaultText: string): void => {
    setIsSaving(true);
    setError(null);
    updateFormula(formula.id, sectionName, name, defaultText).then((result) => {
      setIsSaving(false);
      if (result.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        setError(result.error ?? "Unable to update this Formula right now.");
      }
    });
  };

  if (isEditing) {
    return (
      <div className="border-b border-border py-4">
        <FormulaForm
          sectionNames={sectionNames}
          initialSectionName={formula.sectionName}
          initialName={formula.name}
          initialDefaultText={formula.defaultText}
          isSaving={isSaving}
          error={error}
          submitLabel="Save"
          onSubmit={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="border-b border-border py-4 flex items-start justify-between gap-4">
      <div>
        <p className="text-[13px] text-text-secondary">{formula.sectionName}</p>
        <p className="text-sm font-medium text-text-primary">{formula.name}</p>
        <p className="text-sm text-text-secondary mt-1">{formula.defaultText}</p>
      </div>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="text-sm font-medium text-accent-dark shrink-0"
      >
        Edit
      </button>
    </div>
  );
}
