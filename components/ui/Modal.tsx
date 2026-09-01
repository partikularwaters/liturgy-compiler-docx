"use client";

import { useEffect, useId, useRef } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "default" | "compact";
  closeOnOverlayClick?: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Generic modal for a simple content overlay -- built for Library "See
// more" previews. Owns the standard dialog contract directly here (role/
// aria-modal/aria-labelledby, Escape to dismiss, initial focus on open,
// Tab/Shift+Tab contained within the dialog, focus restored to whatever
// triggered it on close) so any future caller gets it for free.
export default function Modal({
  title,
  onClose,
  children,
  size = "default",
  closeOnOverlayClick = true,
}: ModalProps): React.ReactElement {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  // Callers pass onClose as a fresh inline closure every render (the
  // established pattern throughout this codebase's panels) -- keeping it
  // out of the mount effect's dependency array via a ref, same reasoning
  // as code-standards.md's Effects rule, so open/focus/Escape setup runs
  // exactly once per modal instance instead of on every parent re-render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-text-primary/40 flex items-center justify-center p-6 z-50 transition-opacity duration-[var(--duration-modal)] ease-[var(--ease-out-strong)] starting:opacity-0"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-surface border border-border rounded-lg shadow-lg ${
          size === "compact" ? "max-w-[440px]" : "max-w-[560px]"
        } w-full max-h-[80vh] overflow-y-auto p-6 flex flex-col gap-4 transition-[opacity,transform] duration-[var(--duration-modal)] ease-[var(--ease-out-strong)] starting:opacity-0 motion-safe:starting:scale-95`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 id={titleId} className="text-[16px] font-semibold text-text-primary">
            {title}
          </h3>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-xl leading-none transition-[color,transform] duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
