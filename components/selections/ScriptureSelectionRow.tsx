import type { ScriptureSelection } from "@/types/liturgy";

interface ScriptureSelectionRowProps {
  selection: ScriptureSelection;
}

// Read-only -- Existing Selections are a reference cache auto-populated by
// addSelectionAction, not a source of truth like Formula/Prayer, so there's
// no edit affordance here (no updateScriptureSelection action exists).
export default function ScriptureSelectionRow({
  selection,
}: ScriptureSelectionRowProps): React.ReactElement {
  return (
    <div className="border-b border-border py-4">
      <p className="text-[13px] text-text-secondary">{selection.sectionName}</p>
      <p className="text-sm font-medium text-text-primary mt-1">{selection.citation}</p>
      <p className="text-sm text-text-secondary mt-1">{selection.text}</p>
    </div>
  );
}
