"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addPrayer } from "@/lib/liturgy/addPrayerAction";
import { createPrayer, updatePrayer } from "@/lib/prayers/prayerActions";
import { shiftMarksForEdit } from "@/lib/text/marks";
import type { Prayer } from "@/types/liturgy";

interface AddPrayerPanelProps {
  prayers: Prayer[];
  sectionName: string;
  liturgyId: string;
  sectionIndex: number;
  onDone: () => void;
}

function previewText(text: string): string {
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

export default function AddPrayerPanel({
  prayers,
  sectionName,
  liturgyId,
  sectionIndex,
  onDone,
}: AddPrayerPanelProps): React.ReactElement {
  const router = useRouter();
  const [isWritingNew, setIsWritingNew] = useState(prayers.length === 0);
  const [prayerId, setPrayerId] = useState(prayers[0]?.id ?? "");
  const [text, setText] = useState(prayers[0]?.text ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPrayer = (id: string): void => {
    setPrayerId(id);
    setText(prayers.find((p) => p.id === id)?.text ?? "");
  };

  const handleWriteNew = (): void => {
    setIsWritingNew(true);
    setPrayerId("");
    setText("");
  };

  const handlePickExisting = (): void => {
    setIsWritingNew(false);
    const first = prayers[0];
    setPrayerId(first?.id ?? "");
    setText(first?.text ?? "");
  };

  const handleSave = (): void => {
    if (!text.trim()) return;
    setIsSaving(true);
    setError(null);

    const finish = (id: string): void => {
      addPrayer(liturgyId, sectionIndex, id).then((result) => {
        setIsSaving(false);
        if (result.success) {
          router.refresh();
          onDone();
        } else {
          setError(result.error ?? "Unable to place this Prayer right now.");
        }
      });
    };

    if (isWritingNew) {
      createPrayer(sectionName, text).then((result) => {
        if (result.success && result.data) {
          finish(result.data.id);
        } else {
          setIsSaving(false);
          setError(result.error ?? "Unable to save this Prayer right now.");
        }
      });
    } else {
      // This panel has no marking toolbar (Bold/Congregation/etc. are edited
      // from the Library instead) -- shift whatever marks the library entry
      // already has to match this text edit, rather than defaulting to `[]`
      // and silently wiping them.
      const original = prayers.find((p) => p.id === prayerId);
      const shiftedMarks = shiftMarksForEdit(original?.text ?? "", text, original?.marks ?? []);
      updatePrayer(prayerId, sectionName, text, undefined, shiftedMarks).then((result) => {
        if (result.success) {
          finish(prayerId);
        } else {
          setIsSaving(false);
          setError(result.error ?? "Unable to update this Prayer right now.");
        }
      });
    }
  };

  return (
    <div className="bg-surface-secondary border border-border rounded-md p-4 flex flex-col gap-3">
      {prayers.length > 0 && (
        <div className="flex gap-4 text-[13px] font-medium text-text-secondary">
          <button
            type="button"
            onClick={handlePickExisting}
            className={!isWritingNew ? "text-accent-dark" : undefined}
          >
            Pick existing
          </button>
          <button
            type="button"
            onClick={handleWriteNew}
            className={isWritingNew ? "text-accent-dark" : undefined}
          >
            Write new
          </button>
        </div>
      )}

      {!isWritingNew && prayers.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-text-secondary" htmlFor="prayer-select">
            Prayer
          </label>
          <select
            id="prayer-select"
            value={prayerId}
            onChange={(e) => handleSelectPrayer(e.target.value)}
            className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
          >
            {prayers.map((p) => (
              <option key={p.id} value={p.id}>
                {previewText(p.text)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="prayer-text">
          Text
        </label>
        <textarea
          id="prayer-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
        {!isWritingNew && prayers.length > 0 && (
          <p className="text-[13px] text-text-muted">
            Editing here updates this Prayer in the library for future use.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Add Prayer"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="self-start bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
