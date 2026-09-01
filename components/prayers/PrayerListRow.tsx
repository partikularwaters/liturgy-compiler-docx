"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PrayerForm from "@/components/prayers/PrayerForm";
import { updatePrayer, deletePrayer } from "@/lib/prayers/prayerActions";
import { PencilIcon, TrashIcon } from "@/components/liturgy/icons";
import LibraryTextPreview from "@/components/library/LibraryTextPreview";
import ConfirmDeleteLibraryItemDialog from "@/components/library/ConfirmDeleteLibraryItemDialog";
import type { Prayer, TextMark } from "@/types/liturgy";
import type { CurrentUser } from "@/lib/auth/getCurrentUser";

interface PrayerListRowProps {
  prayer: Prayer;
  sectionNames: string[];
  allPrayers: Prayer[];
  // False inside the Library's bilingual grid -- BilingualGrid draws one
  // shared separator per FIL/ENG pair instead. Stays true (default) for the
  // Guides list, which isn't paired/gridded and still needs its own line.
  bordered?: boolean;
  // null for an anonymous visitor -- see FormulaListRow's own comment.
  currentUser: CurrentUser | null;
}

export default function PrayerListRow({
  prayer,
  sectionNames,
  allPrayers,
  bordered = true,
  currentUser,
}: PrayerListRowProps): React.ReactElement {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = (
    sectionName: string,
    text: string,
    marks: TextMark[],
    isGuide: boolean,
    translation: "fil" | "en" | null,
    pairedId: string | null
  ): void => {
    setIsSaving(true);
    setError(null);
    updatePrayer(prayer.id, sectionName, text, marks, isGuide, translation, pairedId).then((result) => {
      setIsSaving(false);
      if (result.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        setError(result.error ?? "Unable to update this Prayer right now.");
      }
    });
  };

  const handleConfirmDelete = (): void => {
    setIsDeleting(true);
    deletePrayer(prayer.id).then((result) => {
      setIsDeleting(false);
      if (result.success) {
        setIsConfirmingDelete(false);
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
          isGuide={prayer.isGuide ?? false}
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
    // Edit/Delete are absolutely positioned, not a flex sibling -- see
    // FormulaListRow's own comment for the full reasoning.
    <div className={`relative py-4 ${bordered ? "border-b border-border" : ""}`}>
      <div>
        <p className="text-[13px] font-medium text-text-secondary pr-20 mb-1">
          {prayer.sectionName}
          {prayer.translation && <> · {prayer.translation === "en" ? "English" : "Filipino"}</>}
        </p>
        <LibraryTextPreview
          title={prayer.isGuide ? "Prayer Guide" : "Prayer"}
          text={prayer.text}
          marks={prayer.marks}
          className="mt-1"
        />
        {error && <p className="text-sm text-error mt-1">{error}</p>}
      </div>
      {currentUser && (
        <div className="absolute top-4 right-0 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent-dark transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
          >
            <PencilIcon size={15} /> Edit
          </button>
          <button
            type="button"
            title="Delete"
            onClick={() => {
              setError(null);
              setIsConfirmingDelete(true);
            }}
            className="text-text-muted hover:text-error transition-colors duration-[var(--duration-tooltip)] ease"
          >
            <TrashIcon size={16} />
          </button>
        </div>
      )}
      {isConfirmingDelete && (
        <ConfirmDeleteLibraryItemDialog
          itemLabel={`this ${prayer.isGuide ? "guide" : "prayer"}`}
          isDeleting={isDeleting}
          error={error}
          onConfirm={handleConfirmDelete}
          onClose={() => setIsConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
