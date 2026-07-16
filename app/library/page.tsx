import Link from "next/link";
import { getFormulas } from "@/lib/formulas/getFormulas";
import { getPrayers } from "@/lib/prayers/getPrayers";
import { getScriptureSelections } from "@/lib/selections/getScriptureSelections";
import { getSectionNames } from "@/lib/liturgy/getSectionNames";
import FormulaListRow from "@/components/formulas/FormulaListRow";
import PrayerListRow from "@/components/prayers/PrayerListRow";
import ScriptureSelectionRow from "@/components/selections/ScriptureSelectionRow";

export default async function LibraryPage(): Promise<React.ReactElement> {
  const [formulas, prayers, scriptureSelections, sectionNames] = await Promise.all([
    getFormulas(),
    getPrayers(),
    getScriptureSelections(),
    getSectionNames(),
  ]);

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
        <h2 className="text-[18px] font-semibold leading-[26px] text-text-primary">
          Existing Selections
        </h2>
        <p className="text-[13px] text-text-muted">
          Auto-saved from every Selection added via the Reader — browse only, not directly editable.
        </p>
        {scriptureSelections.length === 0 ? (
          <p className="text-sm text-text-muted">No Selections added yet.</p>
        ) : (
          <div className="bg-surface border border-border rounded-lg px-6">
            {scriptureSelections.map((selection) => (
              <ScriptureSelectionRow key={selection.id} selection={selection} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold leading-[26px] text-text-primary">Songs</h2>
        <p className="text-sm text-text-muted">Psalm and Hymn library — coming in Feature 21.</p>
      </div>
    </div>
  );
}
