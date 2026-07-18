"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PrayerForm from "@/components/prayers/PrayerForm";
import { updatePrayer } from "@/lib/prayers/prayerActions";
import type { Prayer } from "@/types/liturgy";

interface PrayerListRowProps {
  prayer: Prayer;
  sectionNames: string[];
}

export default function PrayerListRow({ prayer, sectionNames }: PrayerListRowProps): React.ReactElement {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (sectionName: string, text: string, kind: "prayer" | "guide"): void => {
    setIsSaving(true);
    setError(null);
    updatePrayer(prayer.id, sectionName, text, kind).then((result) => {
      setIsSaving(false);
      if (result.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        setError(result.error ?? "Unable to update this Prayer right now.");
      }
    });
  };

  if (isEditing) {
    return (
      <div className="border-b border-border py-4">
        <PrayerForm
          sectionNames={sectionNames}
          initialSectionName={prayer.sectionName}
          initialText={prayer.text}
          initialKind={prayer.kind}
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
        <p className="text-[13px] text-text-secondary">{prayer.sectionName}</p>
        <p className="text-sm text-text-primary mt-1">{prayer.text}</p>
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
