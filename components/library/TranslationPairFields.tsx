"use client";

interface TranslationPairCandidate {
  id: string;
  label: string;
}

interface TranslationPairFieldsProps {
  translation: "fil" | "en" | null;
  onTranslationChange: (translation: "fil" | "en" | null) => void;
  pairedId: string | null;
  onPairedIdChange: (pairedId: string | null) => void;
  candidates: TranslationPairCandidate[];
}

// Shared by FormulaForm/PrayerForm/SongForm -- unlike Scripture, there's no
// canonical key to auto-match a translation companion against (see
// lib/liturgy/translationPairing.ts), so this is a plain language tag plus
// an explicit "link to" picker, never auto-detection. `candidates` is
// pre-filtered by the caller to same-Section, opposite-language entries of
// the same library type, excluding this entry itself.
export default function TranslationPairFields({
  translation,
  onTranslationChange,
  pairedId,
  onPairedIdChange,
  candidates,
}: TranslationPairFieldsProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-3 border border-border rounded-md p-3 bg-surface-secondary">
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="translation-select">
          Language
        </label>
        <select
          id="translation-select"
          value={translation ?? ""}
          onChange={(e) => onTranslationChange(e.target.value === "" ? null : (e.target.value as "fil" | "en"))}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        >
          <option value="">Not yet tagged</option>
          <option value="fil">Filipino</option>
          <option value="en">English</option>
        </select>
      </div>
      {candidates.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-text-secondary" htmlFor="paired-select">
            Translation of
          </label>
          <select
            id="paired-select"
            value={pairedId ?? ""}
            onChange={(e) => onPairedIdChange(e.target.value === "" ? null : e.target.value)}
            className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
          >
            <option value="">Not linked</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
