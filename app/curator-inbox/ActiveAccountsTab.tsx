"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/lib/curatorInbox/accountRequestActions";
import type { ActiveAccount } from "@/lib/curatorInbox/getActiveAccounts";

interface ActiveAccountsTabProps {
  accounts: ActiveAccount[];
}

export default function ActiveAccountsTab({ accounts }: ActiveAccountsTabProps): React.ReactElement {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (userId: string): void => {
    setPendingId(userId);
    setError(null);
    deleteAccount(userId).then((result) => {
      setPendingId(null);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Unable to delete this account right now.");
      }
    });
  };

  if (accounts.length === 0) {
    return <p className="text-sm text-text-muted">No active accounts.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-error">{error}</p>}
      {accounts.map((account) => (
        <div key={account.userId} className="flex items-center justify-between gap-4 bg-surface border border-border rounded-md px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">
              {account.firstName} {account.lastName}{" "}
              <span className="text-[11px] font-medium uppercase text-text-muted">({account.role})</span>
            </span>
            <span className="text-[13px] text-text-muted">{account.email}</span>
          </div>
          <button
            type="button"
            disabled={pendingId === account.userId}
            onClick={() => handleDelete(account.userId)}
            className="bg-error text-white rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            Delete Account
          </button>
        </div>
      ))}
    </div>
  );
}
