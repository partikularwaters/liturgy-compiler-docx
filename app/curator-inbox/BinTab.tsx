"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { restoreFromBin, deletePermanently } from "@/lib/curatorInbox/binActions";
import type { BinnedItem } from "@/lib/curatorInbox/getBinnedItems";

interface BinTabProps {
  items: BinnedItem[];
}

export default function BinTab({ items }: BinTabProps): React.ReactElement {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = (key: string, action: () => Promise<{ success: boolean; error?: string }>): void => {
    setPendingId(key);
    setError(null);
    action().then((result) => {
      setPendingId(null);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Unable to complete that action right now.");
      }
    });
  };

  if (items.length === 0) {
    return <p className="text-sm text-text-muted">The Bin is empty.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-error">{error}</p>}
      {items.map((item) => {
        const key = `${item.table}-${item.id}`;
        return (
          <div key={key} className="flex items-center justify-between gap-4 bg-surface border border-border rounded-md px-4 py-3">
            <div className="flex flex-col">
              <span className="text-[13px] font-medium uppercase text-text-muted">
                {item.table.replace(/s$/, "")} &middot; {item.sectionName}
              </span>
              <span className="text-sm text-text-primary">{item.display}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pendingId === key}
                onClick={() => runAction(key, () => restoreFromBin(item.table, item.id))}
                className="bg-surface border border-border text-text-primary rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
              >
                Restore
              </button>
              <button
                type="button"
                disabled={pendingId === key}
                onClick={() => runAction(key, () => deletePermanently(item.table, item.id))}
                className="bg-error text-white rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
