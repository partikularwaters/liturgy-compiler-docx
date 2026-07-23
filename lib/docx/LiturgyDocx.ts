import {
  AlignmentType,
  ColumnBreak,
  convertInchesToTwip,
  Document,
  Footer,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  ImageRun,
  PageNumber,
  PageOrientation,
  Paragraph,
  ShadingType,
  TabStopPosition,
  TabStopType,
  TextRun,
  TextWrappingSide,
  TextWrappingType,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
} from "docx";
import { DOCX_FONT_FAMILY } from "@/lib/docx/fonts";
import { docxColors } from "@/lib/docx/tokens";
import { getColumnCount } from "@/lib/docx/columnLayout";
import { getLogoBuffer, LOGO_HEIGHT_PX, LOGO_WIDTH_PX } from "@/lib/docx/logo";
import { sectionTitle } from "@/lib/liturgy/sectionTitle";
import { applyMarks } from "@/lib/text/marks";
import { prepareSectionRender } from "@/lib/liturgy/prepareSectionRender";
import { SILENT_CONFESSION_SECTION, SILENT_CONFESSION_RUBRIC_TEXT } from "@/lib/liturgy/silentConfessionRubric";
import { isSunday, parseLocalDate } from "@/lib/liturgy/lordsDay";
import type { VerbalCueRun } from "@/lib/liturgy/resolveVerbalCueTemplate";
import type { CompiledLiturgy, CompiledSection, Formula, Prayer, Song, TextMark } from "@/types/liturgy";

// Mirrors lib/pdf/LiturgyDocument.tsx's PRAYER_GUIDE_SECTIONS.
const PRAYER_GUIDE_SECTIONS = [
  "Prayer of Invocation",
  "Prayer for Illumination",
  "Prayer for Pardon",
  "Prayer before Communion",
  "Closing of the Table",
  "Pastoral Prayer",
];

// Same long-landscape page as the PDF side (13in x 8in) --
// gives the 3-column layout a wide enough page to sit in. Margins: 0.3in
// top/bottom, 0.4in left/right (the confirmed landscape spec --
// corrected from an earlier 0.25in left/right guess).
const PAGE_SHORT_SIDE = convertInchesToTwip(8);
const PAGE_LONG_SIDE = convertInchesToTwip(13);
const MARGIN_TOP_BOTTOM = convertInchesToTwip(0.3);
const MARGIN_LEFT_RIGHT = convertInchesToTwip(0.4);
const COLUMN_SPACE = convertInchesToTwip(0.3);

const BODY_SIZE = 24; // 12pt, in half-points (docx `size` is half-points)
const REFERENCE_SIZE = 20; // 10pt
const TITLE_SIZE = 28; // 14pt
const META_SIZE = 20; // 10pt
const LABEL_SIZE = 18; // 9pt

// The confirmed structural convention (verified against a real
// hand-edited reference export): 0.5 line after a Section heading and
// after any internal division (Leader->Congregation, Scripture->Formula,
// etc.), but 0pt after a Section's final body line -- a dedicated blank
// paragraph (also 0.5 line) carries the actual gap before the next Section's
// heading, rather than the last body line carrying trailing space itself. A
// body-less Section (title fits the heading line, e.g. "Psalm of Adoration")
// gets sandwiched by that same blank separator on both sides, since it has
// no last-body-line of its own to zero out -- this falls out automatically
// below rather than needing special-casing. 120 twips matches the literal
// value in the reference export for "0.5 line" at 12pt body text.
const HALF_LINE = 120;

interface RunStyle {
  size: number;
  font: string;
  italics?: boolean;
  smallCaps?: boolean;
  color?: string;
  bold?: boolean;
}

// A paragraph is built up as plain data (not a live docx Paragraph) until
// the very end of a Section's body, because whether the *last* paragraph
// gets 0.5-line or 0pt spacing can only be known in hindsight -- see
// finalizeParagraphs() below.
interface ParagraphSpec {
  runs: TextRun[];
  spacingAfter: number;
  indentLeft?: number;
}

function toParagraph(spec: ParagraphSpec): Paragraph {
  return new Paragraph({
    spacing: spec.spacingAfter ? { after: spec.spacingAfter } : undefined,
    indent: spec.indentLeft ? { left: spec.indentLeft } : undefined,
    children: spec.runs,
  });
}

// Word requires an explicit line-break element between lines within one
// paragraph -- a literal "\n" inside a run's text is not a recognized break
// (confirmed empirically: docx preserves it as a literal character inside
// <w:t>, which most Word versions don't render as a line break at all).
// Real content (e.g. the Decalogue, one commandment per line) uses
// separate Word *paragraphs* per line, not soft breaks within one paragraph
// -- matches the reference export's actual structure and is what makes the
// 0.5-line/0pt spacing rule meaningful (paragraph-level spacing has nothing
// to attach to otherwise). This walks mark segments -> bold segments ->
// newline-split lines in one pass so a **bold** span or a Congregation/
// Minister mark that happens to cross a line break still applies correctly
// per resulting paragraph, instead of losing its pairing at the split (the
// exact bug lib/text/markdown.ts's own dotAll fix was for, at the segment
// level -- this is the same category of bug one level up, at the paragraph
// level).
interface LeaderStyle {
  size: number;
  color?: string;
  italics?: boolean;
}

function textToParagraphSpecs(text: string, marks: TextMark[] | undefined, leaderStyle: LeaderStyle): ParagraphSpec[] {
  const markSegments = applyMarks(text, marks);
  const specs: ParagraphSpec[] = [];
  let currentRuns: TextRun[] = [];
  let currentIndent: number | undefined;

  const flush = (spacingAfter: number): void => {
    if (currentRuns.length === 0) return;
    specs.push({ runs: currentRuns, spacingAfter, indentLeft: currentIndent });
    currentRuns = [];
    currentIndent = undefined;
  };

  for (const seg of markSegments) {
    const isBlock = seg.mark === "congregation" || seg.mark === "minister";

    if (isBlock) {
      // A division: whatever was accumulating before this block (plain
      // Leader text) gets the 0.5-line gap, then the block starts its own
      // fresh paragraph(s).
      flush(HALF_LINE);
      currentIndent = seg.mark === "congregation" ? convertInchesToTwip(0.25) : undefined;
      currentRuns.push(
        new TextRun({
          text: seg.mark === "congregation" ? "Congr: " : "Min: ",
          bold: true,
          size: LABEL_SIZE,
          font: DOCX_FONT_FAMILY,
          color: docxColors.accentDark,
          allCaps: true,
        })
      );
    }

    // Congregation forces the whole line bold regardless of its own per-run
    // Bold marks (matches lib/pdf's markCongregationText treatment); Minister
    // and Leader keep whatever applyMarks() resolved per run -- forcing
    // `bold: false` here would silently strip a genuine Bold mark inside
    // Minister's own dialogue. Small Caps is a per-run overlay now
    // -- it used to be a per-segment "exclusive" mark, wrongly competing with
    // Congregation/Minister for the same range), so it's read off each run
    // below instead of this shared style.
    const style: RunStyle =
      seg.mark === "congregation"
        ? { size: leaderStyle.size, font: DOCX_FONT_FAMILY, bold: true }
        : {
            size: leaderStyle.size,
            font: DOCX_FONT_FAMILY,
            color: leaderStyle.color,
            italics: leaderStyle.italics,
          };

    for (const boldSeg of seg.runs) {
      const lines = boldSeg.text.split("\n");
      lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
          // A bare line break mid-passage (e.g. between commandments) --
          // not a division, so 0pt, not 0.5-line.
          flush(0);
          if (isBlock) currentIndent = seg.mark === "congregation" ? convertInchesToTwip(0.25) : undefined;
        }
        if (line.length > 0) {
          currentRuns.push(
            new TextRun({
              text: line,
              ...style,
              bold: style.bold ?? boldSeg.bold,
              smallCaps: boldSeg.smallCaps,
            })
          );
        }
      });
    }

    if (isBlock) flush(HALF_LINE); // provisional -- corrected by finalizeParagraphs() if this turns out to be the Section's last paragraph
  }

  flush(0);
  return specs;
}

// The very last paragraph of a Section's body must be 0pt regardless of how
// it was accumulated (a division's trailing block might otherwise leave a
// provisional 0.5-line on it) -- this is the one thing that can only be
// known once the whole body is assembled.
// A Verbal Cue's substituted {{scripture}}/{{song}} token renders in
// citation-red (matching a Selection header/Psalm title elsewhere), never
// Small Caps -- the rest of the cue's hand-written prose stays plain, same
// treatment Rubric style already gets.
function verbalCueRunsToParagraphSpecs(runs: VerbalCueRun[], rubric: boolean): ParagraphSpec[] {
  const specs: ParagraphSpec[] = [];
  let currentRuns: TextRun[] = [];

  const flush = (): void => {
    if (currentRuns.length === 0) return;
    specs.push({ runs: currentRuns, spacingAfter: 0 });
    currentRuns = [];
  };

  for (const run of runs) {
    const lines = run.text.split("\n");
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) flush();
      if (line.length > 0) {
        currentRuns.push(
          new TextRun({
            text: line,
            size: BODY_SIZE,
            font: DOCX_FONT_FAMILY,
            italics: rubric,
            color: run.citation ? docxColors.citation : rubric ? docxColors.textSecondary : docxColors.textPrimary,
          })
        );
      }
    });
  }

  flush();
  return specs;
}

function finalizeParagraphs(specs: ParagraphSpec[]): Paragraph[] {
  if (specs.length === 0) return [];
  const last = specs[specs.length - 1];
  const normalized = [...specs.slice(0, -1), { ...last, spacingAfter: 0 }];
  return normalized.map(toParagraph);
}

interface RenderSectionArgs {
  section: CompiledSection;
  formulas: Formula[];
  prayers: Prayer[];
  songs: Song[];
  audience: "guide" | "bulletin";
}

function renderSection({ section, formulas, prayers, songs, audience }: RenderSectionArgs): Paragraph[] {
  const prepared = prepareSectionRender(section, formulas, prayers, songs);
  const visibleItems = prepared.items.filter(({ resolved }) => audience === "guide" || !resolved.leaderOnly);
  const isEmpty = visibleItems.length === 0 && !prepared.mergedSelection;
  const guides = prayers.filter((p) => p.sectionName === section.name && p.isGuide);

  const paragraphs: Paragraph[] = [];

  if (section.columnBreakBefore) {
    paragraphs.push(new Paragraph({ children: [new ColumnBreak()] }));
  }

  const headingRunChildren: TextRun[] = [
    new TextRun({
      text: sectionTitle(section, songs),
      bold: true,
      allCaps: true,
      size: BODY_SIZE,
      font: DOCX_FONT_FAMILY,
      color: docxColors.textPrimary,
    }),
  ];

  if (prepared.header) {
    headingRunChildren.push(new TextRun({ text: "\t" }));
    headingRunChildren.push(
      new TextRun({
        text: prepared.header.text,
        size: REFERENCE_SIZE,
        font: DOCX_FONT_FAMILY,
        italics: prepared.header.italic ?? false,
        smallCaps: prepared.header.smallCaps,
        color: prepared.header.citationColor ? docxColors.citation : docxColors.textPrimary,
      })
    );
  }

  // Heading always gets the 0.5-line gap, whether or not this Section has
  // any body at all -- a body-less Section (e.g. Psalm of Adoration) then
  // relies on the trailing Section-separator paragraph below to complete
  // its "sandwich," matching the reference export exactly.
  paragraphs.push(
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      spacing: { after: HALF_LINE },
      children: headingRunChildren,
    })
  );

  if (audience === "guide" && section.showPrayerGuide && PRAYER_GUIDE_SECTIONS.includes(section.name) && guides.length > 0) {
    paragraphs.push(
      new Paragraph({
        shading: { type: ShadingType.CLEAR, fill: docxColors.surfaceSecondary },
        children: [
          new TextRun({
            text: "Prayer Guide",
            bold: true,
            size: LABEL_SIZE,
            font: DOCX_FONT_FAMILY,
            color: docxColors.textSecondary,
          }),
        ],
      })
    );
    for (const guide of guides) {
      // Guide text carries real line breaks (a numbered structural
      // sequence) -- same newline-to-paragraph handling as body text, no
      // marks/bold to worry about since guides are plain reference text.
      const lines = guide.text.split("\n");
      lines.forEach((line, index) => {
        if (line.length === 0) return;
        paragraphs.push(
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: docxColors.surfaceSecondary },
            spacing: index < lines.length - 1 ? { after: 0 } : undefined,
            children: [new TextRun({ text: line, size: LABEL_SIZE, font: DOCX_FONT_FAMILY })],
          })
        );
      });
    }
  }

  if (!isEmpty) {
    if (prepared.mergedSelection) {
      paragraphs.push(
        ...finalizeParagraphs(
          textToParagraphSpecs(prepared.mergedSelection.text, prepared.mergedSelection.marks, { size: BODY_SIZE })
        )
      );
    }

    for (const { item, resolved } of visibleItems) {
      if (item.type === "song") {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: resolved.text,
                italics: true,
                size: BODY_SIZE,
                font: DOCX_FONT_FAMILY,
                color: resolved.song?.kind === "psalm" ? docxColors.citation : docxColors.textPrimary,
              }),
            ],
          })
        );
        if (audience === "guide" && resolved.song) {
          const meta = [resolved.song.attribution, resolved.song.yearPublished, resolved.song.notes]
            .filter(Boolean)
            .join(" — ");
          if (meta) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({ text: meta, size: META_SIZE, font: DOCX_FONT_FAMILY, color: docxColors.textSecondary }),
                ],
              })
            );
          }
        }
        continue;
      }

      // "Leader only" is deliberately not badged here (unlike the Compile
      // View's SectionCard, where it stays) -- a Leader-only item only ever
      // reaches the docx pipeline inside the Leader Guide export itself (the
      // Bulletin already filters it out via visibleItems above), so telling
      // the leader "this is leader-only" inside their own guide is redundant.
      const badgeText = [
        audience === "guide" && item.type === "selection" && item.amenExpected ? "Amen" : null,
      ]
        .filter(Boolean)
        .join(" · ");

      if (badgeText) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `[${badgeText}]`,
                bold: true,
                size: LABEL_SIZE,
                font: DOCX_FONT_FAMILY,
                color: docxColors.accentDark,
              }),
            ],
          })
        );
      }

      if (!resolved.text) continue;

      if (item.type === "verbal_cue" && resolved.verbalCueRuns) {
        paragraphs.push(
          ...finalizeParagraphs(verbalCueRunsToParagraphSpecs(resolved.verbalCueRuns, resolved.rubric))
        );
      } else if (
        (item.type === "selection" || item.type === "formula" || item.type === "prayer") &&
        resolved.marks &&
        resolved.marks.length > 0
      ) {
        paragraphs.push(
          ...finalizeParagraphs(textToParagraphSpecs(resolved.text, resolved.marks, { size: BODY_SIZE }))
        );
      } else {
        paragraphs.push(
          ...finalizeParagraphs(
            textToParagraphSpecs(resolved.text, undefined, {
              size: BODY_SIZE,
              italics: resolved.rubric,
              color: resolved.rubric ? docxColors.textSecondary : docxColors.textPrimary,
            })
          )
        );
      }
    }
  }

  // Silent Confession rubric -- fixed, uneditable text (not per-liturgy
  // data), always present regardless of audience since it's public (shown
  // to the whole church), unlike this Section's other, Leader-only cue.
  if (section.name === SILENT_CONFESSION_SECTION) {
    const [firstLine, ...restLines] = SILENT_CONFESSION_RUBRIC_TEXT.split("\n");
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: firstLine, italics: true, size: BODY_SIZE, font: DOCX_FONT_FAMILY, color: docxColors.textPrimary }),
          ...restLines.map(
            (line) =>
              new TextRun({
                text: line,
                italics: true,
                size: BODY_SIZE,
                font: DOCX_FONT_FAMILY,
                color: docxColors.textPrimary,
                break: 1,
              })
          ),
        ],
      })
    );
  }

  // The Section-end separator -- always present, whether or not this
  // Section had a body. Combined with the heading's own 0.5-line spacing
  // above, this is what "sandwiches" a body-less Section correctly.
  paragraphs.push(new Paragraph({ spacing: { after: HALF_LINE }, children: [] }));

  return paragraphs;
}

interface BuildLiturgyDocxArgs {
  liturgy: CompiledLiturgy;
  formulas: Formula[];
  prayers: Prayer[];
  songs: Song[];
  audience: "guide" | "bulletin";
}

// docx equivalent of lib/pdf/LiturgyDocument.tsx -- one Document, one
// `audience` prop, reusing the exact same shared helpers (prepareSectionRender,
// resolveItemText via it, sectionTitle, applyMarks, formatCitation via
// prepareSectionRender) so this surface can't drift from the Compile View,
// PDF, or Web View.
export function buildLiturgyDocx({ liturgy, formulas, prayers, songs, audience }: BuildLiturgyDocxArgs): Document {
  const dateIsSunday = isSunday(parseLocalDate(liturgy.serviceDate));
  const formattedDate = parseLocalDate(liturgy.serviceDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Logo, real church file -- floated at
  // the top-left with text wrapping to its right, so the title/date lines
  // sit beside it rather than needing manual column math to avoid it.
  // Absent gracefully (see getLogoBuffer's own comment) if the file is ever
  // missing, rather than crashing the export.
  const logoBuffer = getLogoBuffer();
  const logoRun = logoBuffer
    ? new ImageRun({
        type: "png",
        data: logoBuffer,
        transformation: { width: LOGO_WIDTH_PX, height: LOGO_HEIGHT_PX },
        floating: {
          horizontalPosition: { relative: HorizontalPositionRelativeFrom.COLUMN, align: HorizontalPositionAlign.LEFT },
          verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, align: VerticalPositionAlign.TOP },
          wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.RIGHT },
          margins: { left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.15), bottom: convertInchesToTwip(0.1) },
        },
      })
    : null;

  const titleParagraphs = [
    new Paragraph({
      spacing: { after: 40 },
      children: [
        ...(logoRun ? [logoRun] : []),
        new TextRun({
          // The confirmed default -- the full "ORDER FOR
          // THE ... Service" wording, shortened by hand afterward only if a
          // given week's layout genuinely needs the space.
          text: `ORDER FOR THE ${liturgy.templateName} Service`,
          bold: true,
          allCaps: true,
          size: TITLE_SIZE,
          font: DOCX_FONT_FAMILY,
          color: docxColors.textPrimary,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: dateIsSunday ? `${formattedDate}   Lord's Day #${liturgy.lordsDayNumber}` : formattedDate,
          smallCaps: true,
          size: META_SIZE,
          font: DOCX_FONT_FAMILY,
          color: docxColors.textSecondary,
        }),
      ],
    }),
  ];

  const sectionParagraphs = liturgy.sections.flatMap((section) =>
    renderSection({ section, formulas, prayers, songs, audience })
  );

  const endNoteParagraphs = liturgy.showEndNote
    ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `~ End of ${liturgy.templateName} ~`,
              italics: true,
              size: BODY_SIZE,
              font: DOCX_FONT_FAMILY,
              color: docxColors.textSecondary,
            }),
          ],
        }),
      ]
    : [];

  return new Document({
    sections: [
      {
        properties: {
          page: {
            // docx's createPageSize swaps width/height whenever `orientation`
            // is LANDSCAPE (it assumes portrait-basis input and rotates it)
            // -- passing the short side as "width" here lets that swap land
            // the final <w:pgSz> at the correct 13in x 8in, *and* get an
            // explicit w:orient="landscape" written. Passing the already-
            // landscape 13x8 values directly with orientation set (the
            // earlier, wrong attempt) would have been rotated a second time
            // into an 8x13 page mislabeled "landscape" -- confirmed against
            // the library's own source, and against a real report of
            // the file printing in portrait (no w:orient at all, previously).
            size: { width: PAGE_SHORT_SIDE, height: PAGE_LONG_SIDE, orientation: PageOrientation.LANDSCAPE },
            margin: {
              top: MARGIN_TOP_BOTTOM,
              bottom: MARGIN_TOP_BOTTOM,
              left: MARGIN_LEFT_RIGHT,
              right: MARGIN_LEFT_RIGHT,
            },
          },
          // Word's native continuous-flow columns -- fills column 1
          // top-to-bottom, spills into column 2/3, then automatically
          // overflows onto a fresh page at column 1 again. No manual
          // pagination logic needed; CompiledSection.columnBreakBefore
          // (rendered above as a ColumnBreak) is the only authoring
          // override.
          column: { count: getColumnCount(liturgy.templateName), space: COLUMN_SPACE },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    children: ["Page ", PageNumber.CURRENT],
                    size: LABEL_SIZE,
                    font: DOCX_FONT_FAMILY,
                    color: docxColors.textMuted,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [...titleParagraphs, ...sectionParagraphs, ...endNoteParagraphs],
      },
    ],
  });
}
