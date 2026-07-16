import type { CompiledSection } from "@/types/liturgy";

export interface ColumnGroup {
  column: number;
  sections: { section: CompiledSection; index: number }[];
}

export interface PageGroup {
  page: number;
  columns: ColumnGroup[];
}

// Returns null when any Section is missing page/column (e.g. Vesper, whose
// Section->column assignment is deferred to Feature 18) -- callers fall back
// to the flat single-column list in that case.
export function groupSectionsByPageColumn(sections: CompiledSection[]): PageGroup[] | null {
  if (sections.some((s) => s.page === undefined || s.column === undefined)) {
    return null;
  }

  const pageMap = new Map<number, Map<number, { section: CompiledSection; index: number }[]>>();

  sections.forEach((section, index) => {
    const page = section.page as number;
    const column = section.column as number;
    if (!pageMap.has(page)) pageMap.set(page, new Map());
    const columnMap = pageMap.get(page)!;
    if (!columnMap.has(column)) columnMap.set(column, []);
    columnMap.get(column)!.push({ section, index });
  });

  return Array.from(pageMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([page, columnMap]) => ({
      page,
      columns: Array.from(columnMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([column, columnSections]) => ({ column, sections: columnSections })),
    }));
}
