import type { Formula, Item, Prayer } from "@/types/liturgy";

export interface ResolvedItem {
  label: string | null;
  text: string;
  leaderOnly: boolean;
}

// Single source of truth for "what does this Item actually display" — used by
// both the Compile View (SectionCard) and the PDF export, so they can never
// drift apart. leaderOnly is true only for Formula/Verbal Cue items whose
// visibility is set to 'leader_only' (Selection/Prayer have no visibility
// flag); the Bulletin export and the "Leader only" badge both key off it.
export function resolveItemText(item: Item, formulas: Formula[], prayers: Prayer[]): ResolvedItem {
  switch (item.type) {
    case "selection":
      return { label: item.citation, text: item.text, leaderOnly: false };
    case "formula": {
      const formula = formulas.find((f) => f.id === item.formulaId);
      const text = item.overrideText ?? formula?.defaultText ?? "(Formula not found)";
      return { label: formula?.name ?? "Formula", text, leaderOnly: item.visibility === "leader_only" };
    }
    case "verbal_cue":
      return { label: "Verbal Cue", text: item.text, leaderOnly: item.visibility === "leader_only" };
    case "prayer": {
      const prayer = prayers.find((p) => p.id === item.prayerId);
      return { label: "Prayer", text: prayer?.text ?? "(Prayer not found)", leaderOnly: false };
    }
    case "sermon":
      return { label: "Sermon", text: item.passage, leaderOnly: false };
  }
}
