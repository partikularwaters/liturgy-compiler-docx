"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { grantRole, rejectAccountRequest } from "@/lib/curatorInbox/accountRequestActions";
import type { AccountRequest } from "@/lib/curatorInbox/getAccountRequests";

interface AccountRequestsTabProps {
  requests: AccountRequest[];
}

export default function AccountRequestsTab({ requests }: AccountRequestsTabProps): React.ReactElement {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGrant = (userId: string, role: "curator" | "compiler"): void => {
    setPendingAction(userId);
    setError(null);
    grantRole(userId, role).then((result) => {
      setPendingAction(null);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Unable to grant that role right now.");
      }
    });
  };

  const handleReject = (userId: string): void => {
    setPendingAction(userId);
    setError(null);
    rejectAccountRequest(userId).then((result) => {
      setPendingAction(null);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Unable to reject that request right now.");
      }
    });
  };

  if (requests.length === 0) {
    return <p className="text-sm text-text-muted">No pending account requests.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-error">{error}</p>}
      {requests.map((request) => (
        <div
          key={request.userId}
          className="flex items-center justify-between gap-4 bg-surface border border-border rounded-md px-4 py-3"
        >
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">
              {request.firstName} {request.lastName}
            </span>
            <span className="text-[13px] text-text-muted">{request.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pendingAction === request.userId}
              onClick={() => handleGrant(request.userId, "compiler")}
              className="bg-surface border border-border text-text-primary rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              Grant Compiler
            </button>
            <button
              type="button"
              disabled={pendingAction === request.userId}
              onClick={() => handleGrant(request.userId, "curator")}
              className="bg-surface border border-border text-text-primary rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              Grant Curator
            </button>
            <button
              type="button"
              disabled={pendingAction === request.userId}
              onClick={() => handleReject(request.userId)}
              className="bg-error text-white rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
