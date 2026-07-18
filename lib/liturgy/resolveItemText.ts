import { TRINITARIAN_SEAL_TEXT } from "@/lib/liturgy/trinitarianSeal";
import { formatCitation } from "@/lib/liturgy/formatCitation";
import type { Formula, Item, Prayer, Song } from "@/types/liturgy";

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
  songs: Song[] = []
): ResolvedItem {
  switch (item.type) {
    case "selection": {
      // Trinitarian Seal: a fixed, bolded closing line appended immediately
      // after the Selection's own text (Benediction) -- `**bold**` markdown
      // so it renders bold everywhere parseBoldSegments already runs,
      // without a new rendering path. Appended to (not folded into)
      // item.text, so item.marks' offsets -- which only ever index into the
      // original text -- stay valid; the seal itself is never markable.
      const seal = item.trinitarianSeal ? TRINITARIAN_SEAL_TEXT[item.trinitarianSeal] : null;
      const text = seal ? (item.text ? `${item.text} **${seal}**` : `**${seal}**`) : item.text;
      return { label: formatCitation(item.citation), text, leaderOnly: false, rubric: false };
    }
    case "formula": {
      const formula = formulas.find((f) => f.id === item.formulaId);
      const text = item.overrideText ?? formula?.defaultText ?? "(Formula not found)";
      return {
        label: formula?.name ?? "Formula",
        text,
        leaderOnly: item.visibility === "leader_only",
        rubric: false,
      };
    }
    case "verbal_cue":
      return {
        label: "Verbal Cue",
        text: item.text,
        leaderOnly: item.visibility === "leader_only",
        rubric: item.rubric ?? false,
      };
    case "prayer": {
      const prayer = prayers.find((p) => p.id === item.prayerId);
      return { label: "Prayer", text: prayer?.text ?? "(Prayer not found)", leaderOnly: false, rubric: false };
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
