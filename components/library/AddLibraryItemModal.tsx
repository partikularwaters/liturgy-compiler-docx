"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import SongForm from "@/components/songs/SongForm";
import PrayerForm from "@/components/prayers/PrayerForm";
import FormulaForm from "@/components/formulas/FormulaForm";
import { createSong } from "@/lib/songs/songActions";
import { createPrayer } from "@/lib/prayers/prayerActions";
import { createFormula } from "@/lib/formulas/formulaActions";
import type { Formula, Prayer, Song } from "@/types/liturgy";

interface AddLibraryItemModalProps {
  type: "song" | "prayer" | "guide" | "formula";
  sectionNames: string[];
  songs: Song[];
  prayers: Prayer[];
  formulas: Formula[];
  onClose: () => void;
}

const MODAL_TITLE: Record<AddLibraryItemModalProps["type"], string> = {
  song: "New Song",
  prayer: "New Prayer",
  guide: "New Prayer Guide",
  formula: "New Formula",
};

// Replaces /songs/new, /prayers/new, /formulas/new (Track B, 2026-08-31) --
// one shared modal shell, same size regardless of type, hosting each
// existing form component unchanged (this modal owns the create-action call
// and close/refresh, not the field logic itself).
export default function AddLibraryItemModal({
  type,
  sectionNames,
  songs,
  prayers,
  formulas,
  onClose,
}: AddLibraryItemModalProps): React.ReactElement {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal title={MODAL_TITLE[type]} onClose={onClose} closeOnOverlayClick={false}>
      {type === "song" && (
        <SongForm
          sectionNames={sectionNames}
          initialSectionNames={[]}
          initialKind="psalm"
          initialTitle=""
          initialAttribution=""
          initialYearPublished=""
          initialNotes=""
          allSongs={songs}
          isSaving={isSaving}
          error={error}
          submitLabel="Create Song"
          onSubmit={(sectionNames, kind, title, attribution, yearPublished, notes, translation, pairedId) => {
            setIsSaving(true);
            setError(null);
            createSong(sectionNames, kind, title, attribution, yearPublished, notes, translation, pairedId).then(
              (result) => {
                setIsSaving(false);
                if (result.success) {
                  router.refresh();
                  onClose();
                } else {
                  setError(result.error ?? "Unable to save this Song right now.");
                }
              }
            );
          }}
          onCancel={onClose}
        />
      )}
      {(type === "prayer" || type === "guide") && (
        <PrayerForm
          sectionNames={sectionNames}
          initialSectionName=""
          initialText=""
          isGuide={type === "guide"}
          allPrayers={prayers}
          isSaving={isSaving}
          error={error}
          submitLabel="Create Prayer"
          onSubmit={(sectionName, text, marks, isGuide, translation, pairedId) => {
            setIsSaving(true);
            setError(null);
            createPrayer(sectionName, text, marks, isGuide, translation, pairedId).then((result) => {
              setIsSaving(false);
              if (result.success) {
                router.refresh();
                onClose();
              } else {
                setError(result.error ?? "Unable to create this Prayer right now.");
              }
            });
          }}
          onCancel={onClose}
        />
      )}
      {type === "formula" && (
        <FormulaForm
          sectionNames={sectionNames}
          initialSectionName=""
          initialName=""
          initialDefaultText=""
          allFormulas={formulas}
          isSaving={isSaving}
          error={error}
          submitLabel="Create Formula"
          onSubmit={(sectionName, name, defaultText, marks, translation, pairedId, kind) => {
            setIsSaving(true);
            setError(null);
            createFormula(sectionName, name, defaultText, marks, translation, pairedId, kind).then((result) => {
              setIsSaving(false);
              if (result.success) {
                router.refresh();
                onClose();
              } else {
                setError(result.error ?? "Unable to save this Formula right now.");
              }
            });
          }}
          onCancel={onClose}
        />
      )}
    </Modal>
  );
}
