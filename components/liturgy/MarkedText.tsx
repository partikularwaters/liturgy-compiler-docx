import type { TextMark } from "@/types/liturgy";
import { applyMarks } from "@/lib/text/marks";

interface MarkedTextProps {
  text: string;
  marks: TextMark[] | undefined;
  className?: string;
  // Defaults true (the Compile View/PDF/Web View's normal body-text
  // treatment). LibraryTextPreview passes false when its own Tailwind
  // `line-clamp-*` truncation is active -- `-webkit-line-clamp` forces the
  // paragraph into a legacy `-webkit-box` display for the truncation
  // itself, and text-align: justify's line-stretching breaks inside that
  // box model (lines render narrow/ragged instead of stretching to fill the
  // container). The two were never meant to combine; turning justify off
  // specifically for the clamped state is the fix, not a stylistic choice.
  justify?: boolean;
}

// Feature 25: Leader/Congregation/Minister/Small-Caps rendering
// (redesign-plan-v1.1.md §U) -- Leader is the implicit default (flush left,
// no label); Congregation is indented and labeled "Congr:"; Minister stays
// flush left but labeled "Min:". Bold and Small Caps (both real,
// independent overlay marks -- Small Caps used to wrongly compete with
// Congregation/Minister for the same range, which split a marked block in
// two whenever a word inside it was also small-capped) are both resolved
// per-run by applyMarks(), so this component just maps each run's flags
// straight to <strong>/font-variant.
export default function MarkedText({ text, marks, className, justify = true }: MarkedTextProps): React.ReactElement {
  const segments = applyMarks(text, marks);

  return (
    <p
      className={`font-serif-body text-[16px] leading-[1.6] text-text-primary whitespace-pre-wrap ${justify ? "text-justify" : "text-left"} ${className ?? ""}`}
    >
      {segments.map((segment, i) => {
        const rendered = segment.runs.map((run, j) => {
          const node = run.smallCaps ? (
            <span className="[font-variant:small-caps]">{run.text}</span>
          ) : (
            run.text
          );
          return run.bold ? <strong key={j}>{node}</strong> : <span key={j}>{node}</span>;
        });

        if (segment.mark === "congregation") {
          return (
            <span key={i} className="block pl-6 mb-2 font-bold">
              <span className="text-[12px] font-medium text-accent-dark mr-1 [font-variant:small-caps]">
                Congr:
              </span>
              {rendered}
            </span>
          );
        }
        if (segment.mark === "minister") {
          return (
            <span key={i} className="block mb-2">
              <span className="text-[12px] font-medium text-accent-dark mr-1 [font-variant:small-caps]">
                Min:
              </span>
              {rendered}
            </span>
          );
        }
        return <span key={i}>{rendered}</span>;
      })}
    </p>
  );
}
