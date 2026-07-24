// Builds a flat, alternating [fil, en, fil, en, ...] sequence for a
// side-by-side Filipino/English library display -- the actual point of the
// bilingual tagging feature: a translation pair renders on the same row
// (Filipino left, English right), instead of the two languages interleaved
// in whatever order they happened to be created (AB, BSB, BSB, AB, ...),
// which was the original problem this was meant to solve.
//
// A stored `pairedId` link keeps Formula/Prayer/Song pairs aligned; an
// unpaired tagged item gets a row to itself with the other side blank.
// Untagged items (no `translation` at all) have no language to align
// against, so they're appended at the end, one per row, left-column only.
export interface BilingualPairable {
  id: string;
  translation?: "fil" | "en" | null;
  pairedId?: string | null;
}

export function buildBilingualRows<T extends BilingualPairable>(
  items: T[],
  findCompanion?: (item: T, items: T[]) => T | undefined
): (T | null)[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const resolveCompanion =
    findCompanion ?? ((item: T): T | undefined => (item.pairedId ? byId.get(item.pairedId) : undefined));

  const consumed = new Set<string>();
  const cells: (T | null)[] = [];
  const untagged: T[] = [];

  for (const item of items) {
    if (consumed.has(item.id)) continue;
    if (!item.translation) {
      untagged.push(item);
      consumed.add(item.id);
      continue;
    }

    const companion = resolveCompanion(item, items);
    if (companion && !consumed.has(companion.id)) {
      const fil = item.translation === "fil" ? item : companion;
      const en = item.translation === "fil" ? companion : item;
      cells.push(fil, en);
      consumed.add(item.id);
      consumed.add(companion.id);
    } else {
      if (item.translation === "fil") cells.push(item, null);
      else cells.push(null, item);
      consumed.add(item.id);
    }
  }

  for (const item of untagged) {
    cells.push(item, null);
  }

  return cells;
}
