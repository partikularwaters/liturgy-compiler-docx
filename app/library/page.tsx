import Link from "next/link";
import { getFormulas } from "@/lib/formulas/getFormulas";
import { getPrayers } from "@/lib/prayers/getPrayers";
import { getScriptureSelections } from "@/lib/selections/getScriptureSelections";
import { getSongs } from "@/lib/songs/getSongs";
import { getSectionNames } from "@/lib/liturgy/getSectionNames";
import { buildBilingualRows } from "@/lib/library/pairForDisplay";
import { toEnglishCitation } from "@/lib/bible/bookNamesTagalog";
import { formatCitation } from "@/lib/liturgy/formatCitation";
import FormulaListRow from "@/components/formulas/FormulaListRow";
import PrayerListRow from "@/components/prayers/PrayerListRow";
import ScriptureSelectionRow from "@/components/selections/ScriptureSelectionRow";
import SongListRow from "@/components/songs/SongListRow";
import type { Formula, Prayer, ScriptureSelection, Song } from "@/types/liturgy";

// Always reads the live library data -- otherwise a just-saved edit can look
// reverted after router.refresh() if Next serves a cached fetch response
// instead of re-querying Supabase (same bug class fixed on the homepage).
export const dynamic = "force-dynamic";

// The whole point of bilingual tagging: a Filipino/English translation
// pair renders side by side on the same row (Filipino left, English
// right), instead of interleaved in whatever order they were created --
// which was the original problem ("AB then BSB, then BSB then AB") this
// was meant to solve. A row missing one side (unpaired, or the item is
// untagged) just leaves that cell blank rather than misaligning everything
// after it.
function BilingualGrid<T extends { id: string }>({
  cells,
  renderItem,
}: {
  cells: (T | null)[];
  renderItem: (item: T) => React.ReactNode;
}): React.ReactElement {
  return (
    <div className="bg-surface border border-border rounded-lg grid grid-cols-2 divide-x divide-border">
      {cells.map((item, i) => (
        <div key={item?.id ?? `blank-${i}`} className="px-6 empty:py-0">
          {item ? renderItem(item) : <div className="border-b border-border-light py-4" />}
        </div>
      ))}
    </div>
  );
}

export default async function LibraryPage(): Promise<React.ReactElement> {
  const [formulas, allPrayers, scriptureSelections, songs, sectionNames] = await Promise.all([
    getFormulas(),
    getPrayers(),
    getScriptureSelections(),
    getSongs(),
    getSectionNames(),
  ]);

  const psalms = songs.filter((s) => s.kind === "psalm");
  const hymns = songs.filter((s) => s.kind === "hymn");

  const prayers = allPrayers.filter((p) => !p.isGuide);
  const guides = allPrayers.filter((p) => p.isGuide);

  const formulaRows = buildBilingualRows<Formula>(formulas);
  const prayerRows = buildBilingualRows<Prayer>(prayers);
  const psalmRows = buildBilingualRows<Song>(psalms);
  const hymnRows = buildBilingualRows<Song>(hymns);

  // Scripture has no stored `pairedId` -- a pair is matched live by
  // canonical citation (same convention as AddExistingSelectionPanel's own
  // hover-preview icon), since a Bible reference, unlike a Formula/Prayer/
  // Song, is a canonical key both languages can be matched against.
  const canonicalKey = (citation: string): string => toEnglishCitation(formatCitation(citation));
  const scriptureRows = buildBilingualRows<ScriptureSelection>(scriptureSelections, (item, items) =>
    items.find((other) => other.translation !== item.translation && canonicalKey(other.citation) === canonicalKey(item.citation))
  );

  return (
    <div className="max-w-[1120px] mx-auto p-8 flex flex-col gap-8">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">Browse Library</h1>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold leading-[26px] text-text-primary">Formulas</h2>
          <Link
            href="/formulas/new"
            className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
          >
            New Formula
          </Link>
        </div>
        {formulas.length === 0 ? (
          <p className="text-sm text-text-muted">No formulas yet.</p>
        ) : (
          <BilingualGrid
            cells={formulaRows}
            renderItem={(formula) => (
              <FormulaListRow formula={formula} sectionNames={sectionNames} allFormulas={formulas} />
            )}
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold leading-[26px] text-text-primary">Prayers</h2>
          <Link
            href="/prayers/new"
            className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
          >
            New Prayer
          </Link>
        </div>
        {prayers.length === 0 ? (
          <p className="text-sm text-text-muted">No prayers yet.</p>
        ) : (
          <BilingualGrid
            cells={prayerRows}
            renderItem={(prayer) => (
              <PrayerListRow prayer={prayer} sectionNames={sectionNames} allPrayers={allPrayers} />
            )}
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold leading-[26px] text-text-primary">Guides</h2>
        <p className="text-[13px] text-text-muted">
          Reference outlines shown next to "Add Prayer" on the Sections that need one (redesign-plan-v1.1.md
          §W) — never placed into a liturgy directly.
        </p>
        {guides.length === 0 ? (
          <p className="text-sm text-text-muted">No guides yet.</p>
        ) : (
          <div className="bg-surface border border-border rounded-lg px-6">
            {guides.map((guide) => (
              <PrayerListRow key={guide.id} prayer={guide} sectionNames={sectionNames} allPrayers={allPrayers} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold leading-[26px] text-text-primary">
            Existing Scripture
          </h2>
          <Link
            href="/selections/new"
            className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
          >
            New Scripture
          </Link>
        </div>
        <p className="text-[13px] text-text-muted">
          Auto-saved from every Scripture item added via the Reader, or added directly here.
        </p>
        {scriptureSelections.length === 0 ? (
          <p className="text-sm text-text-muted">No Scripture items added yet.</p>
        ) : (
          <BilingualGrid cells={scriptureRows} renderItem={(selection) => <ScriptureSelectionRow selection={selection} />} />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold leading-[26px] text-text-primary">Psalms</h2>
          <Link
            href="/songs/new"
            className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
          >
            New Song
          </Link>
        </div>
        {psalms.length === 0 ? (
          <p className="text-sm text-text-muted">No Psalms yet.</p>
        ) : (
          <BilingualGrid
            cells={psalmRows}
            renderItem={(song) => <SongListRow song={song} sectionNames={sectionNames} allSongs={songs} />}
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold leading-[26px] text-text-primary">Hymns</h2>
        {hymns.length === 0 ? (
          <p className="text-sm text-text-muted">No Hymns yet.</p>
        ) : (
          <BilingualGrid
            cells={hymnRows}
            renderItem={(song) => <SongListRow song={song} sectionNames={sectionNames} allSongs={songs} />}
          />
        )}
      </div>
    </div>
  );
}
