"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormulaForm from "@/components/formulas/FormulaForm";
import { createFormula } from "@/lib/formulas/formulaActions";
import type { Formula, TextMark } from "@/types/liturgy";

interface NewFormulaClientProps {
  sectionNames: string[];
  allFormulas: Formula[];
}

export default function NewFormulaClient({
  sectionNames,
  allFormulas,
}: NewFormulaClientProps): React.ReactElement {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (
    sectionName: string,
    name: string,
    defaultText: string,
    marks: TextMark[],
    translation: "fil" | "en" | null,
    pairedId: string | null
  ): void => {
    setIsSaving(true);
    setError(null);
    createFormula(sectionName, name, defaultText, marks, translation, pairedId).then((result) => {
      setIsSaving(false);
      if (result.success) {
        router.push("/library");
      } else {
        setError(result.error ?? "Unable to create this Formula right now.");
      }
    });
  };

  return (
    <FormulaForm
      sectionNames={sectionNames}
      initialSectionName=""
      initialName=""
      initialDefaultText=""
      allFormulas={allFormulas}
      isSaving={isSaving}
      error={error}
      submitLabel="Create Formula"
      onSubmit={handleSave}
    />
  );
}
