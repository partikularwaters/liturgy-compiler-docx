"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import FormulaForm from "@/components/formulas/FormulaForm";
import { updateFormula, deleteFormula } from "@/lib/formulas/formulaActions";
import { TrashIcon } from "@/components/liturgy/icons";
import LibraryTextPreview from "@/components/library/LibraryTextPreview";
import type { Formula, TextMark } from "@/types/liturgy";

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

  const handleSave = (sectionName: string, name: string, defaultText: string, marks: TextMark[]): void => {
    setIsSaving(true);
    setError(null);
    updateFormula(formula.id, sectionName, name, defaultText, marks).then((result) => {
      setIsSaving(false);
      if (result.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        setError(result.error ?? "Unable to update this Formula right now.");
      }
    });
  };

  const handleDelete = (): void => {
    if (!window.confirm(`Delete "${formula.name}"? This does not remove it from liturgies it's already placed in.`)) {
      return;
    }
    deleteFormula(formula.id).then((result) => {
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Unable to delete this Formula right now.");
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
          initialMarks={formula.marks ?? []}
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
        <LibraryTextPreview title={formula.name} text={formula.defaultText} className="text-sm text-text-secondary mt-1" />
        {error && <p className="text-sm text-error mt-1">{error}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-sm font-medium text-accent-dark"
        >
          Edit
        </button>
        <button
          type="button"
          title="Delete"
          onClick={handleDelete}
          className="text-text-muted hover:text-error"
        >
          <TrashIcon size={15} />
        </button>
      </div>
    </div>
  );
}
