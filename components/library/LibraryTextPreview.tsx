"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import MarkedText from "@/components/liturgy/MarkedText";
import type { TextMark } from "@/types/liturgy";

interface LibraryTextPreviewProps {
  title: string;
  text: string;
  marks?: TextMark[];
  className?: string;
}

// Every Library list row (Formula/Prayer/
// Scripture/Guide) previewed its full text unclamped, with line breaks
// collapsed by default <p> whitespace handling and **bold** markdown shown
// literally instead of rendered -- a long entry (the Apostles' Creed) could
// dominate the whole list. Clamped to 3 lines with a "See more" modal that
// renders line breaks and bold correctly; the clamp itself is a rough
// heuristic (character/newline count, not a DOM measurement) since it only
// needs to catch entries that are obviously longer than 3 lines, not be
// pixel-exact.
//
// This used to render its own
// bold-only, sans-font text instead of the shared MarkedText component --
// Minister/Congregation marks were invisible here even though the library
// row itself has them (v2's library-level marking toolbar), and the font
// didn't match the app's liturgical serif body text used everywhere else.
// Switched to MarkedText (the same renderer SectionCard/LiturgyWebView use)
// so marks, bold, and typography can never drift between the library
// preview and everywhere else a placed item's text is shown.
export default function LibraryTextPreview({
  title,
  text,
  marks,
  className,
}: LibraryTextPreviewProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const newlineCount = (text.match(/\n/g) ?? []).length;
  const isLikelyOverflowing = text.length > 220 || newlineCount >= 3;

  return (
    <>
      <MarkedText
        text={text}
        marks={marks}
        className={`${className ?? ""} ${isLikelyOverflowing ? "line-clamp-3" : ""}`}
      />
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
          <MarkedText text={text} marks={marks} />
        </Modal>
      )}
    </>
  );
}
