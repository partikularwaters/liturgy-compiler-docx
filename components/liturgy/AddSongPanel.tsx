"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addSong } from "@/lib/liturgy/addSongAction";
import { createSong, updateSong } from "@/lib/songs/songActions";
import { songEntryUnchanged } from "@/lib/liturgy/pickedLibraryEntryUnchanged";
import { getAmenPolicy } from "@/lib/liturgy/amenPolicy";
import { XIcon } from "@/components/liturgy/icons";
import type { Song } from "@/types/liturgy";

interface AddSongPanelProps {
  songs: Song[];
  // null for an anonymous visitor -- "My Library" tab never shows then.
  currentUserId: string | null;
  kind: "psalm" | "hymn";
  sectionName: string;
  liturgyId: string;
  sectionIndex: number;
  onDone: () => void;
}

type Mode = "shared" | "mine" | "new";

function previewTitle(song: Song): string {
  return song.attribution ? `${song.title} (${song.attribution})` : song.title;
}

// task 6: same Shared Library / My Library / Write New split as
// AddPrayerPanel.tsx -- see that file's comment for the full reasoning.
export default function AddSongPanel({
  songs,
  currentUserId,
  kind,
  sectionName,
  liturgyId,
  sectionIndex,
  onDone,
}: AddSongPanelProps): React.ReactElement {
  const router = useRouter();
  const sharedSongs = songs.filter((s) => !s.ownerId);
  const mySongs = currentUserId ? songs.filter((s) => s.ownerId === currentUserId) : [];

  const [mode, setMode] = useState<Mode>(sharedSongs.length > 0 ? "shared" : mySongs.length > 0 ? "mine" : "new");
  const activeList = mode === "shared" ? sharedSongs : mode === "mine" ? mySongs : [];
  const [songId, setSongId] = useState(activeList[0]?.id ?? "");
  const [title, setTitle] = useState(activeList[0]?.title ?? "");
  const [attribution, setAttribution] = useState(activeList[0]?.attribution ?? "");
  const [yearPublished, setYearPublished] = useState(activeList[0]?.yearPublished ?? "");
  const [notes, setNotes] = useState(activeList[0]?.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amenPolicy = getAmenPolicy(sectionName);
  const [amenExpected, setAmenExpected] = useState(amenPolicy === "default-on");

  const attributionLabel = kind === "psalm" ? "Versification" : "Author";

  const applySong = (song: Song | undefined): void => {
    setSongId(song?.id ?? "");
    setTitle(song?.title ?? "");
    setAttribution(song?.attribution ?? "");
    setYearPublished(song?.yearPublished ?? "");
    setNotes(song?.notes ?? "");
  };

  const handleSelectSong = (id: string, list: Song[]): void => {
    applySong(list.find((s) => s.id === id));
  };

  const switchMode = (next: Mode): void => {
    setMode(next);
    setError(null);
    const list = next === "shared" ? sharedSongs : next === "mine" ? mySongs : [];
    applySong(list[0]);
  };

  const handleSave = (): void => {
    if (!title.trim()) return;
    setIsSaving(true);
    setError(null);

    const finish = (id: string): void => {
      addSong(liturgyId, sectionIndex, id, amenExpected).then((result) => {
        setIsSaving(false);
        if (result.success) {
          router.refresh();
          onDone();
        } else {
          setError(result.error ?? "Unable to place this Song right now.");
        }
      });
    };

    if (mode === "new") {
      createSong(sectionName, kind, title, attribution, yearPublished, notes).then((result) => {
        if (result.success && result.data) {
          finish(result.data.id);
        } else {
          setIsSaving(false);
          setError(result.error ?? "Unable to save this Song right now.");
        }
      });
    } else {
      // Placing an existing entry unmodified is not the same operation as
      // editing it -- only route through updateSong (Curator-only for a
      // Shared row) when the fields actually differ from what was picked.
      // Previously this always called updateSong first, so a Compiler
      // picking any unmodified Shared song was rejected before ever
      // reaching placement.
      const original = activeList.find((s) => s.id === songId);
      if (songEntryUnchanged(original, { title, attribution, yearPublished, notes })) {
        finish(songId);
        return;
      }

      // Editing a Shared entry here only succeeds for a Curator
      // (songActions.ts's own gate) -- a Compiler gets a clear error.
      updateSong(songId, sectionName, kind, title, attribution, yearPublished, notes).then((result) => {
        if (result.success) {
          finish(songId);
        } else {
          setIsSaving(false);
          setError(result.error ?? "Unable to update this Song right now.");
        }
      });
    }
  };

  return (
    <div className="bg-surface-secondary border border-border rounded-md p-4 flex flex-col gap-3">
      <div className="flex gap-4 text-[13px] font-medium text-text-secondary">
        {sharedSongs.length > 0 && (
          <button type="button" onClick={() => switchMode("shared")} className={mode === "shared" ? "text-accent-dark" : undefined}>
            Shared Library
          </button>
        )}
        {currentUserId && mySongs.length > 0 && (
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
          <label className="text-[13px] font-medium text-text-secondary" htmlFor="song-select">
            {kind === "psalm" ? "Psalm" : "Hymn"}
          </label>
          <select
            id="song-select"
            value={songId}
            onChange={(e) => handleSelectSong(e.target.value, activeList)}
            className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
          >
            {activeList.map((s) => (
              <option key={s.id} value={s.id}>
                {previewTitle(s)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="song-title">
          Title
        </label>
        <input
          id="song-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="song-attribution">
          {attributionLabel}
        </label>
        <input
          id="song-attribution"
          value={attribution}
          onChange={(e) => setAttribution(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="song-year">
          Year published (optional)
        </label>
        <input
          id="song-year"
          value={yearPublished}
          onChange={(e) => setYearPublished(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="song-notes">
          Notes (optional, Leader Guide only)
        </label>
        <textarea
          id="song-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>

      {amenPolicy !== "none" && (
        <label className="flex items-center gap-2 text-[13px] font-medium text-text-secondary">
          <input
            type="checkbox"
            checked={amenExpected}
            onChange={(e) => setAmenExpected(e.target.checked)}
          />
          Customarily ends in a sung Amen (Leader Guide only)
        </label>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? "Saving…" : `Add ${kind === "psalm" ? "Psalm" : "Hymn"}`}
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
