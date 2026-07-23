import { displayCitation } from "@/lib/bible/bookNamesTagalog";
import { formatCitation } from "@/lib/liturgy/formatCitation";
import type { Formula, Item, Song } from "@/types/liturgy";

// A slice of a resolved cue's text -- `citation` is true only for the
// substituted {{scripture}}/{{song}} token itself (rendered in the same
// citation-red used for a Selection's header or a Psalm's title), never for
// the surrounding hand-written cue prose or a {{creed}} substitution (that
// names a Formula, not a Scripture reference). Never Small Caps -- that's a
// Congregation/Minister dialogue convention, unrelated to a narrated cue.
export interface VerbalCueRun {
  text: string;
  citation: boolean;
}

export interface VerbalCueResolution {
  text: string;
  runs: VerbalCueRun[];
}

// Resolves the `{{scripture}}`/`{{song}}`/`{{creed}}` tokens
// verbalCueTemplates.ts seeds into a Verbal Cue's text against whatever
// Selection/Song/Formula is actually placed alongside it in the same
// Section -- so the cue always names the real item, live, instead of
// whatever was true when the cue was written. A token with no matching
// sibling item yet (nothing placed, or the item was removed) falls back to
// a bracketed placeholder so an unfinished cue reads as obviously
// incomplete rather than silently wrong.
export function resolveVerbalCueTemplate(
  text: string,
  siblingItems: Item[],
  formulas: Formula[],
  songs: Song[]
): VerbalCueResolution {
  if (!text.includes("{{")) return { text, runs: [{ text, citation: false }] };

  const selectionItem = siblingItems.find((item) => item.type === "selection");
  const songItem = siblingItems.find((item) => item.type === "song");
  const formulaItem = siblingItems.find((item) => item.type === "formula");
  const song = songItem?.type === "song" ? songs.find((s) => s.id === songItem.songId) : undefined;
  const formula = formulaItem?.type === "formula" ? formulas.find((f) => f.id === formulaItem.formulaId) : undefined;

  const tokenValues: Record<string, { value: string; citation: boolean }> = {
    "{{scripture}}": {
      value:
        selectionItem?.type === "selection"
          ? displayCitation(formatCitation(selectionItem.citation), selectionItem.translation)
          : "[Scripture]",
      citation: true,
    },
    "{{song}}": { value: song ? formatCitation(song.title) : "[Psalm/Hymn]", citation: true },
    "{{creed}}": { value: formula?.name ?? "[Creed]", citation: false },
  };

  const runs: VerbalCueRun[] = [];
  let plainText = "";
  let cursor = 0;
  const tokenPattern = /\{\{(scripture|song|creed)\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > cursor) {
      const literal = text.slice(cursor, match.index);
      runs.push({ text: literal, citation: false });
      plainText += literal;
    }
    const token = tokenValues[match[0]] ?? { value: match[0], citation: false };
    runs.push({ text: token.value, citation: token.citation });
    plainText += token.value;
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    const literal = text.slice(cursor);
    runs.push({ text: literal, citation: false });
    plainText += literal;
  }

  return { text: plainText, runs };
}
