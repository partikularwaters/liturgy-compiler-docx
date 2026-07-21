"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SongForm from "@/components/songs/SongForm";
import { createSong } from "@/lib/songs/songActions";

interface NewSongClientProps {
  sectionNames: string[];
}

export default function NewSongClient({ sectionNames }: NewSongClientProps): React.ReactElement {
  const router = useRouter();
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
    createSong(sectionName, kind, title, attribution, yearPublished, notes).then((result) => {
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
      isSaving={isSaving}
      error={error}
      submitLabel="Create Song"
      onSubmit={handleSave}
    />
  );
}
