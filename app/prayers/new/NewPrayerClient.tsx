"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PrayerForm from "@/components/prayers/PrayerForm";
import { createPrayer } from "@/lib/prayers/prayerActions";
import type { Prayer, TextMark } from "@/types/liturgy";

interface NewPrayerClientProps {
  sectionNames: string[];
  allPrayers: Prayer[];
}

export default function NewPrayerClient({ sectionNames, allPrayers }: NewPrayerClientProps): React.ReactElement {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (
    sectionName: string,
    text: string,
    kind: "corporate" | "leader",
    marks: TextMark[],
    isGuide: boolean,
    translation: "fil" | "en" | null,
    pairedId: string | null
  ): void => {
    setIsSaving(true);
    setError(null);
    createPrayer(sectionName, text, kind, marks, isGuide, translation, pairedId).then((result) => {
      setIsSaving(false);
      if (result.success) {
        router.push("/library");
      } else {
        setError(result.error ?? "Unable to create this Prayer right now.");
      }
    });
  };

  return (
    <PrayerForm
      sectionNames={sectionNames}
      initialSectionName=""
      initialText=""
      allPrayers={allPrayers}
      isSaving={isSaving}
      error={error}
      submitLabel="Create Prayer"
      onSubmit={handleSave}
    />
  );
}
