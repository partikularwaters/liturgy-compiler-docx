"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteLiturgy } from "@/lib/liturgy/deleteLiturgyAction";
import { TrashIcon } from "@/components/liturgy/icons";
import type { LiturgySummary } from "@/types/liturgy";
import { formatLiturgyName } from "@/lib/liturgy/formatLiturgyName";
import type { CurrentUser } from "@/lib/auth/getCurrentUser";

interface LiturgyListRowProps {
  liturgy: LiturgySummary;
  isLast: boolean;
  // null for an anonymous visitor -- Delete is hidden entirely then, same
  // "no false affordance" rule as the Library list rows.
  currentUser: CurrentUser | null;
}

export default function LiturgyListRow({ liturgy, isLast, currentUser }: LiturgyListRowProps): React.ReactElement {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (): void => {
    if (!window.confirm(`Delete "${formatLiturgyName(liturgy)}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    setError(null);
    deleteLiturgy(liturgy.id).then((result) => {
      setIsDeleting(false);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Unable to delete this liturgy right now.");
      }
    });
  };

  return (
    <div className={`flex items-center gap-2 px-6 py-3 ${isLast ? "" : "border-b border-border"}`}>
      <Link href={`/liturgy/${liturgy.id}`} className="flex-1 text-sm text-text-primary hover:underline">
        {formatLiturgyName(liturgy)}
      </Link>
      {error && <p className="text-[12px] text-error">{error}</p>}
      {currentUser && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Delete this liturgy"
          className="text-text-muted hover:text-error disabled:opacity-50"
        >
          <TrashIcon size={17} />
        </button>
      )}
    </div>
  );
}
