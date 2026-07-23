import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { pdfColors } from "@/lib/pdf/tokens";
import { sectionTitle } from "@/lib/liturgy/sectionTitle";
import { applyMarks, type MarkedSegment } from "@/lib/text/marks";
import { groupSectionsByPageColumn } from "@/lib/liturgy/groupSectionsByPageColumn";
import { prepareSectionRender } from "@/lib/liturgy/prepareSectionRender";
import { isSunday, parseLocalDate } from "@/lib/liturgy/lordsDay";
import type { CompiledLiturgy, CompiledSection, Formula, Prayer, Song, TextMark } from "@/types/liturgy";

// Congregation/Minister render as their own block (a forced line break
// before and after); Leader (unmarked) and Small Caps don't. Grouping
// consecutive non-block segments into one shared <Text> (react-pdf nests
// <Text> inline, the same way a segment's own bold runs already do) is
// what keeps them flowing on the same line -- wrapping every segment in its
// own <View>, the previous approach, forced a line break around every mark
// including Small Caps, which read as "marking a word turns it into its own
// paragraph."
function groupMarkSegments(segments: MarkedSegment[]): { block: boolean; segments: MarkedSegment[] }[] {
  const groups: { block: boolean; segments: MarkedSegment[] }[] = [];
  for (const seg of segments) {
    const isBlock = seg.mark === "congregation" || seg.mark === "minister";
    const last = groups[groups.length - 1];
    if (last && !isBlock && !last.block) {
      last.segments.push(seg);
    } else {
      groups.push({ block: isBlock, segments: [seg] });
    }
  }
  return groups;
}

registerPdfFonts();

// Feature 27: mirrors SectionCard.tsx's PRAYER_GUIDE_SECTIONS -- the six
// Sections with a 'guide'-kind Prayer library reference (redesign-plan-v1.1.md
// §W). Real gap this closes: Prayer Guides existed in the Compile View but
// never made it into the actual exported Leader Guide PDF.
const PRAYER_GUIDE_SECTIONS = [
  "Prayer of Invocation",
  "Prayer for Illumination",
  "Prayer for Pardon",
  "Prayer before Communion",
  "Closing of the Table",
  "Pastoral Prayer",
];

// 13in x 8in landscape (long/legal-adjacent width, short height), per
// Madrid's request -- gives the 3-column layout a wider page to sit in
// instead of A4 portrait's narrower columns. react-pdf takes a custom page
// size as [width, height] in points (1in = 72pt); width > height already
// makes this landscape, no separate orientation prop needed.
const LONG_LANDSCAPE_SIZE: [number, number] = [13 * 72, 8 * 72];

const styles = StyleSheet.create({
  page: {
    backgroundColor: pdfColors.surface,
    // Tight margins to maximize page use, per Madrid's spec: 0.3in
    // top/bottom (21.6pt), 0.25in left/right (18pt).
    paddingTop: 21.6,
    paddingBottom: 21.6,
    paddingLeft: 18,
    paddingRight: 18,
    fontFamily: "Ibarra Real Nova",
  },
  title: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: pdfColors.textPrimary,
    marginBottom: 24,
  },
  columnsRow: {
    flexDirection: "row",
  },
  column: {
    flex: 1,
    marginRight: 16,
  },
  columnLastChild: {
    marginRight: 0,
  },
  columnTitle: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: pdfColors.textPrimary,
    marginBottom: 2,
  },
  columnDate: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 10,
    color: pdfColors.textSecondary,
    marginBottom: 12,
    textAlign: "right",
  },
  section: {
    marginBottom: 12,
  },
  // Feature 28 Part A: box/border stripped per Madrid's "plain as the
  // printed bulletin" direction -- no more bottom rule under the heading.
  sectionHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 4,
  },
  sectionHeading: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: pdfColors.textPrimary,
  },
  sectionHeadingCompact: {
    fontSize: 9,
  },
  // Selection citations (or, absent any Selection, a Creed/Church-Covenant
  // Formula's name) shown inline with the Section title -- mirrors
  // SectionCard.tsx's header-reference mechanic so the PDF stops drifting
  // from the Compile View.
  sectionHeaderReference: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 10,
    color: pdfColors.textPrimary,
  },
  // react-pdf has no small-caps glyph support -- uppercase is the closest
  // substitute, same as the Congr:/Min: labels and the marked-text Small
  // Caps runs above.
  // Small-caps substitute (react-pdf has no small-caps glyph support) --
  // deliberately just the uppercase transform, not color, since a Psalm
  // title uses citationColor without this (it's naturally-cased prose, not
  // a reference).
  sectionHeaderReferenceCitation: {
    textTransform: "uppercase",
  },
  item: {
    marginBottom: 8,
  },
  leaderOnlyBadge: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 8,
    color: pdfColors.accentDark,
    backgroundColor: pdfColors.accentLight,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 4,
  },
  itemLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  // Feature 27: Amen Rule -- Leader Guide only, never the Bulletin.
  amenBadge: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 8,
    fontWeight: "bold",
    color: pdfColors.accentDark,
    backgroundColor: pdfColors.accentLight,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 4,
  },
  body: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 12,
    lineHeight: 1.5,
    color: pdfColors.textPrimary,
    textAlign: "justify",
  },
  bodyCompact: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  // Feature 26: Rubric-style Verbal Cue (e.g. Confession of Sin's closing
  // instruction). Ideally italic, but react-pdf can only resolve a style it
  // has a matching registered font file for (registerPdfFonts() only
  // registers normal/bold Ibarra Real Nova, no italic face) -- attempting
  // fontStyle: "italic" throws at render time instead of degrading
  // gracefully. Left as a muted color instead, the closest available
  // distinguishing treatment; a real italic face would need sourcing.
  bodyRubric: {
    color: pdfColors.textSecondary,
  },
  // Feature 25: Leader/Congregation/Minister marking -- Congregation is
  // indented and labeled, Minister stays flush left but labeled, Leader
  // (unmarked) gets neither. Small Caps has no dedicated PDF style since
  // react-pdf has no small-caps glyph support (same font-registration gap
  // as Feature 26's rubric italic) -- left as plain text in the PDF, a
  // known gap versus the CSS side's `[font-variant:small-caps]`.
  markLine: {
    marginBottom: 6,
  },
  markCongregation: {
    paddingLeft: 18,
  },
  // Congregation renders in bold throughout (label + text), per Madrid's
  // spec -- Minister keeps normal weight, just the label.
  markCongregationText: {
    fontWeight: "bold",
  },
  // react-pdf has no small-caps glyph support (same font-registration gap as
  // Feature 26's rubric italic) -- uppercase text is the closest available
  // substitute for the label specifically.
  markLabel: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 9,
    fontWeight: "bold",
    color: pdfColors.accentDark,
    textTransform: "uppercase",
  },
  // Small Caps: react-pdf has no small-caps glyph support -- uppercase is
  // the closest available substitute, same approach as the Congr:/Min:
  // labels above. Rendered inline (not its own block), unlike Congregation/
  // Minister -- this was the actual bug being fixed here, not just styling.
  smallCapsSubstitute: {
    textTransform: "uppercase",
  },
  // Feature 21: Song title -- italic always, Psalm additionally gets the
  // citation-red treatment since it's still Scripture-adjacent (§L), Hymn
  // doesn't. react-pdf's registered fonts have no italic face (same gap as
  // Feature 26's rubric) so this is upright, distinguished by color/size
  // only -- a known, documented degradation from the CSS side's real italic.
  songTitle: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 12,
    fontStyle: "italic",
  },
  songTitlePsalm: {
    color: pdfColors.citation,
  },
  songMeta: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 9,
    color: pdfColors.textSecondary,
    marginTop: 2,
  },
  pageFooter: {
    position: "absolute",
    bottom: 10,
    right: 18,
    fontFamily: "Ibarra Real Nova",
    fontSize: 8,
    color: pdfColors.textMuted,
  },
  prayerGuide: {
    backgroundColor: pdfColors.surfaceSecondary,
    borderRadius: 4,
    padding: 6,
    marginBottom: 6,
  },
  prayerGuideLabel: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 8,
    fontWeight: "bold",
    color: pdfColors.textSecondary,
    marginBottom: 2,
  },
  prayerGuideText: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 9,
    color: pdfColors.textPrimary,
    marginBottom: 2,
  },
});

interface LiturgyDocumentProps {
  liturgy: CompiledLiturgy;
  formulas: Formula[];
  prayers: Prayer[];
  songs: Song[];
  audience: "guide" | "bulletin";
}

interface RenderSectionOptions {
  section: CompiledSection;
  index: number;
  formulas: Formula[];
  prayers: Prayer[];
  songs: Song[];
  audience: "guide" | "bulletin";
  compact?: boolean;
}

function RenderedSection({
  section,
  index,
  formulas,
  prayers,
  songs,
  audience,
  compact = false,
}: RenderSectionOptions): React.ReactElement {
  const prepared = prepareSectionRender(section, formulas, prayers, songs);
  const visibleItems = prepared.items.filter(({ resolved }) => audience === "guide" || !resolved.leaderOnly);
  const isEmpty = visibleItems.length === 0 && !prepared.mergedSelection;
  const guides = prayers.filter((p) => p.sectionName === section.name && p.isGuide);

  // Renders a passage's marked text -- Congregation/Minister each get their
  // own block (a forced line break); Leader and Small Caps flow together in
  // one shared <Text> so marking a word no longer forces a line break
  // around it.
  const renderMarkedBody = (text: string, marks: TextMark[] | undefined) =>
    groupMarkSegments(applyMarks(text, marks)).map((group, groupIndex) => {
      if (group.block) {
        const seg = group.segments[0];
        return (
          <View
            key={groupIndex}
            style={[styles.markLine, seg.mark === "congregation" ? styles.markCongregation : {}]}
          >
            <Text style={styles.markLabel}>{seg.mark === "congregation" ? "Congr:" : "Min:"}</Text>
            <Text
              style={[
                styles.body,
                compact ? styles.bodyCompact : {},
                seg.mark === "congregation" ? styles.markCongregationText : {},
              ]}
            >
              {seg.runs.map((run, runIndex) => (
                <Text
                  key={runIndex}
                  style={[run.bold ? { fontWeight: "bold" } : {}, run.smallCaps ? styles.smallCapsSubstitute : {}]}
                >
                  {run.text}
                </Text>
              ))}
            </Text>
          </View>
        );
      }
      return (
        <Text key={groupIndex} style={[styles.body, compact ? styles.bodyCompact : {}, styles.markLine]}>
          {group.segments.map((seg, segIndex) =>
            seg.runs.map((run, runIndex) => (
              <Text
                key={`${segIndex}-${runIndex}`}
                style={[
                  run.bold ? { fontWeight: "bold" } : {},
                  run.smallCaps ? styles.smallCapsSubstitute : {},
                ]}
              >
                {run.text}
              </Text>
            ))
          )}
        </Text>
      );
    });

  return (
    <View key={index} style={styles.section} wrap={false}>
      <View style={styles.sectionHeadingRow}>
        <Text style={[styles.sectionHeading, compact ? styles.sectionHeadingCompact : {}]}>
          {sectionTitle(section, songs)}
        </Text>
        {prepared.header && (
          <Text
            style={[
              styles.sectionHeaderReference,
              prepared.header.citationColor ? { color: pdfColors.citation } : {},
              prepared.header.smallCaps ? styles.sectionHeaderReferenceCitation : {},
              prepared.header.italic ? { fontStyle: "italic" } : {},
            ]}
          >
            {prepared.header.text}
          </Text>
        )}
      </View>
      {audience === "guide" && PRAYER_GUIDE_SECTIONS.includes(section.name) && guides.length > 0 && (
        <View style={styles.prayerGuide}>
          <Text style={styles.prayerGuideLabel}>Prayer Guide</Text>
          {guides.map((guide) => (
            <Text key={guide.id} style={styles.prayerGuideText}>
              {guide.text}
            </Text>
          ))}
        </View>
      )}
      {!isEmpty && (
        <>
          {prepared.mergedSelection && (
            <View style={styles.item}>
              {renderMarkedBody(prepared.mergedSelection.text, prepared.mergedSelection.marks)}
            </View>
          )}
          {visibleItems.map(({ item, resolved }, itemIndex) =>
            item.type === "song" ? (
              <View key={itemIndex} style={styles.item}>
                <Text
                  style={[styles.songTitle, resolved.song?.kind === "psalm" ? styles.songTitlePsalm : {}]}
                >
                  {resolved.text}
                </Text>
                {audience === "guide" && resolved.song && (
                  <Text style={styles.songMeta}>
                    {[resolved.song.attribution, resolved.song.yearPublished, resolved.song.notes]
                      .filter(Boolean)
                      .join(" — ")}
                  </Text>
                )}
              </View>
            ) : (
              <View key={itemIndex} style={styles.item}>
                {(resolved.leaderOnly ||
                  (audience === "guide" && item.type === "selection" && item.amenExpected)) && (
                  <View style={styles.itemLabelRow}>
                    {resolved.leaderOnly && <Text style={styles.leaderOnlyBadge}>Leader only</Text>}
                    {audience === "guide" && item.type === "selection" && item.amenExpected && (
                      <Text style={styles.amenBadge}>Amen</Text>
                    )}
                  </View>
                )}
                {resolved.text &&
                  ((item.type === "selection" || item.type === "formula") &&
                  resolved.marks &&
                  resolved.marks.length > 0
                    ? renderMarkedBody(resolved.text, resolved.marks)
                    : (
                        <Text
                          style={[
                            styles.body,
                            compact ? styles.bodyCompact : {},
                            resolved.rubric ? styles.bodyRubric : {},
                          ]}
                        >
                          {applyMarks(resolved.text, resolved.marks).flatMap((seg, segIndex) =>
                            seg.runs.map((run, runIndex) => (
                              <Text
                                key={`${segIndex}-${runIndex}`}
                                style={run.bold ? { fontWeight: "bold" } : undefined}
                              >
                                {run.text}
                              </Text>
                            ))
                          )}
                        </Text>
                      ))}
              </View>
            )
          )}
        </>
      )}
    </View>
  );
}

export function LiturgyDocument({
  liturgy,
  formulas,
  prayers,
  songs,
  audience,
}: LiturgyDocumentProps): React.ReactElement {
  const dateIsSunday = isSunday(parseLocalDate(liturgy.serviceDate));
  const grouped = groupSectionsByPageColumn(liturgy.sections);
  const formattedDate = parseLocalDate(liturgy.serviceDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (!grouped) {
    // No page/column data (Vesper, Feature 18 pending) -- single continuous column.
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>{liturgy.templateName} Service</Text>
          <Text style={styles.columnDate}>
            {formattedDate}
            {dateIsSunday && `   Lord's Day #${liturgy.lordsDayNumber}`}
          </Text>
          {liturgy.sections.map((section, index) => (
            <RenderedSection
              key={index}
              section={section}
              index={index}
              formulas={formulas}
              prayers={prayers}
              songs={songs}
              audience={audience}
            />
          ))}
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      {grouped.map((pageGroup) => (
        <Page key={pageGroup.page} size={LONG_LANDSCAPE_SIZE} style={styles.page}>
          <Text style={styles.pageFooter} fixed>
            Page {pageGroup.page}
          </Text>
          <View style={styles.columnsRow}>
            {pageGroup.columns.map((columnGroup, columnPosition) => (
              <View
                key={columnGroup.column}
                style={[
                  styles.column,
                  columnPosition === pageGroup.columns.length - 1 ? styles.columnLastChild : {},
                ]}
              >
                {pageGroup.page === 1 && columnGroup.column === 1 && (
                  <View>
                    <Text style={styles.columnTitle}>{liturgy.templateName} Service</Text>
                    <Text style={styles.columnDate}>
                      {formattedDate}
                      {dateIsSunday && `   Lord's Day #${liturgy.lordsDayNumber}`}
                    </Text>
                  </View>
                )}
                {columnGroup.sections.map(({ section, index }) => (
                  <RenderedSection
                    key={index}
                    section={section}
                    index={index}
                    formulas={formulas}
                    prayers={prayers}
                    songs={songs}
                    audience={audience}
                    compact
                  />
                ))}
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  );
}
