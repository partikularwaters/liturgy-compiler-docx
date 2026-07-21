"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { parseBoldSegments } from "@/lib/text/markdown";

interface LibraryTextPreviewProps {
  title: string;
  text: string;
  className?: string;
}

function RenderedText({ text, className }: { text: string; className?: string }): React.ReactElement {
  return (
    <p className={`whitespace-pre-wrap ${className ?? ""}`}>
      {parseBoldSegments(text).map((segment, i) =>
        segment.bold ? <strong key={i}>{segment.text}</strong> : <span key={i}>{segment.text}</span>
      )}
    </p>
  );
}

// Direct feedback (2026-07-22): every Library list row (Formula/Prayer/
// Scripture/Guide) previewed its full text unclamped, with line breaks
// collapsed by default <p> whitespace handling and **bold** markdown shown
// literally instead of rendered -- a long entry (the Apostles' Creed) could
// dominate the whole list. Clamped to 3 lines with a "See more" modal that
// renders line breaks and bold correctly; the clamp itself is a rough
// heuristic (character/newline count, not a DOM measurement) since it only
// needs to catch entries that are obviously longer than 3 lines, not be
// pixel-exact.
export default function LibraryTextPreview({ title, text, className }: LibraryTextPreviewProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const newlineCount = (text.match(/\n/g) ?? []).length;
  const isLikelyOverflowing = text.length > 220 || newlineCount >= 3;

  return (
    <>
      <RenderedText text={text} className={`${className ?? ""} ${isLikelyOverflowing ? "line-clamp-3" : ""}`} />
      {isLikelyOverflowing && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-[12px] font-medium text-accent-dark mt-0.5"
        >
          See more
        </button>
      )}
      {isOpen && (
        <Modal title={title} onClose={() => setIsOpen(false)}>
          <RenderedText text={text} className="text-sm text-text-primary leading-relaxed" />
        </Modal>
      )}
    </>
  );
}
