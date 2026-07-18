import type { CompiledSection, Song } from "@/types/liturgy";

// Shared by the Compile View and the PDF export so the displayed Section
// title (dynamic Psalm/Hymn naming, posture asterisk) can't drift between them.
export function sectionTitle(section: CompiledSection, songs: Song[] = []): string {
  let label = section.name;

  if (section.dynamic_naming) {
    // Feature 21: once a real Song item disambiguates the slot, resolve
    // "Psalm/Hymn of X" down to just "Psalm of X" or "Hymn of X" -- the
    // ambiguous label is a placeholder for "nothing placed yet," not a
    // permanent name. A mixed Section (both a Psalm and a Hymn placed)
    // falls back to the ambiguous form since neither alone is accurate.
    // SongItem only carries `songId`, so the kind has to come from a lookup
    // against the full songs list rather than the item itself.
    const songKinds = new Set(
      section.items
        .filter((i) => i.type === "song")
        .map((i) => songs.find((s) => s.id === i.songId)?.kind)
        .filter((kind): kind is "psalm" | "hymn" => kind !== undefined)
    );
    if (songKinds.size === 1) {
      const kind = [...songKinds][0];
      label = section.name.replace(/^(Psalm|Hymn)\b/, kind === "psalm" ? "Psalm" : "Hymn");
    } else {
      label = section.name.replace(/^(Psalm|Hymn)\b/, "Psalm/Hymn");
    }
  }

  return section.posture === "standing" ? `${label} *` : label;
}
