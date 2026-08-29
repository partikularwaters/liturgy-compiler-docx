"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markReady } from "@/lib/liturgy/liturgyReadinessActions";
import { MoreIcon, PencilIcon, CircleCheckIcon, CopyLinkIcon, TrashIcon, CheckIcon } from "@/components/liturgy/icons";

interface LiturgyOptionsMenuProps {
  liturgyId: string;
  canMarkReady: boolean;
  onDeleteClick: () => void;
}

const itemClass =
  "w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary text-left transition-colors duration-[var(--duration-tooltip)] ease";

// Per-liturgy 3-dot menu (Edit / Mark as Ready / Web Link / Delete) --
// replaces the old bare trash icon. Mark as Ready is omitted entirely
// (not just disabled) unless the caller has already confirmed this
// liturgy is actually complete, per canMarkReady -- see the per-row
// computeProgress() resolution in app/liturgies/page.tsx.
export default function LiturgyOptionsMenu({ liturgyId, canMarkReady, onDeleteClick }: LiturgyOptionsMenuProps): React.ReactElement {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMarkingReady, setIsMarkingReady] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleCopyLink = (): void => {
    navigator.clipboard.writeText(`${window.location.origin}/liturgy/${liturgyId}/view`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleMarkReady = (): void => {
    setIsMarkingReady(true);
    markReady(liturgyId).then((result) => {
      setIsMarkingReady(false);
      setIsOpen(false);
      if (result.success) {
        router.refresh();
      }
    });
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Liturgy options"
        aria-expanded={isOpen}
        className="text-text-muted hover:text-text-primary rounded-sm p-1 transition-[color,transform] duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
      >
        <MoreIcon size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-surface border border-border rounded-md shadow-lg py-1 z-50 origin-top-right transition-[opacity,transform] duration-[var(--duration-dropdown)] ease-[var(--ease-out-strong)] starting:opacity-0 motion-safe:starting:scale-95">
          <Link href={`/liturgy/${liturgyId}`} onClick={() => setIsOpen(false)} className={itemClass}>
            <PencilIcon size={15} /> Edit
          </Link>
          {canMarkReady && (
            <button type="button" disabled={isMarkingReady} onClick={handleMarkReady} className={`${itemClass} disabled:opacity-50`}>
              <CircleCheckIcon size={15} /> Mark as Ready
            </button>
          )}
          <button type="button" onClick={handleCopyLink} className={itemClass}>
            {copied ? <CheckIcon size={15} /> : <CopyLinkIcon size={15} />} {copied ? "Copied!" : "Web Link"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onDeleteClick();
            }}
            className={`${itemClass} text-error`}
          >
            <TrashIcon size={15} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
