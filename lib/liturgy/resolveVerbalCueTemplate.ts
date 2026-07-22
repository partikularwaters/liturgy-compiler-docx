import { displayCitation } from "@/lib/bible/bookNamesTagalog";
import { formatCitation } from "@/lib/liturgy/formatCitation";
import type { Formula, Item, Song } from "@/types/liturgy";

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
): string {
  if (!text.includes("{{")) return text;

  const selectionItem = siblingItems.find((item) => item.type === "selection");
  const songItem = siblingItems.find((item) => item.type === "song");
  const formulaItem = siblingItems.find((item) => item.type === "formula");
  const song = songItem?.type === "song" ? songs.find((s) => s.id === songItem.songId) : undefined;
  const formula = formulaItem?.type === "formula" ? formulas.find((f) => f.id === formulaItem.formulaId) : undefined;

  return text
    .replace(
      /\{\{scripture\}\}/g,
      selectionItem?.type === "selection"
        ? displayCitation(formatCitation(selectionItem.citation), selectionItem.translation)
        : "[Scripture]"
    )
    .replace(/\{\{song\}\}/g, song ? formatCitation(song.title) : "[Psalm/Hymn]")
    .replace(/\{\{creed\}\}/g, formula?.name ?? "[Creed]");
}
