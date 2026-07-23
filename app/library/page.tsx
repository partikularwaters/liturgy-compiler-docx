import Link from "next/link";
import { getFormulas } from "@/lib/formulas/getFormulas";
import { getPrayers } from "@/lib/prayers/getPrayers";
import { getScriptureSelections } from "@/lib/selections/getScriptureSelections";
import { getSongs } from "@/lib/songs/getSongs";
import { getSectionNames } from "@/lib/liturgy/getSectionNames";
import FormulaListRow from "@/components/formulas/FormulaListRow";
import PrayerListRow from "@/components/prayers/PrayerListRow";
import ScriptureSelectionRow from "@/components/selections/ScriptureSelectionRow";
import SongListRow from "@/components/songs/SongListRow";

// Always reads the live library data -- otherwise a just-saved edit can look
// reverted after router.refresh() if Next serves a cached fetch response
// instead of re-querying Supabase (same bug class fixed on the homepage).
export const dynamic = "force-dynamic";

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

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-8">
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
          <div className="bg-surface border border-border rounded-lg px-6">
            {formulas.map((formula) => (
              <FormulaListRow key={formula.id} formula={formula} sectionNames={sectionNames} />
            ))}
          </div>
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
          <div className="bg-surface border border-border rounded-lg px-6">
            {prayers.map((prayer) => (
              <PrayerListRow key={prayer.id} prayer={prayer} sectionNames={sectionNames} />
            ))}
          </div>
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
              <PrayerListRow key={guide.id} prayer={guide} sectionNames={sectionNames} />
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
          <div className="bg-surface border border-border rounded-lg px-6">
            {scriptureSelections.map((selection) => (
              <ScriptureSelectionRow key={selection.id} selection={selection} />
            ))}
          </div>
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
          <div className="bg-surface border border-border rounded-lg px-6">
            {psalms.map((song) => (
              <SongListRow key={song.id} song={song} sectionNames={sectionNames} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold leading-[26px] text-text-primary">Hymns</h2>
        {hymns.length === 0 ? (
          <p className="text-sm text-text-muted">No Hymns yet.</p>
        ) : (
          <div className="bg-surface border border-border rounded-lg px-6">
            {hymns.map((song) => (
              <SongListRow key={song.id} song={song} sectionNames={sectionNames} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
