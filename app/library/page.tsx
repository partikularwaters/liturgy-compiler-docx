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
import BilingualGrid from "@/components/library/BilingualGrid";
import { PlusIcon } from "@/components/liturgy/icons";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import type { Formula, Prayer, ScriptureSelection, Song } from "@/types/liturgy";

// Always reads the live library data -- otherwise a just-saved edit can look
// reverted after router.refresh() if Next serves a cached fetch response
// instead of re-querying Supabase (same bug class fixed on the homepage).
export const dynamic = "force-dynamic";

export default async function LibraryPage(): Promise<React.ReactElement> {
  const [
    allFormulasResult,
    allPrayersResult,
    scriptureSelections,
    allSongsResult,
    formulaSectionNames,
    prayerSectionNames,
    songSectionNames,
    currentUser,
  ] = await Promise.all([
    getFormulas(),
    getPrayers(),
    getScriptureSelections(),
    getSongs(),
    getSectionNames("formula"),
    getSectionNames("prayer"),
    getSectionNames("song"),
    getCurrentUser(),
  ]);
  // A dashboard-style browse page -- degrades gracefully on a library read
  // failure (that one category shows empty) rather than failing the whole
  // page, matching the existing precedent for getLiturgies.ts.
  const allFormulas = allFormulasResult ?? [];
  const allPrayers = allPrayersResult ?? [];
  const allSongs = allSongsResult ?? [];

  // This page is the public, browse-anywhere Shared Library -- everyone's
  // own unpromoted drafts/forks (ownerId set) belong in /my-library instead,
  // never mixed in here where an anonymous visitor or another Compiler could
  // see them (task 6's picker got this same fix; this page had the identical
  // gap and was missed when Formula/Prayer/Song ownership shipped).
  const formulas = allFormulas.filter((f) => !f.ownerId);
  const songs = allSongs.filter((s) => !s.ownerId);
  const psalms = songs.filter((s) => s.kind === "psalm");
  const hymns = songs.filter((s) => s.kind === "hymn");

  const sharedPrayers = allPrayers.filter((p) => !p.ownerId);
  const prayers = sharedPrayers.filter((p) => !p.isGuide);
  const guides = sharedPrayers.filter((p) => p.isGuide);

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
      <h1 className="font-serif-body text-[28px] font-bold leading-9 text-text-primary [font-variant:small-caps]">
        Library
      </h1>

      {/* task 13: pure-CSS AB/BSB toggle for narrow screens -- see the
          matching [data-translation] rules in app/globals.css. Radio inputs
          need no JavaScript at all; hidden here, their :checked state
          reaches into #library-grids below via a sibling selector. */}
      <input type="radio" id="lib-lang-fil" name="lib-lang" defaultChecked className="sr-only" />
      <input type="radio" id="lib-lang-en" name="lib-lang" className="sr-only" />
      <div className="md:hidden flex gap-2 self-start rounded-md border border-border overflow-hidden text-sm font-medium">
        <label htmlFor="lib-lang-fil" className="lib-lang-label px-3 py-1.5 cursor-pointer bg-surface text-text-secondary hover:bg-surface-secondary transition-colors duration-[var(--duration-tooltip)] ease">
          AB / Filipino
        </label>
        <label htmlFor="lib-lang-en" className="lib-lang-label px-3 py-1.5 cursor-pointer bg-surface text-text-secondary hover:bg-surface-secondary transition-colors duration-[var(--duration-tooltip)] ease">
          BSB / English
        </label>
      </div>

      <div id="library-grids" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold leading-[26px] text-text-primary">
            Existing Scripture
          </h2>
          {currentUser && (
            <Link
              href="/selections/new"
              className="flex items-center gap-1 bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
            >
              <PlusIcon size={15} /> New Scripture
            </Link>
          )}
        </div>
        <p className="text-[13px] text-text-muted">
          Auto-saved from every Scripture item added via the Reader, or added directly here.
        </p>
        {scriptureSelections.length === 0 ? (
          <p className="text-sm text-text-muted">No Scripture items added yet.</p>
        ) : (
          <BilingualGrid
            cells={scriptureRows}
            renderItem={(selection) => <ScriptureSelectionRow selection={selection} bordered={false} currentUser={currentUser} />}
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold leading-[26px] text-text-primary">Psalms</h2>
          {currentUser && (
            <Link
              href="/songs/new"
              className="flex items-center gap-1 bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
            >
              <PlusIcon size={15} /> New Song
            </Link>
          )}
        </div>
        {psalms.length === 0 ? (
          <p className="text-sm text-text-muted">No Psalms yet.</p>
        ) : (
          <BilingualGrid
            cells={psalmRows}
            renderItem={(song) => (
              <SongListRow song={song} sectionNames={songSectionNames} allSongs={songs} bordered={false} currentUser={currentUser} />
            )}
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
            renderItem={(song) => (
              <SongListRow song={song} sectionNames={songSectionNames} allSongs={songs} bordered={false} currentUser={currentUser} />
            )}
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold leading-[26px] text-text-primary">Prayers</h2>
          {currentUser && (
            <Link
              href="/prayers/new"
              className="flex items-center gap-1 bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
            >
              <PlusIcon size={15} /> New Prayer
            </Link>
          )}
        </div>
        {prayers.length === 0 ? (
          <p className="text-sm text-text-muted">No prayers yet.</p>
        ) : (
          <BilingualGrid
            cells={prayerRows}
            renderItem={(prayer) => (
              <PrayerListRow prayer={prayer} sectionNames={prayerSectionNames} allPrayers={sharedPrayers} bordered={false} currentUser={currentUser} />
            )}
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold leading-[26px] text-text-primary">Guides</h2>
        <p className="text-[13px] text-text-muted">
          Reference outlines shown next to “Add Prayer” on the Sections that need one (redesign-plan-v1.1.md
          §W) — never placed into a liturgy directly.
        </p>
        {guides.length === 0 ? (
          <p className="text-sm text-text-muted">No guides yet.</p>
        ) : (
          <div className="bg-surface border border-border rounded-lg px-6">
            {guides.map((guide) => (
              <PrayerListRow key={guide.id} prayer={guide} sectionNames={prayerSectionNames} allPrayers={sharedPrayers} currentUser={currentUser} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold leading-[26px] text-text-primary">Formulas</h2>
          {currentUser && (
            <Link
              href="/formulas/new"
              className="flex items-center gap-1 bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
            >
              <PlusIcon size={15} /> New Formula
            </Link>
          )}
        </div>
        {formulas.length === 0 ? (
          <p className="text-sm text-text-muted">No formulas yet.</p>
        ) : (
          <BilingualGrid
            cells={formulaRows}
            renderItem={(formula) => (
              <FormulaListRow formula={formula} sectionNames={formulaSectionNames} allFormulas={formulas} bordered={false} currentUser={currentUser} />
            )}
          />
        )}
      </div>
      </div>
    </div>
  );
}
