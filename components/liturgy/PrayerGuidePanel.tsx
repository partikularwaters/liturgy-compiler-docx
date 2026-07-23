"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GuideIcon } from "@/components/liturgy/icons";
import { setShowPrayerGuide } from "@/lib/liturgy/setShowPrayerGuideAction";
import type { Prayer } from "@/types/liturgy";

interface PrayerGuidePanelProps {
  guides: Prayer[];
  liturgyId: string;
  sectionIndex: number;
  showPrayerGuide: boolean;
}

// Feature 27: reference panel for 'guide'-kind Prayer library entries
// (redesign-plan-v1.1.md §W) -- shown next to "+ Prayer" on the six Sections
// that need one, never selectable/placeable as an actual liturgy item.
// Renders nothing when no guide exists yet for this Section, same "real
// gap, not a placeholder" discipline as everywhere else -- guides are
// optional reference material authored through /library, not seeded.
//
// Redesigned from an always-present collapsible
// box into a small icon-button toggle -- same 24x24 circle size as the
// alternate-translation button (AddExistingSelectionPanel.tsx) -- so a
// Section with a guide doesn't visually dominate the Compile View. Once
// opened, an "add to Leader's Guide" checkbox controls whether *this*
// liturgy's docx export actually includes it (persisted via
// showPrayerGuide -- see setShowPrayerGuideAction.ts), on by default.
export default function PrayerGuidePanel({
  guides,
  liturgyId,
  sectionIndex,
  showPrayerGuide,
}: PrayerGuidePanelProps): React.ReactElement | null {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (guides.length === 0) return null;

  const handleToggleIncluded = (): void => {
    setIsSaving(true);
    setShowPrayerGuide(liturgyId, sectionIndex, !showPrayerGuide).then((result) => {
      setIsSaving(false);
      if (result.success) router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Prayer Guide"
        className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full border border-border text-accent-dark hover:bg-surface-secondary"
      >
        <GuideIcon size={14} />
      </button>
      {isOpen && (
        <div className="bg-surface-secondary border border-border rounded-md p-3 flex flex-col gap-2 max-w-[420px]">
          <label className="flex items-center gap-2 text-[12px] font-medium text-text-secondary">
            <input
              type="checkbox"
              checked={showPrayerGuide}
              onChange={handleToggleIncluded}
              disabled={isSaving}
            />
            Add this Prayer Guide to the Leader&apos;s Guide
          </label>
          {guides.map((guide) => (
            <p key={guide.id} className="text-sm text-text-primary whitespace-pre-line">
              {guide.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
