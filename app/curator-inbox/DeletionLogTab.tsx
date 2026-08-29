import { liturgyOccasionLabel } from "@/lib/liturgy/liturgyOccasionLabel";
import type { DeletionLogEntry } from "@/lib/curatorInbox/getDeletionLog";

interface DeletionLogTabProps {
  entries: DeletionLogEntry[];
}

function formatTimestamp(deletedAt: string): string {
  return new Date(deletedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Read-only -- there is nothing to act on here, unlike every other tab on
// this page. Exists purely so a Curator can see who deleted what liturgy
// and when.
export default function DeletionLogTab({ entries }: DeletionLogTabProps): React.ReactElement {
  if (entries.length === 0) {
    return <p className="text-sm text-text-muted">No liturgies have been deleted.</p>;
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className={`px-4 py-3 flex items-center justify-between gap-4 ${
            index === entries.length - 1 ? "" : "border-b border-border"
          }`}
        >
          <div className="flex flex-col">
            <span className="text-sm text-text-primary">
              {entry.templateName} — {liturgyOccasionLabel(entry.serviceDate, entry.lordsDayNumber)}
            </span>
            <span className="text-[13px] text-text-muted">
              Deleted by {entry.deletedByName} ({entry.deletedRole}) &middot; {formatTimestamp(entry.deletedAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
