"use client";

import { useState } from "react";
import AddLibraryItemModal from "@/components/library/AddLibraryItemModal";
import { PlusIcon } from "@/components/liturgy/icons";
import type { Formula, Prayer, Song } from "@/types/liturgy";

interface AddLibraryItemButtonProps {
  type: "song" | "prayer" | "guide" | "formula";
  label: string;
  sectionNames: string[];
  songs?: Song[];
  prayers?: Prayer[];
  formulas?: Formula[];
}

// Self-contained trigger + modal for creating a new Song/Prayer/Formula from
// /library -- replaces the old "+ New X" link to a standalone /new page
// (Track B, 2026-08-31).
export default function AddLibraryItemButton({
  type,
  label,
  sectionNames,
  songs = [],
  prayers = [],
  formulas = [],
}: AddLibraryItemButtonProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
      >
        <PlusIcon size={15} /> {label}
      </button>
      {isOpen && (
        <AddLibraryItemModal
          type={type}
          sectionNames={sectionNames}
          songs={songs}
          prayers={prayers}
          formulas={formulas}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
