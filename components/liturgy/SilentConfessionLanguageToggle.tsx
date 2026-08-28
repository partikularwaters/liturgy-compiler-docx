"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setSilentConfessionLanguage } from "@/lib/liturgy/setSilentConfessionLanguageAction";

interface SilentConfessionLanguageToggleProps {
  liturgyId: string;
  sectionIndex: number;
  language: "fil" | "en";
  canEdit: boolean;
}

// Which language the Silent Confession rubric (Confession of Sin) is in --
// a real per-liturgy stored choice (setSilentConfessionLanguageAction.ts),
// English carrying equal authority to Tagalog, not a fallback. Same
// segmented two-button shape as the Reader's AB/BSB toggle
// (ReaderClient.tsx), but *with* press/hover feedback -- the Reader's own
// toggle is deliberately unanimated (very-high-frequency surface per this
// app's frequency map), while the Compile View is an occasional surface
// that gets the standard animated recipe everywhere else.
export default function SilentConfessionLanguageToggle({
  liturgyId,
  sectionIndex,
  language,
  canEdit,
}: SilentConfessionLanguageToggleProps): React.ReactElement | null {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  if (!canEdit) return null;

  const handleChange = (next: "fil" | "en"): void => {
    if (next === language || isSaving) return;
    setIsSaving(true);
    setSilentConfessionLanguage(liturgyId, sectionIndex, next).then((result) => {
      setIsSaving(false);
      if (result.success) router.refresh();
    });
  };

  const buttonClass = (isActive: boolean): string =>
    [
      "px-3 py-1.5 text-[11px] font-medium transition-[color,background-color,transform] duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]",
      isActive ? "bg-accent text-accent-foreground" : "bg-surface text-text-secondary hover:bg-surface-secondary",
    ].join(" ");

  return (
    <div className="inline-flex items-center rounded-md border border-border overflow-hidden shrink-0">
      <button type="button" onClick={() => handleChange("fil")} disabled={isSaving} className={buttonClass(language === "fil")}>
        FIL
      </button>
      <button type="button" onClick={() => handleChange("en")} disabled={isSaving} className={buttonClass(language === "en")}>
        EN
      </button>
    </div>
  );
}
