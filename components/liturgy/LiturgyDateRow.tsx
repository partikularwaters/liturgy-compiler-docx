"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LiturgyOptionsMenu from "@/components/liturgy/LiturgyOptionsMenu";
import ConfirmDeleteLiturgyDialog from "@/components/liturgy/ConfirmDeleteLiturgyDialog";
import { liturgyOccasionLabel } from "@/lib/liturgy/liturgyOccasionLabel";
import type { LiturgyDateGroup } from "@/lib/liturgy/groupLiturgiesByDate";
import type { LiturgySummary } from "@/types/liturgy";
import type { CurrentUser } from "@/lib/auth/getCurrentUser";

function formatDateDisplay(serviceDate: string): string {
  const [year, month, day] = serviceDate.split("-");
  return `${month}-${day}-${year}`;
}

interface LiturgyReadiness {
  status: "draft" | "ready";
  canMarkReady: boolean;
}

interface LiturgyDateRowProps {
  group: LiturgyDateGroup;
  isLast: boolean;
  // null for an anonymous visitor -- the whole per-liturgy options menu
  // (Edit/Mark as Ready/Web Link/Delete) is hidden entirely then, same
  // rule every other list row in the app already follows.
  currentUser: CurrentUser | null;
  // Needed only for the delete dialog's typed-confirmation reference --
  // omitted on the homepage's readOnly preview, where the menu never renders.
  currentUserName?: string | null;
  // true on the homepage's "Recent Liturgies" preview -- that list is
  // purely a display surface, not a management view, so no options menu
  // renders there at all. /liturgies is the one place it belongs.
  readOnly?: boolean;
  // Keyed by liturgy id -- only /liturgies resolves this (one computeProgress()
  // per row); omitted on the homepage since readOnly hides the menu that
  // would need it anyway. A plain Record, not a Map, so it survives the
  // Server->Client Component boundary.
  readiness?: Record<string, LiturgyReadiness>;
}

// One row per service_date: a Lord's Day #/Special Service anchor on the
// left, then a Morning container and a Vesper container to its right, each
// tagged with a left-anchored colored pill ("Morning"/"Vesper") rather than
// repeating the full template name inline. Redesigned 2026-08-28 (was:
// Morning/blank-middle-badge/Vesper, no per-item containers or menu).
export default function LiturgyDateRow({
  group,
  isLast,
  currentUser,
  currentUserName,
  readOnly = false,
  readiness,
}: LiturgyDateRowProps): React.ReactElement {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ primary: LiturgySummary; sibling: LiturgySummary | null } | null>(
    null
  );

  // Combined "delete both" is only offered for the common, unambiguous
  // one-Morning/one-Vesper pairing -- a "multiple of one type on one date"
  // data anomaly has no single correct sibling to pair with, so it's left
  // out of that convenience rather than guessed at.
  const pairEligible = group.morning.length === 1 && group.vesper.length === 1;

  const requestDelete = (liturgy: LiturgySummary): void => {
    setError(null);
    const sibling = pairEligible
      ? liturgy.templateName === "Morning Worship"
        ? group.vesper[0]
        : group.morning[0]
      : null;
    setDeleteTarget({ primary: liturgy, sibling });
  };

  const renderLiturgy = (liturgy: LiturgySummary, textClassName: string): React.ReactElement => {
    const readinessInfo = readiness?.[liturgy.id];
    return (
      <div key={liturgy.id} className="flex items-center gap-2 min-w-0">
        <Link href={`/liturgy/${liturgy.id}`} className={`flex-1 min-w-0 truncate ${textClassName}`}>
          {[liturgy.sermonPassage, formatDateDisplay(liturgy.serviceDate)].filter(Boolean).join(" | ")}
        </Link>
        {!readOnly && currentUser && (
          <LiturgyOptionsMenu
            liturgyId={liturgy.id}
            canMarkReady={readinessInfo?.status === "draft" && readinessInfo.canMarkReady}
            onDeleteClick={() => requestDelete(liturgy)}
          />
        )}
      </div>
    );
  };

  const renderSide = (
    liturgies: LiturgySummary[],
    tagLabel: string,
    tagClassName: string
  ): React.ReactElement => {
    if (liturgies.length === 0) return <div className="flex-1" />;

    return (
      <div className="flex-1 min-w-0 border border-border rounded-md px-3 py-2 flex flex-col gap-1.5">
        <span
          className={`self-start rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tagClassName}`}
        >
          {tagLabel}
        </span>
        {liturgies.length === 1
          ? renderLiturgy(liturgies[0], "text-sm text-text-primary hover:underline")
          : liturgies.map((liturgy) => renderLiturgy(liturgy, "text-[13px] text-text-secondary hover:underline"))}
      </div>
    );
  };

  return (
    <div className={`px-6 py-3 ${isLast ? "" : "border-b border-border"}`}>
      <div className="flex items-stretch gap-3">
        <div className="w-[140px] shrink-0 flex items-center px-3 py-2 rounded-md bg-surface-secondary">
          <span className="text-[13px] font-medium text-text-secondary">
            {liturgyOccasionLabel(group.serviceDate, group.lordsDayNumber).split(" | ")[1]}
          </span>
        </div>
        {renderSide(group.morning, "Morning", "bg-info-light text-info-foreground")}
        {renderSide(group.vesper, "Vesper", "bg-warning-light text-warning-foreground")}
      </div>
      {error && <p className="text-[12px] text-error mt-1">{error}</p>}

      {deleteTarget && currentUser && (
        <ConfirmDeleteLiturgyDialog
          primary={deleteTarget.primary}
          sibling={deleteTarget.sibling}
          currentUserName={currentUserName ?? ""}
          currentUserRole={currentUser.role}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => router.refresh()}
        />
      )}
    </div>
  );
}
