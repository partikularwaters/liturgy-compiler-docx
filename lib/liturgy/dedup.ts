import type { Item } from "@/types/liturgy";
import { formatCitation } from "@/lib/liturgy/formatCitation";

// A citation's hyphen-vs-en-dash spelling isn't a meaningful difference --
// "47:5-9" and "47:5–9" are the same reference. Compare through
// formatCitation() so a plain-typed hyphen and an already-en-dashed citation
// (or two independently saved copies with different punctuation) are
// recognized as the same passage instead of silently duplicating.
export function isDuplicateCitation(items: Item[], citation: string): boolean {
  const target = formatCitation(citation);
  return items.some((item) => item.type === "selection" && formatCitation(item.citation) === target);
}
