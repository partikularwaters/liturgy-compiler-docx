// BA-family Compile View bug: AddSongPanel/AddPrayerPanel's handleSave used
// to route every non-"new" save through updateSong()/updatePrayer() -- which
// require Curator ownership for a Shared (owner_id: null) row -- even when
// the picked entry was placed unmodified. A Compiler placing any unmodified
// Shared Song/Prayer was rejected before ever reaching placement. Extracted
// here as a pure, testable decision: only route through the Curator-gated
// update action when a field actually changed from what was picked.

export interface PickedSong {
  title: string;
  attribution: string | null;
  yearPublished: string | null;
  notes: string | null;
}

export function songEntryUnchanged(
  original: PickedSong | undefined,
  current: { title: string; attribution: string; yearPublished: string; notes: string }
): boolean {
  return (
    !!original &&
    current.title === original.title &&
    current.attribution === (original.attribution ?? "") &&
    current.yearPublished === (original.yearPublished ?? "") &&
    current.notes === (original.notes ?? "")
  );
}

export function prayerEntryUnchanged(
  original: { text: string } | undefined,
  currentText: string
): boolean {
  return !!original && currentText === original.text;
}
