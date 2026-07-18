import type { Item } from "@/types/liturgy";

// Two ordering rules, regardless of the order items were actually added in:
// 1. A Verbal Cue always renders first -- it's presider narration that sets
//    up whatever follows, so it can never trail behind the content it's
//    introducing.
// 2. Scripture (Selection/Song) always precedes a Formula -- the proof text
//    is the warrant for the declaration that follows it (e.g. Assurance of
//    Pardon: the Scripture citations, then the Absolution formula), never
//    the other way around.
// A stable sort (only these two promotions happen; everything else keeps
// its original relative order) is enough -- there's no other ordering rule
// among the remaining item types.
function priority(item: Item): number {
  if (item.type === "verbal_cue") return 0;
  if (item.type === "selection" || item.type === "song") return 1;
  return 2;
}

export function sortSectionItems(items: Item[]): Item[] {
  return [...items].sort((a, b) => priority(a) - priority(b));
}
