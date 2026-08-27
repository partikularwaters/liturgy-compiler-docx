"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteLiturgy } from "@/lib/liturgy/deleteLiturgyAction";
import { TrashIcon } from "@/components/liturgy/icons";
import { isSunday, parseLocalDate } from "@/lib/liturgy/lordsDay";
import type { LiturgyDateGroup } from "@/lib/liturgy/groupLiturgiesByDate";
import type { LiturgySummary } from "@/types/liturgy";
import type { CurrentUser } from "@/lib/auth/getCurrentUser";

function formatDateDisplay(serviceDate: string): string {
  const [year, month, day] = serviceDate.split("-");
  return `${month}-${day}-${year}`;
}

interface LiturgyDateRowProps {
  group: LiturgyDateGroup;
  isLast: boolean;
  // null for an anonymous visitor -- Delete is hidden entirely then, same
  // rule every other list row in the app already follows.
  currentUser: CurrentUser | null;
}

// One row per service_date, matching Library's two-column pattern: a
// Morning liturgy on the left, a Vesper liturgy on the right, Lord's Day #
// in the middle where a bilingual pair's divider would sit. Blank middle +
// blank opposite side when only one liturgy exists for that date at all
// (the degenerate single-liturgy case); Lord's Day # still shows for a real
// pair or for a "multiple of one type on one date" data anomaly, which
// renders as a plain-label parent with real links only on its narrower
// child rows.
export default function LiturgyDateRow({ group, isLast, currentUser }: LiturgyDateRowProps): React.ReactElement {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (liturgy: LiturgySummary, label: string): void => {
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    setDeletingId(liturgy.id);
    setError(null);
    deleteLiturgy(liturgy.id).then((result) => {
      setDeletingId(null);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Unable to delete this liturgy right now.");
      }
    });
  };

  const totalCount = group.morning.length + group.vesper.length;
  const showLordsDay = totalCount >= 2 && isSunday(parseLocalDate(group.serviceDate));

  const renderSide = (liturgies: LiturgySummary[], templateName: string): React.ReactElement => {
    if (liturgies.length === 0) return <div className="flex-1" />;

    if (liturgies.length === 1) {
      const liturgy = liturgies[0];
      const label = [templateName, liturgy.sermonPassage, formatDateDisplay(liturgy.serviceDate)]
        .filter(Boolean)
        .join(" | ");
      return (
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <Link href={`/liturgy/${liturgy.id}`} className="flex-1 min-w-0 text-sm text-text-primary hover:underline truncate">
            {label}
          </Link>
          {currentUser && (
            <button
              type="button"
              onClick={() => handleDelete(liturgy, label)}
              disabled={deletingId === liturgy.id}
              title="Delete this liturgy"
              className="text-text-muted hover:text-error disabled:opacity-50 shrink-0 transition-colors duration-[var(--duration-tooltip)] ease"
            >
              <TrashIcon size={16} />
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">
          {templateName} | {formatDateDisplay(liturgies[0].serviceDate)}
        </p>
        <div className="flex flex-col gap-1 pl-3 border-l border-border">
          {liturgies.map((liturgy) => (
            <div key={liturgy.id} className="flex items-center gap-2 min-w-0">
              <Link
                href={`/liturgy/${liturgy.id}`}
                className="flex-1 min-w-0 text-[13px] text-text-secondary hover:underline truncate"
              >
                {liturgy.sermonPassage ?? "(no passage yet)"}
              </Link>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => handleDelete(liturgy, liturgy.sermonPassage ?? templateName)}
                  disabled={deletingId === liturgy.id}
                  title="Delete this liturgy"
                  className="text-text-muted hover:text-error disabled:opacity-50 shrink-0 transition-colors duration-[var(--duration-tooltip)] ease"
                >
                  <TrashIcon size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`px-6 py-3 ${isLast ? "" : "border-b border-border"}`}>
      <div className="flex items-start gap-4">
        {renderSide(group.morning, "Morning Worship")}
        <div className="w-[120px] shrink-0 text-center text-[13px] font-medium text-text-secondary pt-0.5">
          {showLordsDay ? `Lord's Day ${group.lordsDayNumber}` : ""}
        </div>
        {renderSide(group.vesper, "Vesper Worship")}
      </div>
      {error && <p className="text-[12px] text-error mt-1">{error}</p>}
    </div>
  );
}
