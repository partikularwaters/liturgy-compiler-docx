import { sectionTitle } from "@/lib/liturgy/sectionTitle";
import { applyMarks } from "@/lib/text/marks";
import { prepareSectionRender } from "@/lib/liturgy/prepareSectionRender";
import { isSunday, parseLocalDate } from "@/lib/liturgy/lordsDay";
import ScriptureCitationLink from "@/components/liturgy/ScriptureCitationLink";
import type { CompiledLiturgy, Formula, Prayer, Song, TextMark } from "@/types/liturgy";

interface LiturgyWebViewProps {
  liturgy: CompiledLiturgy;
  formulas: Formula[];
  prayers: Prayer[];
  songs: Song[];
}

// Same typography as SectionCard.tsx's BodyText/MarkedText -- this used to
// run its own, older 17px/non-justified styling that predated Feature 28's
// Compile View redesign and never got updated to match.
function MarkedBody({ text, marks }: { text: string; marks: TextMark[] | undefined }): React.ReactElement {
  return (
    <p className="font-serif-body text-[16px] leading-[1.6] text-text-primary whitespace-pre-wrap text-justify">
      {applyMarks(text, marks).map((seg, segIndex) => {
        const rendered = seg.runs.map((run, runIndex) => {
          const node = run.smallCaps ? (
            <span className="[font-variant:small-caps]">{run.text}</span>
          ) : (
            run.text
          );
          return run.bold ? <strong key={runIndex}>{node}</strong> : <span key={runIndex}>{node}</span>;
        });
        if (seg.mark === "congregation") {
          return (
            <span key={segIndex} className="block pl-6 mb-2 font-bold">
              <span className="text-[13px] font-medium text-accent-dark mr-1 [font-variant:small-caps]">
                Congr:
              </span>
              {rendered}
            </span>
          );
        }
        if (seg.mark === "minister") {
          return (
            <span key={segIndex} className="block mb-2">
              <span className="text-[13px] font-medium text-accent-dark mr-1 [font-variant:small-caps]">
                Min:
              </span>
              {rendered}
            </span>
          );
        }
        return <span key={segIndex}>{rendered}</span>;
      })}
    </p>
  );
}

// Public, read-only, congregation-facing render of a compiled liturgy --
// shareable by URL, mobile-first single column, no nav bar (hidden at the
// layout level in TopNavLinks.tsx -- this page is meant to be the liturgy
// alone). Deliberately template-agnostic (works for Morning or Vesper
// alike) even though only Vesper links to it today (Feature 18) -- Morning
// is meant to reuse this same component unchanged once that's tried and
// approved, per redesign-plan-v1.1.md's "Morning could gain the same view
// later" note.
export default function LiturgyWebView({
  liturgy,
  formulas,
  prayers,
  songs,
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

      <div className="flex flex-col gap-6">
        {liturgy.sections.map((section, index) => {
          const prepared = prepareSectionRender(section, formulas, prayers, songs);
          const visibleItems = prepared.items.filter(({ resolved }) => !resolved.leaderOnly);
          const isEmpty = visibleItems.length === 0 && !prepared.mergedSelection;

          return (
            <div key={index} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <h2 className="font-serif-body text-[16px] font-bold uppercase text-text-primary">
                  {sectionTitle(section, songs)}
                </h2>
                {prepared.header && (
                  <p
                    className={[
                      "font-serif-body text-[13px] shrink-0",
                      prepared.header.citationColor ? "text-citation" : "text-text-primary",
                      prepared.header.smallCaps ? "[font-variant:small-caps]" : "",
                      prepared.header.italic ? "italic" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {prepared.header.citations
                      ? prepared.header.citations.map((citation, citationIndex) => (
                          <span key={citation}>
                            {citationIndex > 0 && "; "}
                            <ScriptureCitationLink citation={citation} />
                          </span>
                        ))
                      : prepared.header.text}
                  </p>
                )}
              </div>
              {!isEmpty && (
                <>
                  {prepared.mergedSelection && (
                    <MarkedBody text={prepared.mergedSelection.text} marks={prepared.mergedSelection.marks} />
                  )}
                  {visibleItems.map(({ item, resolved }, itemIndex) =>
                    item.type === "song" ? (
                      <p
                        key={itemIndex}
                        className={
                          resolved.song?.kind === "psalm"
                            ? "font-serif-body text-[16px] italic text-citation"
                            : "font-serif-body text-[16px] italic text-text-primary"
                        }
                      >
                        {resolved.text}
                      </p>
                    ) : (
                      resolved.text &&
                      ((item.type === "selection" || item.type === "formula" || item.type === "prayer") &&
                      resolved.marks &&
                      resolved.marks.length > 0 ? (
                        <MarkedBody key={itemIndex} text={resolved.text} marks={resolved.marks} />
                      ) : (
                        <p
                          key={itemIndex}
                          className={
                            resolved.rubric
                              ? "font-serif-body text-[16px] leading-[1.6] text-text-primary italic whitespace-pre-wrap text-justify"
                              : "font-serif-body text-[16px] leading-[1.6] text-text-primary whitespace-pre-wrap text-justify"
                          }
                        >
                          {applyMarks(resolved.text, resolved.marks).flatMap((seg, segIndex) =>
                            seg.runs.map((run, runIndex) =>
                              run.bold ? (
                                <strong key={`${segIndex}-${runIndex}`}>{run.text}</strong>
                              ) : (
                                <span key={`${segIndex}-${runIndex}`}>{run.text}</span>
                              )
                            )
                          )}
                        </p>
                      ))
                    )
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
