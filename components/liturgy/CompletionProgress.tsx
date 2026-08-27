"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markReady } from "@/lib/liturgy/liturgyReadinessActions";
import type { LiturgyProgress } from "@/lib/liturgy/readiness";

interface CompletionProgressProps {
  liturgyId: string;
  progress: LiturgyProgress;
  status: "draft" | "ready";
  canMarkReady: boolean;
}

export default function CompletionProgress({
  liturgyId,
  progress,
  status,
  canMarkReady,
}: CompletionProgressProps): React.ReactElement {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const percentage = progress.total === 0 ? 100 : (progress.completed / progress.total) * 100;
  const isReady = status === "ready";
  const canSubmit = progress.missing.length === 0 && canMarkReady && !isReady;

  // router.refresh() (not local state) is what keeps this in sync with the
  // server -- matches EndNoteToggle.tsx's established pattern for this exact
  // page. Local state alone would go stale the moment any other edit on this
  // page (any Section item add/edit/remove) flips the Liturgy back to Draft
  // server-side via markDraft()'s wiring in sectionItems.ts, since this
  // component isn't remounted by that refresh.
  const handleMarkReady = async (): Promise<void> => {
    setIsSaving(true);
    setError(null);

    const result = await markReady(liturgyId);
    setIsSaving(false);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Unable to mark this liturgy ready right now.");
    }
  };

  return (
    <section className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3" aria-label="Liturgy completion">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <p className="text-sm font-medium text-text-primary">
          {progress.completed} of {progress.total} required Sections complete
        </p>
        {isReady && <p className="text-sm font-medium text-success-foreground">Ready for publication</p>}
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-surface-secondary"
        role="progressbar"
        aria-label="Required Sections complete"
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.completed}
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${percentage}%` }} />
      </div>
      {progress.missing.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-medium text-text-secondary">Still needed</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {progress.missing.map((name) => {
              const sectionIndex = progress.sections.findIndex((section) => section.name === name);

              return (
                <li key={name}>
                  <a className="text-sm text-accent-dark underline" href={`#section-${sectionIndex}`}>
                    {name}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {canSubmit && (
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={handleMarkReady}
            disabled={isSaving}
            className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {isSaving ? "Marking ready…" : "Mark Ready for Publication"}
          </button>
          {error && (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
