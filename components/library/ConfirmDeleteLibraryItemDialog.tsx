"use client";

import Modal from "@/components/ui/Modal";

interface ConfirmDeleteLibraryItemDialogProps {
  // Human-readable description of the item being deleted, e.g. `"Absolution"`
  // or `"Ps 95:1-3"` -- interpolated directly into the confirmation sentence.
  itemLabel: string;
  isDeleting: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

// Shared across Formula/Prayer/Song/Scripture Selection list rows -- same
// designed-dialog shape as ConfirmDeleteLiturgyDialog.tsx, minus its
// typed-name confirmation gate (a library item's deletion isn't the same
// weight of decision a whole liturgy's is).
export default function ConfirmDeleteLibraryItemDialog({
  itemLabel,
  isDeleting,
  error,
  onConfirm,
  onClose,
}: ConfirmDeleteLibraryItemDialogProps): React.ReactElement {
  return (
    <Modal title="Confirm deletion" onClose={onClose} size="compact">
      <p className="text-sm text-text-secondary">
        Delete {itemLabel}? This does not remove it from liturgies it&rsquo;s already placed in.
      </p>
      {error && <p className="text-sm text-error">{error}</p>}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={isDeleting}
          onClick={onConfirm}
          className="w-full bg-error text-error-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
