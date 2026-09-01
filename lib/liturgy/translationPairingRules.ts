export type PairableTable = "formulas" | "prayers" | "songs";

export interface PairingRow {
  id: string;
  paired_id: string | null;
  translation: "fil" | "en" | null;
  section_name?: string;
  kind?: string | null;
  is_guide?: boolean | null;
}

function hasOppositeTranslations(current: PairingRow, target: PairingRow): boolean {
  return (
    (current.translation === "fil" && target.translation === "en") ||
    (current.translation === "en" && target.translation === "fil")
  );
}

export function isValidTranslationPair(table: PairableTable, current: PairingRow, target: PairingRow): boolean {
  if (!hasOppositeTranslations(current, target)) return false;

  if (table === "songs") return current.kind === target.kind;
  if (table === "formulas") {
    return current.section_name === target.section_name && (current.kind ?? null) === (target.kind ?? null);
  }
  return current.section_name === target.section_name && (current.is_guide ?? false) === (target.is_guide ?? false);
}
