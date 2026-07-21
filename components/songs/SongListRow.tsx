"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import SongForm from "@/components/songs/SongForm";
import { updateSong, deleteSong } from "@/lib/songs/songActions";
import { TrashIcon } from "@/components/liturgy/icons";
import type { Song } from "@/types/liturgy";

interface SongListRowProps {
  song: Song;
  sectionNames: string[];
}

export default function SongListRow({ song, sectionNames }: SongListRowProps): React.ReactElement {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (
    sectionName: string,
    kind: "psalm" | "hymn",
    title: string,
    attribution: string,
    yearPublished: string,
    notes: string
  ): void => {
    setIsSaving(true);
    setError(null);
    updateSong(song.id, sectionName, kind, title, attribution, yearPublished, notes).then((result) => {
      setIsSaving(false);
      if (result.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        setError(result.error ?? "Unable to update this Song right now.");
      }
    });
  };

  const handleDelete = (): void => {
    if (!window.confirm(`Delete "${song.title}"? This does not remove it from liturgies it's already placed in.`)) {
      return;
    }
    deleteSong(song.id).then((result) => {
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Unable to delete this Song right now.");
      }
    });
  };

  if (isEditing) {
    return (
      <div className="border-b border-border py-4">
        <SongForm
          sectionNames={sectionNames}
          initialSectionName={song.sectionName}
          initialKind={song.kind}
          initialTitle={song.title}
          initialAttribution={song.attribution ?? ""}
          initialYearPublished={song.yearPublished ?? ""}
          initialNotes={song.notes ?? ""}
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
        <p className="text-[13px] text-text-secondary">{song.sectionName}</p>
        <p className="text-sm font-medium text-text-primary">
          {song.title}
          {song.attribution && <span className="text-text-secondary"> — {song.attribution}</span>}
        </p>
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
