"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LiturgyOptionsMenu from "@/components/liturgy/LiturgyOptionsMenu";
import ConfirmDeleteLiturgyDialog from "@/components/liturgy/ConfirmDeleteLiturgyDialog";
import { getLiturgyOccasionParts } from "@/lib/liturgy/liturgyOccasionLabel";
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
  const { serviceDateLabel, occasionLabel } = getLiturgyOccasionParts(group.serviceDate, group.lordsDayNumber);

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

  // One bordered container per liturgy, never a shared box holding a
  // stacked list -- previously a "multiple of one type on one date"
  // anomaly nested several liturgies inside one tag'd box, which also made
  // that box (and, since the row used items-stretch, the LD#/Special
  // Service anchor next to it) grow taller the more liturgies existed.
  // Each liturgy now gets its own fixed-shape box regardless of how many
  // siblings share its column.
  const renderLiturgy = (liturgy: LiturgySummary, tagLabel: string, tagClassName: string): React.ReactElement => {
    const readinessInfo = readiness?.[liturgy.id];
    return (
      <div key={liturgy.id} className="min-w-0 border border-border rounded-md px-3 py-2 flex flex-col gap-1.5">
        <span className={`self-start rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tagClassName}`}>
          {tagLabel}
        </span>
        <div className="flex items-center gap-2 min-w-0">
          <Link href={`/liturgy/${liturgy.id}`} className="flex-1 min-w-0 truncate text-sm text-text-primary hover:underline">
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
      </div>
    );
  };

  const renderSide = (liturgies: LiturgySummary[], tagLabel: string, tagClassName: string): React.ReactElement => (
    <div
      className={`${liturgies.length === 0 ? "hidden sm:flex" : "flex"} w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-1`}
    >
      {liturgies.map((liturgy) => renderLiturgy(liturgy, tagLabel, tagClassName))}
    </div>
  );

  return (
    <div className={`px-6 py-3 ${isLast ? "" : "border-b border-border"}`}>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start">
        <div className="w-full shrink-0 flex flex-row items-baseline justify-start gap-2 border-b border-border pb-2 text-left font-serif-body [font-variant:small-caps] sm:w-[120px] sm:self-stretch sm:flex-col sm:items-start sm:justify-center sm:gap-1 sm:border-b-0 sm:border-r sm:py-2">
          <span className="text-[16px] font-semibold leading-5 text-text-primary">
            {occasionLabel}
          </span>
          <span className="text-[13px] leading-[18px] text-text-muted">
            {serviceDateLabel}
          </span>
        </div>
        {renderSide(group.morning, "Morning", "bg-morning text-morning-foreground")}
        {renderSide(group.vesper, "Vesper", "bg-vesper text-vesper-foreground")}
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
