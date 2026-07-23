import type { BibleChapter, VerseHighlights } from "@/types/bible";

export type VerseMarkerState = "addable" | "pending" | "saved";

export interface VerseMarker {
  state: VerseMarkerState;
  label: string;
}

interface VerseDisplayProps {
  chapter: BibleChapter;
  highlights: VerseHighlights;
  onVerseClick: (verseNumber: number) => void;
  verseMarkers?: Record<number, VerseMarker>;
  onVerseMarkerClick?: (verseNumber: number) => void;
}

const highlightBgClass: Record<string, string> = {
  accent: "bg-accent-light",
  success: "bg-success-light",
  info: "bg-info-light",
  warning: "bg-warning-light",
};

// v1.1 marker redesign (redesign-plan-v1.1.md §H): addable is now a red
// glyph in a yellow box (was neutral gray); saved is no longer an
// interactive control at all -- see the `sup` branch below. Pending is
// explicitly unaddressed by the redesign, carried forward as-is.
const markerClass: Record<"addable" | "pending", string> = {
  addable: "bg-cta-yellow text-error",
  pending: "bg-error-light text-error",
};

const markerGlyph: Record<"addable" | "pending", string> = {
  addable: "+",
  pending: "−",
};

export default function VerseDisplay({
  chapter,
  highlights,
  onVerseClick,
  verseMarkers,
  onVerseMarkerClick,
}: VerseDisplayProps): React.ReactElement {
  return (
    <div className="bg-surface border border-border rounded-lg p-6 md:p-12 shadow-[0px_1px_3px_rgba(34,32,28,0.08)]">
      <h2 className="font-serif-display text-[22px] font-semibold leading-[30px] text-text-primary mb-4">
        {chapter.book} {chapter.chapter}
      </h2>
      <div className="font-serif-body text-[19.5px] leading-[1.75] text-text-primary">
        {chapter.verses.map((verse) => {
          const marker = verseMarkers?.[verse.number];
          return (
            <span
              key={verse.number}
              onClick={() => onVerseClick(verse.number)}
              className={`cursor-pointer rounded-sm ${
                highlights[verse.number] ? highlightBgClass[highlights[verse.number]] : ""
              }`}
            >
              <sup className="text-text-muted text-xs mr-1">{verse.number}</sup>
              {marker && marker.state === "saved" && (
                // Passive typographic mark, not a control -- per the v1.1
                // marker redesign, "saved" is no longer a disabled button.
                <sup className="text-success text-[19px] mr-1" title={`Already added to ${marker.label}`}>
                  ●
                </sup>
              )}
              {marker && marker.state !== "saved" && (
                <button
                  type="button"
                  title={
                    marker.state === "pending"
                      ? `Marked for ${marker.label} — click to remove`
                      : `Add to ${marker.label}`
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onVerseMarkerClick?.(verse.number);
                  }}
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-sm text-[14px] font-bold leading-none mr-1 align-middle ${markerClass[marker.state]}`}
                >
                  {markerGlyph[marker.state]}
                </button>
              )}
              {verse.text}{" "}
            </span>
          );
        })}
      </div>
    </div>
  );
}
