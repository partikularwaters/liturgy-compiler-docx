"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PrayerForm from "@/components/prayers/PrayerForm";
import { updatePrayer, deletePrayer } from "@/lib/prayers/prayerActions";
import { TrashIcon } from "@/components/liturgy/icons";
import LibraryTextPreview from "@/components/library/LibraryTextPreview";
import type { Prayer, TextMark } from "@/types/liturgy";

interface PrayerListRowProps {
  prayer: Prayer;
  sectionNames: string[];
  allPrayers: Prayer[];
}

export default function PrayerListRow({ prayer, sectionNames, allPrayers }: PrayerListRowProps): React.ReactElement {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
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
    updatePrayer(prayer.id, sectionName, text, kind, marks, isGuide, translation, pairedId).then((result) => {
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
    const label = prayer.isGuide ? "guide" : "prayer";
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
          initialIsGuide={prayer.isGuide ?? false}
          initialMarks={prayer.marks ?? []}
          initialTranslation={prayer.translation}
          initialPairedId={prayer.pairedId}
          allPrayers={allPrayers}
          id={prayer.id}
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
        <p className="text-[13px] text-text-secondary">
          {prayer.sectionName}
          {prayer.translation && <> · {prayer.translation === "en" ? "English" : "Filipino"}</>}
        </p>
        <LibraryTextPreview
          title={prayer.isGuide ? "Prayer Guide" : `Prayer (${prayer.kind === "corporate" ? "Corporate" : "Leader"})`}
          text={prayer.text}
          marks={prayer.marks}
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
