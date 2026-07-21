"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setShowEndNote } from "@/lib/liturgy/setShowEndNoteAction";

interface EndNoteToggleProps {
  liturgyId: string;
  templateName: string;
  showEndNote: boolean;
}

// v2, direct feedback (2026-07-22): per-liturgy on/off for the trailing
// "~ End of [Service] ~" note in the docx export -- previously added by hand
// every time, with removal only as the rare exception when a week's layout
// is tight. Lives at the top of the Compile View (not per-Section) since
// it's a whole-document setting.
//
// Real bug found and fixed (2026-07-22): a failed save (e.g. the
// show_end_note migration not yet applied in a given environment) used to
// fail completely silently -- the button just did nothing, no error shown,
// which read as "this feature doesn't work" from the outside. Now surfaces
// the error, and uses an actual checkbox control instead of a color-only
// pill so the on/off state itself is unambiguous regardless of styling.
export default function EndNoteToggle({ liturgyId, templateName, showEndNote }: EndNoteToggleProps): React.ReactElement {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (): void => {
    setIsSaving(true);
    setError(null);
    setShowEndNote(liturgyId, !showEndNote).then((result) => {
      setIsSaving(false);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Unable to update this setting right now.");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <label className="inline-flex items-center gap-2 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-text-secondary bg-surface has-[:disabled]:opacity-50">
        <input type="checkbox" checked={showEndNote} onChange={handleToggle} disabled={isSaving} />
        {`"End of ${templateName}" note`}
      </label>
      {error && <p className="text-[11px] text-error">{error}</p>}
    </div>
  );
}
