"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PrayerForm from "@/components/prayers/PrayerForm";
import { updatePrayer, deletePrayer } from "@/lib/prayers/prayerActions";
import { TrashIcon } from "@/components/liturgy/icons";
import LibraryTextPreview from "@/components/library/LibraryTextPreview";
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

  const handleDelete = (): void => {
    const label = prayer.kind === "guide" ? "guide" : "prayer";
    if (!window.confirm(`Delete this ${label}? This does not remove it from liturgies it's already placed in.`)) {
      return;
    }
    deletePrayer(prayer.id).then((result) => {
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Unable to delete this Prayer right now.");
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
        <LibraryTextPreview
          title={prayer.kind === "guide" ? "Prayer Guide" : "Prayer"}
          text={prayer.text}
          className="mt-1"
        />
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
