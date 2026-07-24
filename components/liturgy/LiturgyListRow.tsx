"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteLiturgy } from "@/lib/liturgy/deleteLiturgyAction";
import { TrashIcon } from "@/components/liturgy/icons";
import type { LiturgySummary } from "@/types/liturgy";
import { formatLiturgyName } from "@/lib/liturgy/formatLiturgyName";

interface LiturgyListRowProps {
  liturgy: LiturgySummary;
  isLast: boolean;
}

// v3 groundwork: delete is unrestricted for now -- prepared
// ahead of role-based access (see deleteLiturgyAction.ts's own note), not
// gated to any user yet.
export default function LiturgyListRow({ liturgy, isLast }: LiturgyListRowProps): React.ReactElement {
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
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        title="Delete this liturgy"
        className="text-text-muted hover:text-error disabled:opacity-50"
      >
        <TrashIcon size={17} />
      </button>
    </div>
  );
}
