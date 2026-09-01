"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/auth/authActions";
import { UserCircleIcon, ChevronDownIcon, LogoutIcon, ClockIcon } from "@/components/liturgy/icons";
import type { CurrentUser } from "@/lib/auth/getCurrentUser";
import type { SessionStatus } from "@/lib/auth/getSessionStatus";

interface AccountMenuProps {
  currentUser: CurrentUser | null;
  sessionStatus: SessionStatus;
  // Combined Account Requests + Library Submissions count -- only ever
  // non-zero for a Curator (the only role that can reach /curator-inbox at
  // all, per contextHref below). Zero renders no badge, not a "0" badge.
  pendingCuratorCount?: number;
}

// Replaces the previous inline "role badge + context link + Sign Out" (or
// "Sign Up + Sign In") sprawl in the nav with a single standard account
// affordance -- one icon button, same footprint whether signed in or out,
// opening a small dropdown for the actual choices. Matches how most apps
// (GitHub, Google, etc.) keep the nav's account surface to one control.
export default function AccountMenu({
  currentUser,
  sessionStatus,
  pendingCuratorCount = 0,
}: AccountMenuProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const showPendingBadge = currentUser?.role === "curator" && pendingCuratorCount > 0;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const contextHref = currentUser?.role === "curator" ? "/curator-inbox" : "/my-library";
  const contextLabel = currentUser?.role === "curator" ? "Curator Inbox" : "My Library";
  const isPending = sessionStatus.kind === "pending";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center gap-1 text-accent-foreground/70 hover:text-accent-foreground transition-[color,transform] duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
        aria-label={
          isPending
            ? "Account menu -- pending approval"
            : showPendingBadge
              ? `Account menu -- ${pendingCuratorCount} pending in Curator Inbox`
              : "Account menu"
        }
        aria-expanded={isOpen}
      >
        {isPending ? <ClockIcon size={22} /> : <UserCircleIcon size={22} />}
        <ChevronDownIcon size={14} />
        {showPendingBadge && (
          <span className="absolute -top-2 -right-2 rounded-full px-2 py-0.5 bg-accent-light text-accent-dark text-xs font-medium leading-none">
            {pendingCuratorCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-md shadow-lg py-1 z-50 origin-top-right transition-[opacity,transform] duration-[var(--duration-dropdown)] ease-[var(--ease-out-strong)] starting:opacity-0 motion-safe:starting:scale-95">
          {isPending ? (
            <>
              <div className="px-4 py-2 border-b border-border">
                <p className="text-[11px] font-medium uppercase text-text-muted">Pending Approval</p>
                <p className="text-[13px] text-text-secondary mt-1">
                  {sessionStatus.kind === "pending" && sessionStatus.firstName ? `Hi ${sessionStatus.firstName} — ` : ""}
                  your account is pending Curator approval.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary text-left"
              >
                <LogoutIcon size={15} /> Sign Out
              </button>
            </>
          ) : currentUser ? (
            <>
              <div className="px-4 py-2 border-b border-border">
                <p className="text-[11px] font-medium uppercase text-text-muted">
                  {currentUser.role === "curator" ? "Curator" : "Compiler"}
                </p>
                {currentUser.email && <p className="text-[13px] text-text-secondary truncate">{currentUser.email}</p>}
              </div>
              <Link
                href={contextHref}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary"
              >
                {contextLabel}
                {showPendingBadge && (
                  <span className="rounded-full px-2 py-0.5 bg-accent-light text-accent-dark text-xs font-medium leading-none">
                    {pendingCuratorCount}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary text-left"
              >
                <LogoutIcon size={15} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
