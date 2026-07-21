"use client";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

// First shared modal in the project (2026-07-22) -- built for Library
// "See more" previews, generic enough for any simple content overlay.
export default function Modal({ title, onClose, children }: ModalProps): React.ReactElement {
  return (
    <div
      className="fixed inset-0 bg-text-primary/40 flex items-center justify-center p-6 z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-lg shadow-lg max-w-[560px] w-full max-h-[80vh] overflow-y-auto p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-[16px] font-semibold text-text-primary">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-xl leading-none"
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
