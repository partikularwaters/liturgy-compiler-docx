interface BilingualEntry {
  id: string;
  translation?: "fil" | "en" | null;
}

// The whole point of bilingual tagging: a Filipino/English translation
// pair renders side by side on the same row (Filipino left, English
// right), instead of interleaved in whatever order they were created --
// which was the original problem ("AB then BSB, then BSB then AB") this
// was meant to solve. A row missing one side (unpaired, or the item is
// untagged) just leaves that cell blank rather than misaligning everything
// after it.
//
// Each pair gets its OWN 2-column grid, wrapped by ONE shared separator
// line on the pair itself (divide-y on the outer container), instead of
// each row component drawing its own border-bottom. That used to put the
// line at each column's own content height -- a 4-line Filipino entry and
// its 3-line English pair landed their lines at different heights. Since
// both cells in a single 2-column grid always stretch to match whichever
// is taller, one shared line on the pair is guaranteed to land at the true
// bottom of both, every time.
//
// Mobile (task 13): a real side-by-side 2-column grid has no room to
// breathe below ~640px. Below the `md` breakpoint this becomes an AB/BSB
// toggle instead -- both cells still render (nothing lost/refetched when
// switching), but only the language matching the page-wide toggle is
// visible, full-width. This stays a plain server-rendered function
// (deliberately NOT "use client") because `renderItem` is a function --
// Next.js can't pass a function prop across the server/client boundary,
// and the actual toggle behavior here needs no JavaScript at all: each
// cell gets a `data-translation` attribute, and a single pair of radio
// inputs + CSS rules (see the toggle markup in app/library/page.tsx and
// the `[data-translation]` rules in app/globals.css) show/hide by
// attribute selector alone.
export default function BilingualGrid<T extends BilingualEntry>({
  cells,
  renderItem,
}: {
  cells: (T | null)[];
  renderItem: (item: T) => React.ReactNode;
}): React.ReactElement {
  const pairs: (T | null)[][] = [];
  for (let i = 0; i < cells.length; i += 2) {
    pairs.push([cells[i], cells[i + 1] ?? null]);
  }

  return (
    <div className="bg-surface border border-border rounded-lg divide-y divide-border">
      {pairs.map((pair, i) => (
        <div key={pair[0]?.id ?? pair[1]?.id ?? `row-${i}`} className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-border">
          {pair.map((item, j) => (
            <div key={item?.id ?? `blank-${i}-${j}`} data-translation={item?.translation ?? "fil"} className="px-6 lib-lang-cell">
              {item ? renderItem(item) : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
