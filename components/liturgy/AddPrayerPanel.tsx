"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addPrayer } from "@/lib/liturgy/addPrayerAction";
import { createPrayer, updatePrayer } from "@/lib/prayers/prayerActions";
import { prayerEntryUnchanged } from "@/lib/liturgy/pickedLibraryEntryUnchanged";
import { shiftMarksForEdit } from "@/lib/text/marks";
import { XIcon } from "@/components/liturgy/icons";
import type { Prayer } from "@/types/liturgy";

interface AddPrayerPanelProps {
  prayers: Prayer[];
  // null for an anonymous visitor -- "My Library" tab never shows then,
  // since there's nothing of theirs to show.
  currentUserId: string | null;
  sectionName: string;
  liturgyId: string;
  sectionIndex: number;
  onDone: () => void;
}

type Mode = "shared" | "mine" | "new";

function previewText(text: string): string {
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

// task 6: replaces the old flat "Pick existing" dropdown (which mixed the
// shared canonical set with everyone's private forks indiscriminately) with
// three explicit modes -- Shared Library, My Library, Write New -- so it's
// always clear which set an entry is coming from before placing it.
export default function AddPrayerPanel({
  prayers,
  currentUserId,
  sectionName,
  liturgyId,
  sectionIndex,
  onDone,
}: AddPrayerPanelProps): React.ReactElement {
  const router = useRouter();
  const sharedPrayers = prayers.filter((p) => !p.ownerId);
  const myPrayers = currentUserId ? prayers.filter((p) => p.ownerId === currentUserId) : [];

  const [mode, setMode] = useState<Mode>(sharedPrayers.length > 0 ? "shared" : myPrayers.length > 0 ? "mine" : "new");
  const activeList = mode === "shared" ? sharedPrayers : mode === "mine" ? myPrayers : [];
  const [prayerId, setPrayerId] = useState(activeList[0]?.id ?? "");
  const [text, setText] = useState(activeList[0]?.text ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPrayer = (id: string, list: Prayer[]): void => {
    setPrayerId(id);
    setText(list.find((p) => p.id === id)?.text ?? "");
  };

  const switchMode = (next: Mode): void => {
    setMode(next);
    setError(null);
    const list = next === "shared" ? sharedPrayers : next === "mine" ? myPrayers : [];
    setPrayerId(list[0]?.id ?? "");
    setText(list[0]?.text ?? "");
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

    if (mode === "new") {
      createPrayer(sectionName, text).then((result) => {
        if (result.success && result.data) {
          finish(result.data.id);
        } else {
          setIsSaving(false);
          setError(result.error ?? "Unable to save this Prayer right now.");
        }
      });
    } else {
      // Placing an existing entry unmodified is not the same operation as
      // editing it -- only route through updatePrayer (Curator-only for a
      // Shared row) when the text actually differs from what was picked.
      // Previously this always called updatePrayer first, so a Compiler
      // picking any unmodified Shared prayer was rejected before ever
      // reaching placement.
      const original = activeList.find((p) => p.id === prayerId);
      if (prayerEntryUnchanged(original, text)) {
        finish(prayerId);
        return;
      }

      // This panel has no marking toolbar (Bold/Congregation/etc. are edited
      // from the Library instead) -- shift whatever marks the library entry
      // already has to match this text edit, rather than defaulting to `[]`
      // and silently wiping them. Editing a Shared entry here only succeeds
      // for a Curator (prayerActions.ts's own gate) -- a Compiler editing a
      // shared entry gets a clear error instead, same as everywhere else.
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
      <div className="flex gap-4 text-[13px] font-medium text-text-secondary">
        {sharedPrayers.length > 0 && (
          <button type="button" onClick={() => switchMode("shared")} className={mode === "shared" ? "text-accent-dark" : undefined}>
            Shared Library
          </button>
        )}
        {currentUserId && myPrayers.length > 0 && (
          <button type="button" onClick={() => switchMode("mine")} className={mode === "mine" ? "text-accent-dark" : undefined}>
            My Library
          </button>
        )}
        <button type="button" onClick={() => switchMode("new")} className={mode === "new" ? "text-accent-dark" : undefined}>
          Write New
        </button>
      </div>

      {mode !== "new" && activeList.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-text-secondary" htmlFor="prayer-select">
            Prayer
          </label>
          <select
            id="prayer-select"
            value={prayerId}
            onChange={(e) => handleSelectPrayer(e.target.value, activeList)}
            className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
          >
            {activeList.map((p) => (
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
        {mode !== "new" && activeList.length > 0 && (
          <p className="text-[13px] text-text-muted">
            {mode === "shared"
              ? "Editing here updates this Prayer in the shared library for future use."
              : "Editing here updates this Prayer in your own library for future use."}
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
          className="self-start inline-flex items-center gap-1 bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          <XIcon size={15} /> Cancel
        </button>
      </div>
    </div>
  );
}
