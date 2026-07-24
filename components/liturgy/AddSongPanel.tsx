"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addSong } from "@/lib/liturgy/addSongAction";
import { createSong, updateSong } from "@/lib/songs/songActions";
import { XIcon } from "@/components/liturgy/icons";
import type { Song } from "@/types/liturgy";

interface AddSongPanelProps {
  songs: Song[];
  kind: "psalm" | "hymn";
  sectionName: string;
  liturgyId: string;
  sectionIndex: number;
  onDone: () => void;
}

function previewTitle(song: Song): string {
  return song.attribution ? `${song.title} (${song.attribution})` : song.title;
}

export default function AddSongPanel({
  songs,
  kind,
  sectionName,
  liturgyId,
  sectionIndex,
  onDone,
}: AddSongPanelProps): React.ReactElement {
  const router = useRouter();
  const [isWritingNew, setIsWritingNew] = useState(songs.length === 0);
  const [songId, setSongId] = useState(songs[0]?.id ?? "");
  const [title, setTitle] = useState(songs[0]?.title ?? "");
  const [attribution, setAttribution] = useState(songs[0]?.attribution ?? "");
  const [yearPublished, setYearPublished] = useState(songs[0]?.yearPublished ?? "");
  const [notes, setNotes] = useState(songs[0]?.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attributionLabel = kind === "psalm" ? "Versification" : "Author";

  const handleSelectSong = (id: string): void => {
    const song = songs.find((s) => s.id === id);
    setSongId(id);
    setTitle(song?.title ?? "");
    setAttribution(song?.attribution ?? "");
    setYearPublished(song?.yearPublished ?? "");
    setNotes(song?.notes ?? "");
  };

  const handleWriteNew = (): void => {
    setIsWritingNew(true);
    setSongId("");
    setTitle("");
    setAttribution("");
    setYearPublished("");
    setNotes("");
  };

  const handlePickExisting = (): void => {
    setIsWritingNew(false);
    handleSelectSong(songs[0]?.id ?? "");
  };

  const handleSave = (): void => {
    if (!title.trim()) return;
    setIsSaving(true);
    setError(null);

    const finish = (id: string): void => {
      addSong(liturgyId, sectionIndex, id).then((result) => {
        setIsSaving(false);
        if (result.success) {
          router.refresh();
          onDone();
        } else {
          setError(result.error ?? "Unable to place this Song right now.");
        }
      });
    };

    if (isWritingNew) {
      createSong(sectionName, kind, title, attribution, yearPublished, notes).then((result) => {
        if (result.success && result.data) {
          finish(result.data.id);
        } else {
          setIsSaving(false);
          setError(result.error ?? "Unable to save this Song right now.");
        }
      });
    } else {
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
      {songs.length > 0 && (
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

      {!isWritingNew && songs.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-text-secondary" htmlFor="song-select">
            {kind === "psalm" ? "Psalm" : "Hymn"}
          </label>
          <select
            id="song-select"
            value={songId}
            onChange={(e) => handleSelectSong(e.target.value)}
            className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
          >
            {songs.map((s) => (
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
