"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { deleteLiturgy } from "@/lib/liturgy/deleteLiturgyAction";
import { liturgyOccasionLabel } from "@/lib/liturgy/liturgyOccasionLabel";
import type { LiturgySummary } from "@/types/liturgy";

interface ConfirmDeleteLiturgyDialogProps {
  // The liturgy whose Delete was clicked -- always selected, never toggleable.
  primary: LiturgySummary;
  // The paired liturgy on the same service_date, only offered as a combined
  // delete when the row is the common one-Morning/one-Vesper shape --
  // LiturgyDateRow.tsx decides eligibility, this component just renders
  // whatever it's given.
  sibling: LiturgySummary | null;
  currentUserName: string;
  currentUserRole: "compiler" | "curator";
  onClose: () => void;
  onDeleted: () => void;
}

// GitHub's own type-the-name-to-confirm pattern, adapted: a Compiler must
// type their own account name back exactly (printed as the reference) --
// low friction to get right since it's their own name, but still a
// deliberate, personal, on-the-record action. A Curator skips the typed
// gate entirely (see deleteLiturgyAction.ts's comment) since they're
// already the trust boundary this record exists to inform.
export default function ConfirmDeleteLiturgyDialog({
  primary,
  sibling,
  currentUserName,
  currentUserRole,
  onClose,
  onDeleted,
}: ConfirmDeleteLiturgyDialogProps): React.ReactElement {
  const [siblingSelected, setSiblingSelected] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tracks which of the selected liturgies have actually been deleted so
  // far, since a combined delete runs one Server Action call per liturgy,
  // not one atomic call across the pair -- if the second call fails after
  // the first succeeded, the UI must reflect that real, permanent partial
  // state rather than looking like nothing happened.
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // The trigger decides which option is locked on, never the visual order:
  // the pair always reads Morning then Vesper in the options and action copy.
  const orderedOptions = sibling
    ? primary.templateName === "Morning Worship"
      ? [primary, sibling]
      : [sibling, primary]
    : [primary];
  const selected = orderedOptions.filter((liturgy) => liturgy.id === primary.id || siblingSelected);
  const label = (liturgy: LiturgySummary): string => liturgy.templateName.replace(" Worship", "");
  const pending = selected.filter((liturgy) => !deletedIds.has(liturgy.id));

  const buttonLabel =
    pending.length === 0
      ? "Done"
      : pending.length === 2
        ? `Delete ${label(pending[0])} and ${label(pending[1])} Liturgies`
        : `Delete ${label(pending[0])} Liturgy`;

  const requiresTypedConfirmation = currentUserRole === "compiler";
  const canConfirm = !isDeleting && pending.length > 0 && (!requiresTypedConfirmation || typedName === currentUserName);

  const handleConfirm = async (): Promise<void> => {
    setIsDeleting(true);
    setError(null);

    for (const liturgy of pending) {
      const result = await deleteLiturgy(liturgy.id, requiresTypedConfirmation ? typedName : undefined);
      if (!result.success) {
        setIsDeleting(false);
        // Name which liturgy actually failed -- a prior liturgy in this
        // same combined delete may have already succeeded (and already
        // triggered onDeleted() below, refreshing the underlying list), so
        // a generic "unable to delete" message here would misleadingly
        // suggest nothing happened at all.
        setError(`Unable to delete ${liturgy.templateName} right now: ${result.error ?? "please try again."}`);
        return;
      }
      setDeletedIds((prev) => new Set(prev).add(liturgy.id));
      onDeleted();
    }

    setIsDeleting(false);
    onClose();
  };

  const renderOption = (liturgy: LiturgySummary, isSelected: boolean, onToggle?: () => void): React.ReactElement => {
    const isDeleted = deletedIds.has(liturgy.id);
    return (
      <button
        key={liturgy.id}
        type="button"
        disabled={!onToggle || isDeleted}
        onClick={onToggle}
        className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium text-center transition-[border-color,color,background-color,transform] duration-[var(--duration-press)] ease ${
          isDeleted
            ? "border-border text-text-muted bg-surface-secondary line-through"
            : isSelected
              ? "border-error text-error bg-error-light"
              : "border-border text-text-muted bg-surface-secondary"
        } ${onToggle && !isDeleted ? "motion-safe:active:scale-[0.97]" : "cursor-default"}`}
      >
        {liturgy.templateName}
        {isDeleted && " — Deleted"}
      </button>
    );
  };

  return (
    <Modal title="Confirm to delete the selected liturgy" onClose={onClose} size="compact">
      <p className="text-sm text-text-secondary">
        Are you sure you want to delete the selected liturgy? This action cannot be undone.
      </p>

      <p className="text-sm font-medium text-text-primary">
        {liturgyOccasionLabel(primary.serviceDate, primary.lordsDayNumber)}
      </p>

      <div className="flex gap-2">
        {orderedOptions.map((liturgy) => {
          const isPrimary = liturgy.id === primary.id;
          return renderOption(
            liturgy,
            isPrimary || siblingSelected,
            isPrimary ? undefined : () => setSiblingSelected((prev) => !prev)
          );
        })}
      </div>

      {requiresTypedConfirmation && pending.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-text-secondary">
            Please type <span className="font-semibold text-text-primary">{currentUserName}</span> to confirm.
          </label>
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary"
          />
        </div>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!canConfirm}
          onClick={handleConfirm}
          className="w-full bg-error text-error-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
        >
          {buttonLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
        >
          {deletedIds.size > 0 ? "Close" : "Cancel"}
        </button>
      </div>
    </Modal>
  );
}
