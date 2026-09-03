"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { amendExisting, createAsNew, rejectSubmission } from "@/lib/curatorInbox/librarySubmissionActions";
import { wordDiff } from "@/lib/text/wordDiff";
import type { LibrarySubmissions } from "@/lib/curatorInbox/getLibrarySubmissions";

interface LibrarySubmissionsTabProps {
  submissions: LibrarySubmissions;
}

// Word-level diff rendering: removed words struck-through in one color,
// added words highlighted in another -- comparable to how code
// edits show in a different color before committing.
function DiffView({ oldText, newText }: { oldText: string; newText: string }): React.ReactElement {
  const tokens = wordDiff(oldText, newText);
  return (
    <p className="text-sm whitespace-pre-wrap leading-relaxed">
      {tokens.map((token, index) => {
        if (token.type === "same") return <span key={index}>{token.value}</span>;
        if (token.type === "removed") {
          return (
            <span key={index} className="bg-error/10 text-error line-through">
              {token.value}
            </span>
          );
        }
        return (
          <span key={index} className="bg-accent/10 text-accent">
            {token.value}
          </span>
        );
      })}
    </p>
  );
}

export default function LibrarySubmissionsTab({ submissions }: LibrarySubmissionsTabProps): React.ReactElement {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = (key: string, action: () => Promise<{ success: boolean; error?: string }>): void => {
    setPendingAction(key);
    setError(null);
    action().then((result) => {
      setPendingAction(null);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Unable to complete that action right now.");
      }
    });
  };

  const hasAny = submissions.prayersAndSongs.length > 0 || submissions.formulas.length > 0;
  if (!hasAny) {
    return <p className="text-sm text-text-muted">No pending Library submissions.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-error">{error}</p>}

      {submissions.prayersAndSongs.map((submission) => {
        const key = `${submission.kind}-${submission.id}`;
        return (
          <div key={key} className="flex flex-col gap-2 bg-surface border border-border rounded-md px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium uppercase text-text-muted">
                {submission.kind} &middot; {submission.sectionName}
              </span>
              <div className="flex items-center gap-2">
                {submission.originalDisplay !== null && (
                  <button
                    type="button"
                    disabled={pendingAction === key}
                    onClick={() => runAction(key, () => amendExisting(submission.kind === "prayer" ? "prayers" : "songs", submission.id))}
                    className="bg-surface border border-border text-text-primary rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                  >
                    Amend Existing
                  </button>
                )}
                <button
                  type="button"
                  disabled={pendingAction === key}
                  onClick={() => runAction(key, () => createAsNew(submission.kind === "prayer" ? "prayers" : "songs", submission.id))}
                  className="bg-surface border border-border text-text-primary rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                >
                  Create as New
                </button>
                <button
                  type="button"
                  disabled={pendingAction === key}
                  onClick={() => runAction(key, () => rejectSubmission(submission.kind === "prayer" ? "prayers" : "songs", submission.id))}
                  className="bg-error text-white rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
            {submission.originalDisplay !== null ? (
              <DiffView oldText={submission.originalDisplay} newText={submission.submittedDisplay} />
            ) : (
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-text-primary">{submission.submittedDisplay}</p>
            )}
          </div>
        );
      })}

      {submissions.formulas.map((submission) => {
        const key = `formula-${submission.id}`;
        return (
          <div key={key} className="flex flex-col gap-2 bg-surface border border-border rounded-md px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium uppercase text-text-muted">
                formula &middot; {submission.sectionName} &middot; {submission.name}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pendingAction === key}
                  onClick={() => runAction(key, () => createAsNew("formulas", submission.id))}
                  className="bg-surface border border-border text-text-primary rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                >
                  Create as New
                </button>
                <button
                  type="button"
                  disabled={pendingAction === key}
                  onClick={() => runAction(key, () => rejectSubmission("formulas", submission.id))}
                  className="bg-error text-white rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed text-text-primary">{submission.display}</p>
          </div>
        );
      })}
    </div>
  );
}
