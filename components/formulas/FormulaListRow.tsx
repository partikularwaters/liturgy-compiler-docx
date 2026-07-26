"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import FormulaForm from "@/components/formulas/FormulaForm";
import { updateFormula, deleteFormula } from "@/lib/formulas/formulaActions";
import { PencilIcon, TrashIcon } from "@/components/liturgy/icons";
import LibraryTextPreview from "@/components/library/LibraryTextPreview";
import type { Formula, TextMark } from "@/types/liturgy";
import type { CurrentUser } from "@/lib/auth/getCurrentUser";

interface FormulaListRowProps {
  formula: Formula;
  sectionNames: string[];
  allFormulas: Formula[];
  // False inside the Library's bilingual grid -- BilingualGrid draws one
  // shared separator per FIL/ENG pair instead, since each row's own
  // border-bottom used to land at that row's own content height, which
  // rarely matched its companion's, producing two misaligned lines.
  bordered?: boolean;
  // null for an anonymous visitor -- Edit/Delete are hidden entirely then
  // (not just server-rejected), so there's no false "you can edit this"
  // affordance for someone with no account at all. A signed-in Compiler
  // hitting a Curator-only Formula still sees the buttons and gets the
  // existing clear server-side error -- that distinction is intentional.
  currentUser: CurrentUser | null;
}

export default function FormulaListRow({
  formula,
  sectionNames,
  allFormulas,
  bordered = true,
  currentUser,
}: FormulaListRowProps): React.ReactElement {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (
    sectionName: string,
    name: string,
    defaultText: string,
    marks: TextMark[],
    translation: "fil" | "en" | null,
    pairedId: string | null,
    kind: "affirmation" | "covenant" | null
  ): void => {
    setIsSaving(true);
    setError(null);
    updateFormula(formula.id, sectionName, name, defaultText, marks, translation, pairedId, kind).then((result) => {
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
          initialTranslation={formula.translation}
          initialPairedId={formula.pairedId}
          initialKind={formula.kind}
          allFormulas={allFormulas}
          id={formula.id}
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
    <div className={`py-4 flex items-start justify-between gap-4 ${bordered ? "border-b border-border" : ""}`}>
      <div>
        <p className="text-[13px] text-text-secondary">
          {formula.sectionName}
          {formula.translation && <> · {formula.translation === "en" ? "English" : "Filipino"}</>}
        </p>
        <p className="text-sm font-medium text-text-primary">{formula.name}</p>
        <LibraryTextPreview title={formula.name} text={formula.defaultText} marks={formula.marks} className="mt-1" />
        {error && <p className="text-sm text-error mt-1">{error}</p>}
      </div>
      {currentUser && (
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent-dark"
          >
            <PencilIcon size={15} /> Edit
          </button>
          <button
            type="button"
            title="Delete"
            onClick={handleDelete}
            className="text-text-muted hover:text-error"
          >
            <TrashIcon size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
