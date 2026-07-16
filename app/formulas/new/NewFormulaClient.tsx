"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormulaForm from "@/components/formulas/FormulaForm";
import { createFormula } from "@/lib/formulas/formulaActions";

interface NewFormulaClientProps {
  sectionNames: string[];
}

export default function NewFormulaClient({
  sectionNames,
}: NewFormulaClientProps): React.ReactElement {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (sectionName: string, name: string, defaultText: string): void => {
    setIsSaving(true);
    setError(null);
    createFormula(sectionName, name, defaultText).then((result) => {
      setIsSaving(false);
      if (result.success) {
        router.push("/formulas");
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
      isSaving={isSaving}
      error={error}
      submitLabel="Create Formula"
      onSubmit={handleSave}
    />
  );
}
