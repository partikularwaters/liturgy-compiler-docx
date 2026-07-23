"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PrayerForm from "@/components/prayers/PrayerForm";
import { createPrayer } from "@/lib/prayers/prayerActions";
import type { TextMark } from "@/types/liturgy";

interface NewPrayerClientProps {
  sectionNames: string[];
}

export default function NewPrayerClient({ sectionNames }: NewPrayerClientProps): React.ReactElement {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (sectionName: string, text: string, kind: "prayer" | "guide", marks: TextMark[]): void => {
    setIsSaving(true);
    setError(null);
    createPrayer(sectionName, text, kind, marks).then((result) => {
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
      isSaving={isSaving}
      error={error}
      submitLabel="Create Prayer"
      onSubmit={handleSave}
    />
  );
}
