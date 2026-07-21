"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ScriptureSelectionForm from "@/components/selections/ScriptureSelectionForm";
import { createScriptureSelection } from "@/lib/selections/scriptureSelectionActions";
import type { TextMark } from "@/types/liturgy";

interface NewScriptureClientProps {
  sectionNames: string[];
}

export default function NewScriptureClient({
  sectionNames,
}: NewScriptureClientProps): React.ReactElement {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (
    sectionName: string,
    citation: string,
    text: string,
    translation: "fil" | "en",
    marks: TextMark[]
  ): void => {
    setIsSaving(true);
    setError(null);
    createScriptureSelection(sectionName, citation, text, translation, marks).then((result) => {
      setIsSaving(false);
      if (result.success) {
        router.push("/library");
      } else {
        setError(result.error ?? "Unable to add this Scripture item right now.");
      }
    });
  };

  return (
    <ScriptureSelectionForm
      sectionNames={sectionNames}
      isSaving={isSaving}
      error={error}
      submitLabel="Add Scripture"
      onSubmit={handleSave}
    />
  );
}
