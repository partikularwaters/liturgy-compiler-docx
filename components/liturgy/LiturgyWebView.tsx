import { resolveItemText } from "@/lib/liturgy/resolveItemText";
import { sectionTitle } from "@/lib/liturgy/sectionTitle";
import { parseBoldSegments } from "@/lib/text/markdown";
import { isSunday, parseLocalDate } from "@/lib/liturgy/lordsDay";
import type { CompiledLiturgy, Formula, Prayer } from "@/types/liturgy";

interface LiturgyWebViewProps {
  liturgy: CompiledLiturgy;
  formulas: Formula[];
  prayers: Prayer[];
}

// Public, read-only, congregation-facing render of a compiled liturgy --
// shareable by URL, mobile-first single column. Deliberately template-
// agnostic (works for Morning or Vesper alike) even though only Vesper
// links to it today (Feature 18) -- Morning is meant to reuse this same
// component unchanged once that's tried and approved, per
// redesign-plan-v1.1.md's "Morning could gain the same view later" note.
export default function LiturgyWebView({
  liturgy,
  formulas,
  prayers,
}: LiturgyWebViewProps): React.ReactElement {
  const dateIsSunday = isSunday(parseLocalDate(liturgy.serviceDate));

  return (
    <div className="max-w-[640px] mx-auto px-6 py-10 flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif-display text-[22px] font-semibold leading-[30px] text-text-primary">
          {liturgy.templateName}
        </h1>
        <p className="text-[13px] text-text-secondary">
          {liturgy.serviceDate}
          {dateIsSunday && ` — Lord’s Day ${liturgy.lordsDayNumber}`}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {liturgy.sections.map((section, index) => {
          const visibleItems = section.items
            .map((item) => resolveItemText(item, formulas, prayers))
            .filter((resolved) => !resolved.leaderOnly);

          return (
            <div key={index} className="flex flex-col gap-3">
              <h2 className="font-serif-display text-[19px] font-semibold leading-[26px] text-text-primary">
                {sectionTitle(section)}
              </h2>
              {visibleItems.length === 0 ? (
                <p className="text-sm text-text-muted">No items yet</p>
              ) : (
                visibleItems.map((resolved, itemIndex) => (
                  <div key={itemIndex} className="flex flex-col gap-1">
                    {resolved.label && (
                      <p className="text-[13px] text-text-secondary">{resolved.label}</p>
                    )}
                    <p className="font-serif-body text-[17px] leading-[1.75] text-text-primary">
                      {parseBoldSegments(resolved.text).map((segment, segIndex) =>
                        segment.bold ? (
                          <strong key={segIndex}>{segment.text}</strong>
                        ) : (
                          <span key={segIndex}>{segment.text}</span>
                        )
                      )}
                    </p>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
