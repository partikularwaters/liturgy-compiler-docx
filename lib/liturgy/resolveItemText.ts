import { applyTrinitarianSeal } from "@/lib/liturgy/trinitarianSeal";
import { formatCitation } from "@/lib/liturgy/formatCitation";
import { displayCitation } from "@/lib/bible/bookNamesTagalog";
import { resolveVerbalCueTemplate } from "@/lib/liturgy/resolveVerbalCueTemplate";
import type { Formula, Item, Prayer, Song, TextMark } from "@/types/liturgy";

export interface ResolvedItem {
  label: string | null;
  text: string;
  leaderOnly: boolean;
  // Feature 26: true only for a "Rubric style" Verbal Cue -- rendered
  // Sentence case + italic instead of the default treatment. Always false
  // for every other item type.
  rubric: boolean;
  // Feature 21: set only for Song items -- `text` above already holds the
  // title (what every audience sees), `song` carries the rest of the
  // metadata for surfaces that show it (Leader Guide only, per §L).
  song?: Song;
  // Set for Selection/Formula (the two TrinitarianSealable item types) --
  // callers must render marks from here, not item.marks directly, once a
  // seal has been appended (see resolveItemText's own comment below).
  marks?: TextMark[];
}

// Single source of truth for "what does this Item actually display" — used by
// both the Compile View (SectionCard) and the PDF export, so they can never
// drift apart. leaderOnly is true only for Formula/Verbal Cue items whose
// visibility is set to 'leader_only' (Selection/Prayer have no visibility
// flag); the Bulletin export and the "Leader only" badge both key off it.
// Exported separately so callers that need an item's displayed text
// *without* a Trinitarian Seal appended (e.g. FormulaEditForm's textarea,
// which must edit the underlying override text, not a seal baked on top of
// it) can get it without duplicating the per-type resolution logic above.
export function resolveBase(
  item: Item,
  formulas: Formula[],
  prayers: Prayer[],
  songs: Song[] = [],
  siblingItems: Item[] = []
): ResolvedItem {
  switch (item.type) {
    case "selection":
      return {
        label: displayCitation(formatCitation(item.citation), item.translation),
        text: item.text,
        leaderOnly: false,
        rubric: false,
        marks: item.marks ?? [],
      };
    case "formula": {
      const formula = formulas.find((f) => f.id === item.formulaId);
      const text = item.overrideText ?? formula?.defaultText ?? "(Formula not found)";
      return {
        label: formula?.name ?? "Formula",
        text,
        leaderOnly: item.visibility === "leader_only",
        rubric: false,
        marks: item.marks ?? [],
      };
    }
    case "verbal_cue": {
      const rawText = item.showAlternate && item.textAlternate ? item.textAlternate : item.text;
      return {
        label: "Verbal Cue",
        text: resolveVerbalCueTemplate(rawText, siblingItems, formulas, songs),
        leaderOnly: item.visibility === "leader_only",
        rubric: item.rubric ?? false,
      };
    }
    case "prayer": {
      const prayer = prayers.find((p) => p.id === item.prayerId);
      return {
        label: "Prayer",
        text: prayer?.text ?? "(Prayer not found)",
        leaderOnly: false,
        rubric: false,
        marks: prayer?.marks ?? [],
      };
    }
    case "sermon":
      return { label: "Sermon", text: item.passage, leaderOnly: false, rubric: false };
    case "song": {
      const song = songs.find((s) => s.id === item.songId);
      return {
        label: null,
        text: song ? formatCitation(song.title) : "(Song not found)",
        leaderOnly: false,
        rubric: false,
        song,
      };
    }
  }
}

// Single source of truth for "what does this Item actually display" — used by
// both the Compile View (SectionCard) and the PDF export, so they can never
// drift apart. leaderOnly is true only for Formula/Verbal Cue items whose
// visibility is set to 'leader_only' (Selection/Prayer have no visibility
// flag); the Bulletin export and the "Leader only" badge both key off it.
export function resolveItemText(
  item: Item,
  formulas: Formula[],
  prayers: Prayer[],
  songs: Song[] = [],
  siblingItems: Item[] = []
): ResolvedItem {
  const resolved = resolveBase(item, formulas, prayers, songs, siblingItems);

  // Trinitarian Seal: a fixed, bolded closing line appended immediately
  // after whichever item type carries it (TrinitarianSealable) -- a real
  // `bold` mark so it renders bold everywhere applyMarks() already runs,
  // without a new rendering path. applyTrinitarianSeal() is the single
  // source of truth for this (shared with MarkEditor's live edit-time
  // preview, so they can't drift) -- it also folds the seal into a trailing
  // Congregation/Minister mark rather than leaving it as a separate
  // block-breaking segment. Generic across item types on purpose:
  // Benediction seals a Selection, Assurance of Pardon seals the Absolution
  // Formula.
  if ("trinitarianSeal" in item && item.trinitarianSeal) {
    const sealed = applyTrinitarianSeal(resolved.text, resolved.marks ?? [], item.trinitarianSeal);
    resolved.text = sealed.text;
    resolved.marks = sealed.marks;
  }

  return resolved;
}
