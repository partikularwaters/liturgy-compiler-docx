import type { TextMark } from "@/types/liturgy";
import { applyMarks } from "@/lib/text/marks";
import { parseBoldSegments } from "@/lib/text/markdown";

interface MarkedTextProps {
  text: string;
  marks: TextMark[] | undefined;
}

// Feature 25: Leader/Congregation/Minister/Small-Caps rendering
// (redesign-plan-v1.1.md §U) -- Leader is the implicit default (flush left,
// no label, whatever markdown bold-parsing already applied); Congregation is
// indented and labeled "Congr:"; Minister stays flush left but labeled
// "Min:"; Small Caps applies `font-variant: small-caps` inline with no
// label. Each marked stretch still runs through parseBoldSegments so
// existing **bold** congregational-response markup keeps working inside a
// tagged span.
export default function MarkedText({ text, marks }: MarkedTextProps): React.ReactElement {
  const segments = applyMarks(text, marks);

  return (
    <p className="font-serif-body text-[16px] leading-[1.6] text-text-primary whitespace-pre-wrap text-justify">
      {segments.map((segment, i) => {
        const rendered = parseBoldSegments(segment.text).map((run, j) =>
          run.bold ? <strong key={j}>{run.text}</strong> : <span key={j}>{run.text}</span>
        );

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
        if (segment.mark === "small_caps") {
          return (
            <span key={i} className="[font-variant:small-caps]">
              {rendered}
            </span>
          );
        }
        return <span key={i}>{rendered}</span>;
      })}
    </p>
  );
}
