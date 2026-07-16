import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { pdfColors } from "@/lib/pdf/tokens";
import { resolveItemText } from "@/lib/liturgy/resolveItemText";
import { sectionTitle } from "@/lib/liturgy/sectionTitle";
import { parseBoldSegments } from "@/lib/text/markdown";
import { groupSectionsByPageColumn } from "@/lib/liturgy/groupSectionsByPageColumn";
import { isSunday, parseLocalDate } from "@/lib/liturgy/lordsDay";
import type { CompiledLiturgy, CompiledSection, Formula, Prayer } from "@/types/liturgy";

registerPdfFonts();

const styles = StyleSheet.create({
  page: {
    backgroundColor: pdfColors.surface,
    padding: 48,
    fontFamily: "Ibarra Real Nova",
  },
  title: {
    fontFamily: "Old Standard TT",
    fontSize: 20,
    fontWeight: "bold",
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
    fontFamily: "Old Standard TT",
    fontSize: 14,
    fontWeight: "bold",
    color: pdfColors.textPrimary,
    marginBottom: 2,
  },
  columnDate: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 8,
    color: pdfColors.textSecondary,
    marginBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontFamily: "Old Standard TT",
    fontSize: 14,
    fontWeight: "bold",
    color: pdfColors.textPrimary,
    marginBottom: 6,
    borderBottom: `1px solid ${pdfColors.border}`,
    paddingBottom: 4,
  },
  sectionHeadingCompact: {
    fontSize: 10.5,
    marginBottom: 4,
    paddingBottom: 2,
  },
  item: {
    marginBottom: 8,
  },
  itemLabel: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 9,
    color: pdfColors.textSecondary,
    marginBottom: 2,
  },
  itemLabelCompact: {
    fontSize: 7,
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
  body: {
    fontSize: 11,
    lineHeight: 1.6,
    color: pdfColors.textPrimary,
  },
  bodyCompact: {
    fontSize: 8.5,
    lineHeight: 1.5,
  },
  emptySection: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 10,
    color: pdfColors.textMuted,
  },
  emptySectionCompact: {
    fontSize: 8,
  },
  pageLabel: {
    fontFamily: "Ibarra Real Nova",
    fontSize: 8,
    color: pdfColors.textMuted,
    textTransform: "uppercase",
    marginBottom: 8,
  },
});

interface LiturgyDocumentProps {
  liturgy: CompiledLiturgy;
  formulas: Formula[];
  prayers: Prayer[];
  audience: "guide" | "bulletin";
}

interface RenderSectionOptions {
  section: CompiledSection;
  index: number;
  formulas: Formula[];
  prayers: Prayer[];
  audience: "guide" | "bulletin";
  compact?: boolean;
}

function RenderedSection({
  section,
  index,
  formulas,
  prayers,
  audience,
  compact = false,
}: RenderSectionOptions): React.ReactElement {
  const visibleItems = section.items
    .map((item) => resolveItemText(item, formulas, prayers))
    .filter((resolved) => audience === "guide" || !resolved.leaderOnly);

  return (
    <View key={index} style={styles.section} wrap={false}>
      <Text style={[styles.sectionHeading, compact ? styles.sectionHeadingCompact : {}]}>
        {sectionTitle(section)}
      </Text>
      {visibleItems.length === 0 ? (
        <Text style={[styles.emptySection, compact ? styles.emptySectionCompact : {}]}>No items yet</Text>
      ) : (
        visibleItems.map((resolved, itemIndex) => (
          <View key={itemIndex} style={styles.item}>
            <View style={styles.itemLabelRow}>
              <Text style={[styles.itemLabel, compact ? styles.itemLabelCompact : {}]}>{resolved.label}</Text>
              {resolved.leaderOnly && <Text style={styles.leaderOnlyBadge}>Leader only</Text>}
            </View>
            <Text style={[styles.body, compact ? styles.bodyCompact : {}]}>
              {parseBoldSegments(resolved.text).map((segment, segIndex) => (
                <Text key={segIndex} style={segment.bold ? { fontWeight: "bold" } : undefined}>
                  {segment.text}
                </Text>
              ))}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

export function LiturgyDocument({
  liturgy,
  formulas,
  prayers,
  audience,
}: LiturgyDocumentProps): React.ReactElement {
  const dateIsSunday = isSunday(parseLocalDate(liturgy.serviceDate));
  const grouped = groupSectionsByPageColumn(liturgy.sections);

  if (!grouped) {
    // No page/column data (Vesper, Feature 18 pending) -- single continuous column.
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>
            {liturgy.templateName} — {liturgy.serviceDate}
            {dateIsSunday && ` — Lord's Day ${liturgy.lordsDayNumber}`}
          </Text>
          {liturgy.sections.map((section, index) => (
            <RenderedSection
              key={index}
              section={section}
              index={index}
              formulas={formulas}
              prayers={prayers}
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
        <Page key={pageGroup.page} size="A4" style={styles.page}>
          <Text style={styles.pageLabel}>Page {pageGroup.page}</Text>
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
                    <Text style={styles.columnTitle}>{liturgy.templateName}</Text>
                    <Text style={styles.columnDate}>
                      {liturgy.serviceDate}
                      {dateIsSunday && ` — Lord's Day ${liturgy.lordsDayNumber}`}
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
