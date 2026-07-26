import type { CompiledSection, Formula, Song } from "@/types/liturgy";

// Shared by the Compile View and the PDF/docx exports so the displayed
// Section title (dynamic Psalm/Hymn or Affirmation/Covenant naming, posture
// asterisk) can't drift between them.
export function sectionTitle(section: CompiledSection, songs: Song[] = [], formulas: Formula[] = []): string {
  let label = section.name;

  if (section.dynamic_naming) {
    if (/^(Psalm|Hymn)\b/.test(section.name)) {
      // Feature 21: once a real Song item disambiguates the slot, resolve
      // "Psalm/Hymn of X" down to just "Psalm of X" or "Hymn of X" -- the
      // ambiguous label is a placeholder for "nothing placed yet," not a
      // permanent name. A mixed Section (both a Psalm and a Hymn placed)
      // falls back to the ambiguous form since neither alone is accurate.
      // Prefers each item's own snapshotted `kind` (see SongItem's comment)
      // over a live lookup, so this title can't drift from what the actually
      // placed Song item displays -- falls back to a live lookup only for a
      // liturgy placed before the snapshot fix shipped.
      const songKinds = new Set(
        section.items
          .filter((i) => i.type === "song")
          .map((i) => i.kind ?? songs.find((s) => s.id === i.songId)?.kind)
          .filter((kind): kind is "psalm" | "hymn" => kind !== undefined)
      );
      if (songKinds.size === 1) {
        const kind = [...songKinds][0];
        label = section.name.replace(/^(Psalm|Hymn)\b/, kind === "psalm" ? "Psalm" : "Hymn");
      } else {
        label = section.name.replace(/^(Psalm|Hymn)\b/, "Psalm/Hymn");
      }
    } else if (section.name === "Affirmation of Faith") {
      // Same mechanism as Psalm/Hymn above, generalized for Vesper's
      // Affirmation-of-Faith-or-Church-Covenant slot (2026-07-26 split of
      // what used to be one combined Section literally named "Affirmation
      // of Faith / Church Covenant"). Formula never snapshots identity
      // fields onto the placed item the way Song does (only its
      // `overrideText` freezes) -- see FormulaItem's own shape -- so this is
      // always a live lookup against the Formula library's own `kind`,
      // never a snapshot fallback. A missing/null `kind` defaults to
      // "affirmation," so every pre-existing Formula there (the Apostles'
      // Creed) needs no backfill.
      const formulaKinds = new Set(
        section.items
          .filter((i) => i.type === "formula")
          .map((i) => formulas.find((f) => f.id === i.formulaId)?.kind ?? "affirmation")
      );
      if (formulaKinds.size === 1) {
        label = [...formulaKinds][0] === "covenant" ? "Church Covenant" : "Affirmation of Faith";
      } else {
        label = "Affirmation of Faith / Church Covenant";
      }
    }
  }

  return section.posture === "standing" ? `${label} *` : label;
}
