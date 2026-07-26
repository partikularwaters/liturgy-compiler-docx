"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitForReview } from "@/lib/personalLibrary/submitActions";
import type { MyDraft } from "@/lib/personalLibrary/getMyDrafts";

interface MyDraftsListProps {
  drafts: MyDraft[];
}

export default function MyDraftsList({ drafts }: MyDraftsListProps): React.ReactElement {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (draft: MyDraft): void => {
    setPendingId(draft.id);
    setError(null);
    submitForReview(draft.table, draft.id).then((result) => {
      setPendingId(null);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Unable to submit this right now.");
      }
    });
  };

  if (drafts.length === 0) {
    return <p className="text-sm text-text-muted">No drafts yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-error">{error}</p>}
      {drafts.map((draft) => (
        <div
          key={`${draft.table}-${draft.id}`}
          className="flex items-center justify-between gap-4 bg-surface border border-border rounded-md px-4 py-3"
        >
          <div className="flex flex-col">
            <span className="text-[13px] font-medium uppercase text-text-muted">
              {draft.table.replace(/s$/, "")} &middot; {draft.sectionName}
            </span>
            <span className="text-sm text-text-primary">{draft.display}</span>
          </div>
          <button
            type="button"
            disabled={pendingId === draft.id}
            onClick={() => handleSubmit(draft)}
            className="bg-accent text-accent-foreground rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            Submit for Review
          </button>
        </div>
      ))}
    </div>
  );
}
