"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SongForm from "@/components/songs/SongForm";
import { createSong } from "@/lib/songs/songActions";
import type { Song } from "@/types/liturgy";

interface NewSongClientProps {
  sectionNames: string[];
  allSongs: Song[];
}

export default function NewSongClient({ sectionNames, allSongs }: NewSongClientProps): React.ReactElement {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (
    sectionName: string,
    kind: "psalm" | "hymn",
    title: string,
    attribution: string,
    yearPublished: string,
    notes: string,
    translation: "fil" | "en" | null,
    pairedId: string | null
  ): void => {
    setIsSaving(true);
    setError(null);
    createSong(sectionName, kind, title, attribution, yearPublished, notes, translation, pairedId).then((result) => {
      setIsSaving(false);
      if (result.success) {
        router.push("/library");
      } else {
        setError(result.error ?? "Unable to save this Song right now.");
      }
    });
  };

  return (
    <SongForm
      sectionNames={sectionNames}
      initialSectionName=""
      initialKind="psalm"
      initialTitle=""
      initialAttribution=""
      initialYearPublished=""
      initialNotes=""
      allSongs={allSongs}
      isSaving={isSaving}
      error={error}
      submitLabel="Create Song"
      onSubmit={handleSave}
    />
  );
}
