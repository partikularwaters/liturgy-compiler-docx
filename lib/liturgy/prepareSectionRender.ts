import { resolveItemText, type ResolvedItem } from "@/lib/liturgy/resolveItemText";
import { sortSectionItems } from "@/lib/liturgy/sortSectionItems";
import { formatCitation } from "@/lib/liturgy/formatCitation";
import type { CompiledSection, Formula, Item, Prayer, SelectionItem, Song, TextMark } from "@/types/liturgy";

// Sections whose sole content is a recited text (a Creed, Vesper's Church
// Covenant) get that Formula's own name shown inline with the Section
// title, plain (not citation-red/small-caps, since it isn't Scripture) --
// mirrors SectionCard.tsx's TITLE_IN_HEADER_SECTIONS. Duplicated rather than
// imported since SectionCard is a client component and this helper is
// shared by two server-rendered surfaces (PDF, WebView) that don't need its
// editing-related state.
const TITLE_IN_HEADER_SECTIONS = ["Affirmation of Faith", "Affirmation of Faith / Church Covenant"];

export interface HeaderInfo {
  text: string;
  // Citation-red color -- a Selection's citation, or a Metrical Psalter
  // Song's title (Scripture-adjacent, per §L), always get this. A Hymn or a
  // Creed/Church-Covenant title doesn't.
  citationColor: boolean;
  // Small-caps is specifically a *reference* typesetting convention
  // (citations, e.g. "JOHN 3:16") -- separate from citationColor because a
  // Psalm title is citation-colored but naturally-cased prose, not a
  // reference, and must not also go small-caps.
  smallCaps: boolean;
  // Song titles moved into the header (a Section whose sole content is one
  // Song) render italic, matching SongTitle's own convention.
  italic?: boolean;
}

export interface PreparedItem {
  item: Item;
  resolved: ResolvedItem;
}

export interface PreparedSection {
  header: HeaderInfo | null;
  mergedSelection: { text: string; marks: TextMark[] } | null;
  items: PreparedItem[];
}

// Single source of truth for "how does this Section's items actually lay
// out," used by the PDF export and the Web View so they can't drift from
// each other, and so they finally match what the Compile View
// (SectionCard.tsx) already does: Selection citations (and, absent any
// Selection, a Creed/Church-Covenant Formula's name) move onto the
// Section-title line instead of repeating per item; more than one Selection
// reads as one continuous passage instead of separate paragraphs, each
// item's own marks offset-shifted into the combined text.
export function prepareSectionRender(
  section: CompiledSection,
  formulas: Formula[],
  prayers: Prayer[],
  songs: Song[]
): PreparedSection {
  const sorted = sortSectionItems(section.items);
  const selectionItems = sorted.filter((item): item is SelectionItem => item.type === "selection");
  const creedFormulaItem = sorted.find((item) => item.type === "formula") ?? null;
  const songItems = sorted.filter((item) => item.type === "song");
  const showCreedTitleInHeader =
    selectionItems.length === 0 && TITLE_IN_HEADER_SECTIONS.includes(section.name) && creedFormulaItem !== null;

  let header: HeaderInfo | null = null;
  if (selectionItems.length > 0) {
    header = {
      text: selectionItems.map((item) => formatCitation(item.citation)).join("; "),
      citationColor: true,
      smallCaps: true,
    };
  } else if (showCreedTitleInHeader && creedFormulaItem) {
    const label = resolveItemText(creedFormulaItem, formulas, prayers, songs).label;
    if (label) header = { text: label, citationColor: false, smallCaps: false };
  } else if (songItems.length === 1) {
    const song = songs.find((s) => s.id === songItems[0].songId);
    if (song) {
      header = {
        text: formatCitation(song.title),
        citationColor: song.kind === "psalm",
        smallCaps: false,
        italic: true,
      };
    }
  }

  let mergedSelection: { text: string; marks: TextMark[] } | null = null;
  if (selectionItems.length > 1) {
    let offset = 0;
    const marks: TextMark[] = [];
    const parts: string[] = [];
    for (const item of selectionItems) {
      if (offset > 0) offset += 1;
      marks.push(...(item.marks ?? []).map((m) => ({ ...m, start: m.start + offset, end: m.end + offset })));
      parts.push(item.text);
      offset += item.text.length;
    }
    mergedSelection = { text: parts.join(" "), marks };
  }

  const excludedIds = new Set(mergedSelection ? selectionItems.map((item) => item.id) : []);
  // The single Song's own title line would otherwise duplicate what's now
  // shown in the header -- excluded from the body list the same way a
  // sole Selection's citation is (its own body text still renders below;
  // a Song has no body beyond the title, so there's nothing left to show).
  if (header?.italic && songItems.length === 1) excludedIds.add(songItems[0].id);

  const items: PreparedItem[] = sorted
    .filter((item) => !excludedIds.has(item.id))
    .map((item) => ({ item, resolved: resolveItemText(item, formulas, prayers, songs) }));

  return { header, mergedSelection, items };
}
