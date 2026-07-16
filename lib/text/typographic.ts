// Heuristic smart-quotes conversion, not a full typesetting engine — good enough
// for liturgical prose (contractions, quoted dialogue) per architecture.md's
// invariant that all liturgical text is normalized at write-time. Order matters:
// double quotes are fully resolved before single quotes/apostrophes are touched.
export function normalizeTypography(text: string): string {
  return text
    .replace(/(^|[\s([{—-])"/g, "$1“")
    .replace(/"/g, "”")
    .replace(/(\w)'/g, "$1’")
    .replace(/(^|[\s([{—-])'(?=\w)/g, "$1‘")
    .replace(/'/g, "’");
}
