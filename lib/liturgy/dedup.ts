import type { Item } from "@/types/liturgy";

export function isDuplicateCitation(items: Item[], citation: string): boolean {
  return items.some((item) => item.type === "selection" && item.citation === citation);
}
